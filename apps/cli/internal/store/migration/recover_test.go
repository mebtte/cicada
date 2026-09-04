package migration

import (
	"database/sql"
	"errors"
	"os"
	"path/filepath"
	"testing"
)

// interruptedUpgrade leaves the same artifacts as a crash after the final DB
// transaction and journal checkpoint, optionally after the version commit.
func interruptedUpgrade(t *testing.T, committed bool) string {
	t.Helper()
	dir := t.TempDir()
	initDB(t, dir)
	writeV(t, dir, 122)
	if err := BackupDB(filepath.Join(dir, "db"), filepath.Join(dir, "db.backup")); err != nil {
		t.Fatal(err)
	}
	writeScratchFixture(t, filepath.Join(dir, "cache/music"))
	j, err := OpenJournal(dir)
	if err != nil {
		t.Fatal(err)
	}
	if err := j.Trash(filepath.Join(dir, "cache")); err != nil {
		t.Fatal(err)
	}
	if err := j.Checkpoint(123); err != nil {
		t.Fatal(err)
	}
	if err := j.Close(); err != nil {
		t.Fatal(err)
	}
	db, err := sql.Open("sqlite", filepath.Join(dir, "db"))
	if err != nil {
		t.Fatal(err)
	}
	if _, err := db.Exec(`UPDATE canary SET n=99`); err != nil {
		t.Fatal(err)
	}
	if err := db.Close(); err != nil {
		t.Fatal(err)
	}
	if err := writeLock(filepath.Join(dir, "upgrade.lock"), LockState{From: 122, To: 123, LastApplied: 123}); err != nil {
		t.Fatal(err)
	}
	if committed {
		writeV(t, dir, 123)
	}
	return dir
}

func TestRecover_BeforeVersionCommitRestoresData(t *testing.T) {
	dir := interruptedUpgrade(t, false)
	if err := Recover(dir); err != nil {
		t.Fatal(err)
	}
	if got := canaryValue(t, dir); got != 42 {
		t.Fatalf("database not restored: %d", got)
	}
	if _, err := os.Stat(filepath.Join(dir, "cache/music")); err != nil {
		t.Fatalf("cache not restored: %v", err)
	}
	if got, _ := readV(t, dir); got != 122 {
		t.Fatalf("version = %d, want 122", got)
	}
}

func TestRecover_CommittedCleanupFailureIsRetryable(t *testing.T) {
	dir := interruptedUpgrade(t, true)
	// A non-empty backup directory deterministically fails os.Remove on every
	// platform, without relying on permission behavior of the test user.
	backup := filepath.Join(dir, "db.backup")
	if err := os.Rename(backup, backup+".saved"); err != nil {
		t.Fatal(err)
	}
	writeScratchFixture(t, filepath.Join(backup, "blocker"))
	if err := Recover(dir); err == nil {
		t.Fatal("expected cleanup failure")
	}
	if _, err := os.Stat(filepath.Join(dir, "upgrade.lock")); err != nil {
		t.Fatalf("cleanup lost retry marker: %v", err)
	}
	if got := canaryValue(t, dir); got != 99 {
		t.Fatalf("committed database rolled back: %d", got)
	}
	if _, err := os.Lstat(filepath.Join(dir, "cache")); !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("committed deletion rolled back: %v", err)
	}
	if err := os.Remove(filepath.Join(backup, "blocker")); err != nil {
		t.Fatal(err)
	}
	if err := Recover(dir); err != nil {
		t.Fatalf("cleanup retry: %v", err)
	}
	if got, _ := readV(t, dir); got != 123 {
		t.Fatalf("committed version changed: %d", got)
	}
	for _, name := range []string{"upgrade.lock", "upgrade.journal", "upgrade.trash", "db.backup"} {
		if _, err := os.Stat(filepath.Join(dir, name)); !errors.Is(err, os.ErrNotExist) {
			t.Fatalf("%s not cleaned: %v", name, err)
		}
	}
}

func TestRecover_RolledBackCleanupDoesNotRestoreAgain(t *testing.T) {
	dir := interruptedUpgrade(t, false)
	if err := RestoreDB(filepath.Join(dir, "db.backup"), filepath.Join(dir, "db")); err != nil {
		t.Fatal(err)
	}
	if err := ReplayReverse(dir, 0); err != nil {
		t.Fatal(err)
	}
	// Simulate rollback completion with cleanup interrupted: obsolete backup
	// data must no longer be consulted once the completion marker is written.
	if err := writeLock(filepath.Join(dir, "upgrade.lock"), LockState{From: 122, To: 123, RolledBack: true}); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "db.backup"), []byte("obsolete backup"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := Recover(dir); err != nil {
		t.Fatal(err)
	}
	if got := canaryValue(t, dir); got != 42 {
		t.Fatalf("database was restored again: %d", got)
	}
	if _, err := os.Stat(filepath.Join(dir, "cache/music")); err != nil {
		t.Fatalf("restored cache changed: %v", err)
	}
}
