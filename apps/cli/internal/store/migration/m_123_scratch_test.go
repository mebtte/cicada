package migration

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"testing"
)

func registerScratchMigration(t *testing.T, up func(context.Context, *Env) error) {
	t.Helper()
	resetForTests()
	Register(Migration{From: 122, To: 123, Destructive: true, Up: up})
}

func TestM123_RemovesLegacyDirectoriesAndPreservesLibrary(t *testing.T) {
	registerScratchMigration(t, upScratchLayout)
	dir := t.TempDir()
	initDB(t, dir)
	writeV(t, dir, 122)
	for _, name := range []string{"cache/music_transcoded/aa/music", "partial_uploads/session/data", "logs/access/log"} {
		writeScratchFixture(t, filepath.Join(dir, name))
	}
	for _, name := range []string{"assets/music/aa/original", "scratch/logs/access/new", "unrelated"} {
		writeScratchFixture(t, filepath.Join(dir, name))
	}
	if err := Run(context.Background(), dir); err != nil {
		t.Fatal(err)
	}
	if version, _ := readV(t, dir); version != 123 {
		t.Fatalf("version = %d, want 123", version)
	}
	for _, name := range []string{"cache", "partial_uploads", "logs", "upgrade.trash", "upgrade.lock"} {
		if _, err := os.Lstat(filepath.Join(dir, name)); !errors.Is(err, os.ErrNotExist) {
			t.Fatalf("%s still exists: %v", name, err)
		}
	}
	for _, name := range []string{"assets/music/aa/original", "scratch/logs/access/new", "unrelated"} {
		if contents, err := os.ReadFile(filepath.Join(dir, name)); err != nil || string(contents) != "keep" {
			t.Fatalf("%s changed: %q, %v", name, contents, err)
		}
	}
	if got := canaryValue(t, dir); got != 42 {
		t.Fatalf("database changed: %d", got)
	}
	// Once stamped, a second run must not execute destructive cleanup again.
	writeScratchFixture(t, filepath.Join(dir, "cache/new"))
	if err := Run(context.Background(), dir); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(filepath.Join(dir, "cache/new")); err != nil {
		t.Fatalf("migration repeated: %v", err)
	}
}

func TestM123_MissingDirectoriesAndSymlinks(t *testing.T) {
	registerScratchMigration(t, upScratchLayout)
	dir, external := t.TempDir(), t.TempDir()
	initDB(t, dir)
	writeV(t, dir, 122)
	writeScratchFixture(t, filepath.Join(external, "original"))
	if err := os.Symlink(external, filepath.Join(dir, "cache")); err != nil {
		t.Skipf("symlinks unavailable: %v", err)
	}
	if err := os.Symlink(filepath.Join(external, "missing"), filepath.Join(dir, "logs")); err != nil {
		t.Fatal(err)
	}
	// partial_uploads is absent; both live and dangling symlinks are removed.
	if err := Run(context.Background(), dir); err != nil {
		t.Fatal(err)
	}
	for _, name := range []string{"cache", "logs", "partial_uploads"} {
		if _, err := os.Lstat(filepath.Join(dir, name)); !errors.Is(err, os.ErrNotExist) {
			t.Fatalf("%s still exists: %v", name, err)
		}
	}
	if _, err := os.Stat(filepath.Join(external, "original")); err != nil {
		t.Fatalf("symlink target changed: %v", err)
	}
}

func TestM123_FailureRestoresDirectoriesAndDanglingLinks(t *testing.T) {
	registerScratchMigration(t, func(ctx context.Context, env *Env) error {
		if err := upScratchLayout(ctx, env); err != nil {
			return err
		}
		return errors.New("injected failure after removal")
	})
	dir := t.TempDir()
	initDB(t, dir)
	writeV(t, dir, 122)
	writeScratchFixture(t, filepath.Join(dir, "cache/music"))
	writeScratchFixture(t, filepath.Join(dir, "partial_uploads/session"))
	target := filepath.Join(t.TempDir(), "missing")
	if err := os.Symlink(target, filepath.Join(dir, "logs")); err != nil {
		t.Skipf("symlinks unavailable: %v", err)
	}
	if err := Run(context.Background(), dir); err == nil {
		t.Fatal("expected injected failure")
	}
	if err := Recover(dir); err != nil {
		t.Fatal(err)
	}
	if version, _ := readV(t, dir); version != 122 {
		t.Fatalf("version = %d, want 122", version)
	}
	for _, name := range []string{"cache/music", "partial_uploads/session"} {
		if contents, err := os.ReadFile(filepath.Join(dir, name)); err != nil || string(contents) != "keep" {
			t.Fatalf("%s not restored: %q, %v", name, contents, err)
		}
	}
	if got, err := os.Readlink(filepath.Join(dir, "logs")); err != nil || got != target {
		t.Fatalf("dangling symlink not restored: %q, %v", got, err)
	}
}
