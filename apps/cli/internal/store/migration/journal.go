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
//	{"id":N,"op":"checkpoint","migration":VER}
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
	path := filepath.Join(dataDir, "upgrade.journal")
	trash := filepath.Join(dataDir, "upgrade.trash")
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
	if err := j.write(journalEntry{ID: j.id(), Op: "rename", From: relFrom, To: relTo}); err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(to), 0755); err != nil {
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

func (j *Journal) rel(p string) (string, error) {
	if !filepath.IsAbs(p) {
		p = filepath.Join(j.dataDir, p)
	}
	rel, err := filepath.Rel(j.dataDir, p)
	if err != nil {
		return "", fmt.Errorf("path %s outside data dir: %w", p, err)
	}
	return filepath.ToSlash(rel), nil
}

// ReplayReverse undoes every entry in the journal in reverse order, stopping
// after it has processed every line. Idempotent: missing files are skipped.
// Used by Recover (full journal) and runner (single-migration suffix on tx
// rollback).
//
// stopAtCheckpointAfter, when non-zero, makes replay stop once it has
// processed entries belonging to migrations strictly greater than the given
// version (i.e. it undoes the in-flight migration's tail and stops). Pass 0
// to undo everything.
func ReplayReverse(dataDir string, stopAtCheckpointAfter int) error {
	path := filepath.Join(dataDir, "upgrade.journal")
	entries, err := readEntries(path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil
		}
		return err
	}
	for i := len(entries) - 1; i >= 0; i-- {
		e := entries[i]
		if e.Op == "checkpoint" {
			if stopAtCheckpointAfter != 0 && e.Migration <= stopAtCheckpointAfter {
				return nil
			}
			continue
		}
		if err := undo(dataDir, e); err != nil {
			return fmt.Errorf("undo entry %d (%s): %w", e.ID, e.Op, err)
		}
	}
	return nil
}

func undo(dataDir string, e journalEntry) error {
	switch e.Op {
	case "rename":
		from := filepath.Join(dataDir, filepath.FromSlash(e.From))
		to := filepath.Join(dataDir, filepath.FromSlash(e.To))
		if _, err := os.Stat(to); errors.Is(err, os.ErrNotExist) {
			return nil
		}
		if err := os.MkdirAll(filepath.Dir(from), 0755); err != nil {
			return err
		}
		return os.Rename(to, from)
	case "trash":
		orig := filepath.Join(dataDir, filepath.FromSlash(e.Path))
		stash := filepath.Join(dataDir, filepath.FromSlash(e.Trash))
		if _, err := os.Stat(stash); errors.Is(err, os.ErrNotExist) {
			return nil
		}
		if err := os.MkdirAll(filepath.Dir(orig), 0755); err != nil {
			return err
		}
		return os.Rename(stash, orig)
	default:
		return fmt.Errorf("unknown op %q", e.Op)
	}
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
