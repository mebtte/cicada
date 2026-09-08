package migration

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
)

// LockState is the JSON content of upgrade.lock. It records what the upgrade
// attempt was trying to do so the next start can roll back to From or finish
// cleanup after the version commit.
type LockState struct {
	From        int   `json:"from"`
	To          int   `json:"to"`
	Started     int64 `json:"started"`
	PID         int   `json:"pid"`
	LastApplied int   `json:"lastApplied"`
	// RolledBack makes artifact cleanup retryable without replaying file
	// operations that have already been reversed.
	RolledBack bool `json:"rolledBack,omitempty"`
}

// Recover detects a half-finished upgrade left by a crashed previous run and
// restores the data dir to the pre-upgrade state. Once data/v contains the
// target version, the upgrade is committed and recovery only finishes cleanup.
// No-op when there's no lock.
func Recover(dataDir string) error {
	lockPath := filepath.Join(dataDir, "upgrade.lock")
	state, err := readLock(lockPath)
	if errors.Is(err, os.ErrNotExist) {
		return nil
	}
	if err != nil {
		return fmt.Errorf("read upgrade.lock: %w", err)
	}
	version, exists, err := readVersion(filepath.Join(dataDir, "v"))
	if err != nil {
		return err
	}
	if (exists && version == state.To) || state.RolledBack {
		// The version stamp is the commit boundary. Restoring a backup now
		// would combine an old database with the newly stamped data version.
		if err := cleanupArtifacts(dataDir); err != nil {
			return fmt.Errorf("finish upgrade cleanup: %w", err)
		}
		return nil
	}
	if exists && version != state.From {
		return fmt.Errorf("cannot recover upgrade %d -> %d with data version %d", state.From, state.To, version)
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
	if err := writeVersion(filepath.Join(dataDir, "v"), state.From); err != nil {
		return fmt.Errorf("restore data version: %w", err)
	}
	state.RolledBack = true
	if err := writeLock(lockPath, *state); err != nil {
		return fmt.Errorf("record rollback completion: %w", err)
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
	// Retain the lock until every artifact has been removed so the next
	// startup retries cleanup even if the version has already been stamped.
	if err := os.RemoveAll(filepath.Join(dataDir, "upgrade.trash")); err != nil {
		return err
	}
	for _, p := range []string{
		filepath.Join(dataDir, "upgrade.journal"),
		filepath.Join(dataDir, "db.backup"),
		filepath.Join(dataDir, "upgrade.lock"),
	} {
		if err := os.Remove(p); err != nil && !errors.Is(err, os.ErrNotExist) {
			return err
		}
	}
	return nil
}
