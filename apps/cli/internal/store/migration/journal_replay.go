package migration

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
)

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
	undone := make(map[int]bool)
	for _, e := range entries {
		if e.Op == "undo" {
			undone[e.ID] = true
		}
	}
	for i := len(entries) - 1; i >= 0; i-- {
		e := entries[i]
		if e.Op == "undo" || undone[e.ID] {
			continue
		}
		if e.Op == "checkpoint" {
			if stopAtCheckpointAfter != 0 && e.Migration <= stopAtCheckpointAfter {
				return nil
			}
			continue
		}
		if err := undo(dataDir, e); err != nil {
			return fmt.Errorf("undo entry %d (%s): %w", e.ID, e.Op, err)
		}
		// Persist per-operation progress before reversing the next operation.
		// This prevents a later recovery from removing a directory restored by
		// an earlier rename when a mkdir at that path was already undone.
		f, err := os.OpenFile(path, os.O_WRONLY|os.O_APPEND, 0644)
		if err != nil {
			return err
		}
		_, writeErr := fmt.Fprintf(f, "{\"id\":%d,\"op\":\"undo\"}\n", e.ID)
		syncErr := f.Sync()
		if err := errors.Join(writeErr, syncErr, f.Close()); err != nil {
			return err
		}
	}
	return nil
}

func undo(dataDir string, e journalEntry) error {
	root, err := filepath.Abs(dataDir)
	if err != nil {
		return err
	}
	j := &Journal{dataDir: root}
	for _, path := range []string{e.From, e.To, e.Path, e.Trash} {
		if path != "" {
			if _, err := j.rel(path); err != nil {
				return err
			}
		}
	}
	switch e.Op {
	case "mkdir":
		path := filepath.Join(dataDir, filepath.FromSlash(e.Path))
		info, err := os.Lstat(path)
		if errors.Is(err, os.ErrNotExist) {
			return nil
		}
		if err != nil {
			return err
		}
		if !info.IsDir() {
			return fmt.Errorf("cannot undo mkdir: %s is no longer a directory", path)
		}
		// Remove only an empty directory. Unexpected contents must stop
		// recovery rather than being recursively discarded.
		return os.Remove(path)
	case "rename":
		from := filepath.Join(dataDir, filepath.FromSlash(e.From))
		to := filepath.Join(dataDir, filepath.FromSlash(e.To))
		if _, err := os.Lstat(to); errors.Is(err, os.ErrNotExist) {
			return nil
		}
		if err := os.MkdirAll(filepath.Dir(from), 0755); err != nil {
			return err
		}
		return os.Rename(to, from)
	case "trash":
		orig := filepath.Join(dataDir, filepath.FromSlash(e.Path))
		stash := filepath.Join(dataDir, filepath.FromSlash(e.Trash))
		if _, err := os.Lstat(stash); errors.Is(err, os.ErrNotExist) {
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
