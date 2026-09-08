package migration

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
)

// CheckScratchVersion performs read-only startup validation before data cleanup.
// Missing v means the initial scratch layout; incompatible metadata never causes
// automatic deletion or downgrading of device-local contents.
func CheckScratchVersion(dir string, target int) error {
	if target < ScratchBaselineVersion {
		return fmt.Errorf("scratch target version %d predates baseline %d", target, ScratchBaselineVersion)
	}
	hasArtifacts := false
	for _, name := range []string{"v", "v.tmp", "upgrade.lock", "upgrade.lock.tmp", "upgrade.journal", "upgrade.trash"} {
		info, err := os.Lstat(filepath.Join(dir, name))
		if errors.Is(err, os.ErrNotExist) {
			continue
		}
		if err != nil {
			return fmt.Errorf("inspect scratch %s: %w", name, err)
		}
		if (name == "upgrade.trash" && !info.IsDir()) || (name != "upgrade.trash" && !info.Mode().IsRegular()) {
			return fmt.Errorf("scratch %s has an invalid file type (symlinks are not allowed)", name)
		}
		if name == "upgrade.journal" || name == "upgrade.trash" {
			hasArtifacts = true
		}
	}
	current, exists, err := readVersion(filepath.Join(dir, "v"))
	if err != nil {
		return fmt.Errorf("read scratch version: %w", err)
	}
	if !exists {
		current = ScratchBaselineVersion
	}
	if current < ScratchBaselineVersion || current > target {
		return fmt.Errorf("scratch version %d is incompatible with data version %d (minimum %d)", current, target, ScratchBaselineVersion)
	}
	if err := validateChain(pendingMigrations(current, target), current, target); err != nil {
		return fmt.Errorf("scratch migration chain: %w", err)
	}
	state, err := readLock(filepath.Join(dir, "upgrade.lock"))
	if errors.Is(err, os.ErrNotExist) {
		if hasArtifacts {
			return fmt.Errorf("scratch upgrade artifacts exist without upgrade.lock; recovery state is missing")
		}
		return nil
	}
	if err != nil {
		return fmt.Errorf("read scratch upgrade lock: %w", err)
	}
	if state.From < ScratchBaselineVersion || state.To <= state.From || state.To > target ||
		(current != state.From && current != state.To) {
		return fmt.Errorf("scratch upgrade %d -> %d is incompatible with scratch version %d and data version %d", state.From, state.To, current, target)
	}
	if current != state.To && !state.RolledBack {
		if _, err := readEntries(filepath.Join(dir, "upgrade.journal")); err != nil && !errors.Is(err, os.ErrNotExist) {
			return fmt.Errorf("read scratch recovery journal: %w", err)
		}
	}
	return nil
}

func recoverScratch(dir string) error {
	state, err := readLock(filepath.Join(dir, "upgrade.lock"))
	if errors.Is(err, os.ErrNotExist) {
		return nil
	}
	if err != nil {
		return err
	}
	current, exists, err := readVersion(filepath.Join(dir, "v"))
	if err != nil {
		return err
	}
	if !exists {
		current = ScratchBaselineVersion
	}
	if current != state.To && !state.RolledBack {
		if err := ReplayReverse(dir, 0); err != nil {
			return fmt.Errorf("restore scratch files: %w", err)
		}
		state.RolledBack = true
		if err := writeLock(filepath.Join(dir, "upgrade.lock"), *state); err != nil {
			return err
		}
	}
	return cleanupScratchArtifacts(dir)
}

func cleanupScratchArtifacts(dir string) error {
	// Scratch has no database backup. Never reuse data cleanup here: even an
	// unrelated file named db.backup must survive a scratch-only migration.
	if err := os.RemoveAll(filepath.Join(dir, "upgrade.trash")); err != nil {
		return fmt.Errorf("remove scratch upgrade trash: %w", err)
	}
	for _, name := range []string{"upgrade.journal", "upgrade.lock"} {
		if err := os.Remove(filepath.Join(dir, name)); err != nil && !errors.Is(err, os.ErrNotExist) {
			return fmt.Errorf("remove scratch %s: %w", name, err)
		}
	}
	return nil
}
