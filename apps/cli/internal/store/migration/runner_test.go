package migration

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"testing"

	_ "modernc.org/sqlite"
)

// helper: read v file
func readV(t *testing.T, dir string) (int, bool) {
	t.Helper()
	raw, err := os.ReadFile(filepath.Join(dir, "v"))
	if errors.Is(err, os.ErrNotExist) {
		return 0, false
	}
	if err != nil {
		t.Fatalf("read v: %v", err)
	}
	v, err := strconv.Atoi(strings.TrimSpace(string(raw)))
	if err != nil {
		t.Fatalf("parse v: %v", err)
	}
	return v, true
}

func writeV(t *testing.T, dir string, v int) {
	t.Helper()
	if err := os.WriteFile(filepath.Join(dir, "v"), []byte(strconv.Itoa(v)), 0644); err != nil {
		t.Fatalf("write v: %v", err)
	}
}

// initDB creates an empty sqlite db at dir/db with a single canary row so we
// can verify migrations don't trash unrelated data.
func initDB(t *testing.T, dir string) {
	t.Helper()
	db, err := sql.Open("sqlite", filepath.Join(dir, "db"))
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	defer db.Close()
	db.SetMaxOpenConns(1)
	if _, err := db.Exec(`PRAGMA journal_mode=WAL; CREATE TABLE canary (n INT); INSERT INTO canary VALUES (42);`); err != nil {
		t.Fatalf("seed db: %v", err)
	}
}

func canaryValue(t *testing.T, dir string) int {
	t.Helper()
	db, err := sql.Open("sqlite", filepath.Join(dir, "db"))
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	defer db.Close()
	db.SetMaxOpenConns(1)
	var n int
	if err := db.QueryRow(`SELECT n FROM canary`).Scan(&n); err != nil {
		t.Fatalf("read canary: %v", err)
	}
	return n
}

func columnExists(t *testing.T, dir, table, col string) bool {
	t.Helper()
	db, err := sql.Open("sqlite", filepath.Join(dir, "db"))
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	defer db.Close()
	db.SetMaxOpenConns(1)
	rows, err := db.Query(fmt.Sprintf("PRAGMA table_info(%s)", table))
	if err != nil {
		t.Fatalf("pragma: %v", err)
	}
	defer rows.Close()
	for rows.Next() {
		var cid int
		var name, ctype string
		var notnull, pk int
		var dflt sql.NullString
		if err := rows.Scan(&cid, &name, &ctype, &notnull, &dflt, &pk); err != nil {
			t.Fatalf("scan: %v", err)
		}
		if name == col {
			return true
		}
	}
	return false
}

func TestRun_FreshInstall_StampsBaseline(t *testing.T) {
	resetForTests()
	dir := t.TempDir()
	if err := Run(context.Background(), dir); err != nil {
		t.Fatalf("Run: %v", err)
	}
	v, ok := readV(t, dir)
	if !ok {
		t.Fatal("v file not created")
	}
	if v != BaselineVersion {
		t.Fatalf("v = %d, want %d", v, BaselineVersion)
	}
}

func TestRun_LegacyBridge(t *testing.T) {
	resetForTests()
	dir := t.TempDir()
	initDB(t, dir)
	writeV(t, dir, 2)

	if err := Run(context.Background(), dir); err != nil {
		t.Fatalf("Run: %v", err)
	}
	v, _ := readV(t, dir)
	if v != BaselineVersion {
		t.Fatalf("v after bridge = %d, want %d", v, BaselineVersion)
	}
	if got := canaryValue(t, dir); got != 42 {
		t.Fatalf("canary mutated: %d", got)
	}
}

func TestRun_NormalMigration_AddsColumn(t *testing.T) {
	resetForTests()
	dir := t.TempDir()
	initDB(t, dir)
	writeV(t, dir, BaselineVersion)

	Register(Migration{
		From: BaselineVersion, To: BaselineVersion + 1,
		Description: "add canary.tag",
		Up: func(_ context.Context, env *Env) error {
			_, err := env.Tx.Exec(`ALTER TABLE canary ADD COLUMN tag TEXT NOT NULL DEFAULT ''`)
			return err
		},
	})

	if err := Run(context.Background(), dir); err != nil {
		t.Fatalf("Run: %v", err)
	}
	v, _ := readV(t, dir)
	if v != BaselineVersion+1 {
		t.Fatalf("v = %d, want %d", v, BaselineVersion+1)
	}
	if !columnExists(t, dir, "canary", "tag") {
		t.Fatal("column 'tag' not added")
	}
	for _, p := range []string{"upgrade.lock", "upgrade.journal", "db.backup"} {
		if _, err := os.Stat(filepath.Join(dir, p)); !errors.Is(err, os.ErrNotExist) {
			t.Errorf("%s should be cleaned up; err=%v", p, err)
		}
	}
}

