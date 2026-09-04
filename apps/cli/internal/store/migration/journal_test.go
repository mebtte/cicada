package migration

import (
	"errors"
	"os"
	"path/filepath"
	"testing"
)

func TestJournalRenameRejectsUnexecutedIntent(t *testing.T) {
	for _, sourceExists := range []bool{false, true} {
		t.Run(map[bool]string{false: "source missing", true: "target conflict"}[sourceExists], func(t *testing.T) {
			dir := t.TempDir()
			writeScratchFixture(t, filepath.Join(dir, "target/keep"))
			if sourceExists {
				writeScratchFixture(t, filepath.Join(dir, "source/keep"))
			}
			j, err := OpenJournal(dir)
			if err != nil {
				t.Fatal(err)
			}
			if err := j.Rename("source", "target"); err == nil {
				t.Fatal("unsafe rename accepted")
			}
			if err := j.Close(); err != nil {
				t.Fatal(err)
			}
			if err := ReplayReverse(dir, 0); err != nil {
				t.Fatal(err)
			}
			if _, err := os.Stat(filepath.Join(dir, "target/keep")); err != nil {
				t.Fatalf("unrelated target moved by rollback: %v", err)
			}
		})
	}
}

func TestJournalRelativePathsAndRepeatedRollback(t *testing.T) {
	dir := t.TempDir()
	writeScratchFixture(t, filepath.Join(dir, "source/keep"))
	j, err := OpenJournal(dir)
	if err != nil {
		t.Fatal(err)
	}
	if err := j.Rename("source", "target"); err != nil {
		t.Fatal(err)
	}
	if err := j.Mkdir("source"); err != nil {
		t.Fatal(err)
	}
	if err := j.Close(); err != nil {
		t.Fatal(err)
	}
	for i := 0; i < 2; i++ {
		if err := ReplayReverse(dir, 0); err != nil {
			t.Fatalf("rollback %d: %v", i, err)
		}
	}
	if _, err := os.Stat(filepath.Join(dir, "source/keep")); err != nil {
		t.Fatalf("restored source was removed on repeated rollback: %v", err)
	}
	if _, err := os.Stat(filepath.Join(dir, "target")); !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("target still exists: %v", err)
	}
}

func TestJournalRenameRollsBackImplicitParentCreation(t *testing.T) {
	dir := t.TempDir()
	writeScratchFixture(t, filepath.Join(dir, "thumbnails/cached"))
	writeScratchFixture(t, filepath.Join(dir, "other/file"))
	j, err := OpenJournal(dir)
	if err != nil {
		t.Fatal(err)
	}
	if err := j.Rename("thumbnails", "images"); err != nil {
		t.Fatal(err)
	}
	if err := j.Rename("other", "thumbnails/other"); err != nil {
		t.Fatal(err)
	}
	if err := j.Close(); err != nil {
		t.Fatal(err)
	}
	entries, err := readEntries(filepath.Join(dir, "upgrade.journal"))
	if err != nil {
		t.Fatal(err)
	}
	if len(entries) != 3 || entries[0].Op != "rename" || entries[1].Op != "mkdir" || entries[2].Op != "rename" {
		t.Fatalf("parent must be journaled before the second rename: %+v", entries)
	}
	for i := 0; i < 2; i++ {
		if err := ReplayReverse(dir, 0); err != nil {
			t.Fatalf("rollback %d: %v", i, err)
		}
	}
	for _, name := range []string{"thumbnails/cached", "other/file"} {
		if _, err := os.Stat(filepath.Join(dir, name)); err != nil {
			t.Fatalf("original content not restored: %s: %v", name, err)
		}
	}
	if _, err := os.Stat(filepath.Join(dir, "thumbnails/other")); !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("implicit destination remains: %v", err)
	}
}

func TestJournalSymlinkParentCannotEscapeButLeafCanBeTrashed(t *testing.T) {
	dir, outside := t.TempDir(), t.TempDir()
	writeScratchFixture(t, filepath.Join(outside, "keep"))
	if err := os.Symlink(outside, filepath.Join(dir, "linked")); err != nil {
		t.Skipf("symlinks unavailable: %v", err)
	}
	j, err := OpenJournal(dir)
	if err != nil {
		t.Fatal(err)
	}
	if err := j.Trash("linked/keep"); err == nil {
		t.Fatal("trash escaped through symlink parent")
	}
	if err := j.Rename("linked/keep", "stolen"); err == nil {
		t.Fatal("rename escaped through symlink parent")
	}
	if err := j.Trash("linked"); err != nil {
		t.Fatalf("cannot trash symlink leaf: %v", err)
	}
	if err := j.Close(); err != nil {
		t.Fatal(err)
	}
	if err := ReplayReverse(dir, 0); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Readlink(filepath.Join(dir, "linked")); err != nil {
		t.Fatalf("symlink not restored: %v", err)
	}
	if contents, err := os.ReadFile(filepath.Join(outside, "keep")); err != nil || string(contents) != "keep" {
		t.Fatalf("external content changed: %q %v", contents, err)
	}
}

func writeScratchFixture(t *testing.T, path string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte("keep"), 0644); err != nil {
		t.Fatal(err)
	}
}
