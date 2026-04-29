package migration

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
)

// LockState is the JSON content of upgrade.lock. It records what the upgrade
// attempt was trying to do so a recovery on next start can roll back to From.
type LockState struct {
	From        int   `json:"from"`
	To          int   `json:"to"`
	Started     int64 `json:"started"`
	PID         int   `json:"pid"`
	LastApplied int   `json:"lastApplied"`
}

// Recover detects a half-finished upgrade left by a crashed previous run and
// restores the data dir to the pre-upgrade state. No-op when there's no lock.
//
// Steps:
//  1. Read upgrade.lock; if absent, return nil.
//  2. If db.backup exists, copy it over data/db (and drop WAL/SHM).
//  3. Replay journal in reverse to undo file ops.
//  4. Delete lock, journal, db.backup, upgrade.trash.
//  5. data/v stays at LockState.From because the runner only writes the new
//     version after every step succeeded.
func Recover(dataDir string) error {
	lockPath := filepath.Join(dataDir, "upgrade.lock")
	state, err := readLock(lockPath)
	if errors.Is(err, os.ErrNotExist) {
		return nil
	}
	if err != nil {
		return fmt.Errorf("read upgrade.lock: %w", err)
	}

	dbPath := filepath.Join(dataDir, "db")
	backupPath := filepath.Join(dataDir, "db.backup")
	if _, err := os.Stat(backupPath); err == nil {
		if err := RestoreDB(backupPath, dbPath); err != nil {
			return fmt.Errorf("restore db: %w", err)
		}
	} else if !errors.Is(err, os.ErrNotExist) {
		return fmt.Errorf("stat db.backup: %w", err)
	}

	if err := ReplayReverse(dataDir, 0); err != nil {
		return fmt.Errorf("replay journal: %w", err)
	}

	if err := cleanupArtifacts(dataDir); err != nil {
		return fmt.Errorf("cleanup: %w", err)
	}

	fmt.Fprintf(os.Stderr,
		"data upgrade was interrupted (was migrating %d -> %d, pid %d); rolled back to %d\n",
		state.From, state.To, state.PID, state.From,
	)
	return nil
}

func readLock(path string) (*LockState, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var s LockState
	if err := json.Unmarshal(b, &s); err != nil {
		return nil, fmt.Errorf("parse upgrade.lock: %w", err)
	}
	return &s, nil
}

func writeLock(path string, s LockState) error {
	tmp := path + ".tmp"
	b, err := json.Marshal(s)
	if err != nil {
		return err
	}
	if err := os.WriteFile(tmp, b, 0644); err != nil {
		return err
	}
	return os.Rename(tmp, path)
}

func cleanupArtifacts(dataDir string) error {
	for _, p := range []string{
		filepath.Join(dataDir, "upgrade.lock"),
		filepath.Join(dataDir, "upgrade.journal"),
		filepath.Join(dataDir, "db.backup"),
	} {
		if err := os.Remove(p); err != nil && !errors.Is(err, os.ErrNotExist) {
			return err
		}
	}
	if err := os.RemoveAll(filepath.Join(dataDir, "upgrade.trash")); err != nil {
		return err
	}
	return nil
}