func TestRun_FailedMigration_RecoverRollsBack(t *testing.T) {
	resetForTests()
	dir := t.TempDir()
	initDB(t, dir)
	writeV(t, dir, BaselineVersion)

	Register(Migration{
		From: BaselineVersion, To: BaselineVersion + 1,
		Description: "boom",
		Up: func(_ context.Context, env *Env) error {
			if _, err := env.Tx.Exec(`ALTER TABLE canary ADD COLUMN tag TEXT NOT NULL DEFAULT ''`); err != nil {
				return err
			}
			return errors.New("boom")
		},
	})

	err := Run(context.Background(), dir)
	if err == nil {
		t.Fatal("expected Run to fail")
	}
	// Lock should still exist for next-boot recovery.
	if _, err := os.Stat(filepath.Join(dir, "upgrade.lock")); err != nil {
		t.Fatalf("expected upgrade.lock to remain: %v", err)
	}
	// Now Recover, which should restore the DB and clean up.
	if err := Recover(dir); err != nil {
		t.Fatalf("Recover: %v", err)
	}
	v, _ := readV(t, dir)
	if v != BaselineVersion {
		t.Fatalf("v after recovery = %d, want %d", v, BaselineVersion)
	}
	if columnExists(t, dir, "canary", "tag") {
		t.Fatal("column 'tag' should not exist after recovery (db restored)")
	}
	if got := canaryValue(t, dir); got != 42 {
		t.Fatalf("canary mutated: %d", got)
	}
	for _, p := range []string{"upgrade.lock", "upgrade.journal", "db.backup", "upgrade.trash"} {
		if _, err := os.Stat(filepath.Join(dir, p)); !errors.Is(err, os.ErrNotExist) {
			t.Errorf("%s should be cleaned by recover; err=%v", p, err)
		}
	}
}

func TestRun_DestructiveAutoRuns(t *testing.T) {
	resetForTests()
	dir := t.TempDir()
	initDB(t, dir)
	writeV(t, dir, BaselineVersion)

	Register(Migration{
		From: BaselineVersion, To: BaselineVersion + 1,
		Description: "drop and re-add",
		Destructive: true,
		Up: func(_ context.Context, env *Env) error {
			_, err := env.Tx.Exec(`ALTER TABLE canary ADD COLUMN tag TEXT NOT NULL DEFAULT 'x'`)
			return err
		},
	})

	if err := Run(context.Background(), dir); err != nil {
		t.Fatalf("destructive should still auto-run: %v", err)
	}
	v, _ := readV(t, dir)
	if v != BaselineVersion+1 {
		t.Fatalf("v = %d, want %d", v, BaselineVersion+1)
	}
}

func TestJournal_TrashAndRestore(t *testing.T) {
	resetForTests()
	dir := t.TempDir()
	initDB(t, dir)
	writeV(t, dir, BaselineVersion)

	target := filepath.Join(dir, "asset_a")
	if err := os.WriteFile(target, []byte("hello"), 0644); err != nil {
		t.Fatal(err)
	}

	Register(Migration{
		From: BaselineVersion, To: BaselineVersion + 1,
		Description: "trash asset then fail",
		Up: func(_ context.Context, env *Env) error {
			if err := env.Journal.Trash(target); err != nil {
				return err
			}
			return errors.New("force rollback")
		},
	})

	if err := Run(context.Background(), dir); err == nil {
		t.Fatal("expected Run to fail")
	}
	if err := Recover(dir); err != nil {
		t.Fatalf("Recover: %v", err)
	}
	b, err := os.ReadFile(target)
	if err != nil {
		t.Fatalf("file should be restored: %v", err)
	}
	if string(b) != "hello" {
		t.Fatalf("file content = %q, want hello", string(b))
	}
}

func TestRun_NewerVersionRefuses(t *testing.T) {
	resetForTests()
	dir := t.TempDir()
	initDB(t, dir)
	writeV(t, dir, BaselineVersion+5)

	err := Run(context.Background(), dir)
	if err == nil {
		t.Fatal("expected error when data version > current")
	}
	if !strings.Contains(err.Error(), "newer than this binary") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestRun_ChainBroken(t *testing.T) {
	resetForTests()
	dir := t.TempDir()
	initDB(t, dir)
	writeV(t, dir, BaselineVersion)

	// Skip from 100 to 102 directly — there's no 100 -> 101 step.
	Register(Migration{
		From: BaselineVersion + 1, To: BaselineVersion + 2,
		Description: "gap",
		Up:          func(_ context.Context, _ *Env) error { return nil },
	})

	err := Run(context.Background(), dir)
	if err == nil {
		t.Fatal("expected chain validation to fail")
	}
	if !strings.Contains(err.Error(), "chain") {
		t.Fatalf("unexpected error: %v", err)
	}
}
