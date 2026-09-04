package migration

import (
	"bufio"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
)

// Journal records reversible filesystem operations during a migration run.
// Migrations must use it instead of touching os.Rename / os.Remove directly,
// so a crash or migration error can be undone in reverse order.
//
// Format: append-only JSONL at upgrade.journal. Each line is one entry.
// Entries:
//
//	{"id":N,"op":"rename","from":"REL","to":"REL"}
//	{"id":N,"op":"trash","path":"REL","trash":"upgrade.trash/N-base"}
//	{"id":N,"op":"mkdir","path":"REL"}
//	{"id":N,"op":"checkpoint","migration":VER}
//	{"id":N,"op":"undo"} // operation N has been reversed
//
// Paths are stored relative to data dir for portability.
type Journal struct {
	dataDir string
	path    string
	trash   string
	f       *os.File
	w       *bufio.Writer
	nextID  int
}

type journalEntry struct {
	ID        int    `json:"id"`
	Op        string `json:"op"`
	From      string `json:"from,omitempty"`
	To        string `json:"to,omitempty"`
	Path      string `json:"path,omitempty"`
	Trash     string `json:"trash,omitempty"`
	Migration int    `json:"migration,omitempty"`
}

// OpenJournal opens (creating if needed) the journal file in append mode.
// Existing entries are scanned to compute the next id.
func OpenJournal(dataDir string) (*Journal, error) {
	dataDir, err := filepath.Abs(dataDir)
	if err != nil {
		return nil, err
	}
	path := filepath.Join(dataDir, "upgrade.journal")
	trash := filepath.Join(dataDir, "upgrade.trash")
	for _, artifact := range []string{path, trash} {
		info, err := os.Lstat(artifact)
		if os.IsNotExist(err) {
			continue
		}
		if err != nil {
			return nil, err
		}
		if (artifact == path && !info.Mode().IsRegular()) || (artifact == trash && !info.IsDir()) {
			return nil, fmt.Errorf("invalid journal artifact %s: symlinks and unexpected file types are not allowed", artifact)
		}
	}
	if err := os.MkdirAll(trash, 0755); err != nil {
		return nil, fmt.Errorf("mkdir upgrade.trash: %w", err)
	}
	nextID := 1
	if entries, err := readEntries(path); err == nil {
		for _, e := range entries {
			if e.ID >= nextID {
				nextID = e.ID + 1
			}
		}
	} else if !errors.Is(err, os.ErrNotExist) {
		return nil, err
	}
	f, err := os.OpenFile(path, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		return nil, fmt.Errorf("open journal: %w", err)
	}
	return &Journal{
		dataDir: dataDir,
		path:    path,
		trash:   trash,
		f:       f,
		w:       bufio.NewWriter(f),
		nextID:  nextID,
	}, nil
}

// Close flushes and closes the journal file. Safe to call multiple times.
func (j *Journal) Close() error {
	if j.f == nil {
		return nil
	}
	if err := j.w.Flush(); err != nil {
		return err
	}
	if err := j.f.Sync(); err != nil {
		return err
	}
	err := j.f.Close()
	j.f = nil
	return err
}

// Rename renames a file inside DataDir, recording it in the journal first so
// it can be reversed. Both paths must be absolute or under DataDir.
func (j *Journal) Rename(from, to string) error {
	relFrom, err := j.rel(from)
	if err != nil {
		return err
	}
	relTo, err := j.rel(to)
	if err != nil {
		return err
	}
	from, to = j.absolute(relFrom), j.absolute(relTo)
	// Recovery may reverse the intent even if Rename never ran. Require a
	// source and an unused destination so it cannot mistake an existing target
	// for this operation's output. Journal renames never overwrite entries.
	if _, err := os.Lstat(from); err != nil {
		return fmt.Errorf("inspect rename source %s: %w", from, err)
	}
	if _, err := os.Lstat(to); err == nil {
		return fmt.Errorf("rename target %s already exists", to)
	} else if !errors.Is(err, os.ErrNotExist) {
		return fmt.Errorf("inspect rename target %s: %w", to, err)
	}
	// Record parent creation before the rename intent so reverse replay first
	// restores the moved entry, then removes the newly created empty parents.
	if err := j.mkdirParents(filepath.Dir(to)); err != nil {
		return err
	}
	if err := j.write(journalEntry{ID: j.id(), Op: "rename", From: relFrom, To: relTo}); err != nil {
		return err
	}
	return os.Rename(from, to)
}

// Trash moves a file into upgrade.trash so it can be restored on rollback,
// instead of os.Remove which would be irreversible.
func (j *Journal) Trash(path string) error {
	relPath, err := j.rel(path)
	if err != nil {
		return err
	}
	path = j.absolute(relPath)
	id := j.id()
	stashName := fmt.Sprintf("%d-%s", id, filepath.Base(path))
	stashAbs := filepath.Join(j.trash, stashName)
	relStash, err := j.rel(stashAbs)
	if err != nil {
		return err
	}
	if err := j.write(journalEntry{ID: id, Op: "trash", Path: relPath, Trash: relStash}); err != nil {
		return err
	}
	return os.Rename(path, stashAbs)
}

// Mkdir creates one directory and records it for rollback. Existing real
// directories are preserved. Its parent must already exist.
func (j *Journal) Mkdir(path string) error {
	rel, err := j.rel(path)
	if err != nil {
		return err
	}
	path = j.absolute(rel)
	if info, err := os.Lstat(path); err == nil {
		if !info.IsDir() {
			return fmt.Errorf("%s must be a directory, not a file or symlink", path)
		}
		return nil
	} else if !errors.Is(err, os.ErrNotExist) {
		return err
	}
	if err := j.write(journalEntry{ID: j.id(), Op: "mkdir", Path: rel}); err != nil {
		return err
	}
	return os.Mkdir(path, 0755)
}

// Checkpoint marks the boundary between two migrations. Used by Recover to
// know which entries belong to the partially-applied last migration.
func (j *Journal) Checkpoint(migration int) error {
	return j.write(journalEntry{ID: j.id(), Op: "checkpoint", Migration: migration})
}

func (j *Journal) write(e journalEntry) error {
	b, err := json.Marshal(e)
	if err != nil {
		return err
	}
	if _, err := j.w.Write(b); err != nil {
		return err
	}
	if err := j.w.WriteByte('\n'); err != nil {
		return err
	}
	if err := j.w.Flush(); err != nil {
		return err
	}
	return j.f.Sync()
}

func (j *Journal) id() int {
	id := j.nextID
	j.nextID++
	return id
}

func readEntries(path string) ([]journalEntry, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	var out []journalEntry
	r := bufio.NewReader(f)
	for {
		line, err := r.ReadBytes('\n')
		if len(line) > 0 {
			var e journalEntry
			if err := json.Unmarshal(trimNewline(line), &e); err != nil {
				return nil, fmt.Errorf("parse journal line: %w", err)
			}
			out = append(out, e)
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}
	}
	return out, nil
}

func trimNewline(b []byte) []byte {
	for len(b) > 0 && (b[len(b)-1] == '\n' || b[len(b)-1] == '\r') {
		b = b[:len(b)-1]
	}
	return b
}
