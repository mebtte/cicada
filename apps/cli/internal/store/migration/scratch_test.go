package migration

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"testing"
)

func scratchSteps(t *testing.T, steps ...func(context.Context, *ScratchEnv) error) {
	t.Helper()
	previous := Migrations()
	t.Cleanup(func() {
		resetForTests()
		for _, m := range previous {
			Register(m)
		}
	})
	resetForTests()
	for i, up := range steps {
		Register(Migration{From: 123 + i, To: 124 + i, Up: func(context.Context, *Env) error { return nil }, ScratchUp: up})
	}
}

func TestRunScratch_UnversionedPreservesCacheAndCreatesBaseline(t *testing.T) {
	scratchSteps(t)
	dir := t.TempDir()
	writeScratchFixture(t, filepath.Join(dir, "music_transcoded/music"))
	writeScratchFixture(t, filepath.Join(dir, "db.backup"))
	if err := CheckScratchVersion(dir, 123); err != nil {
		t.Fatal(err)
	}
	if _, exists := readV(t, dir); exists {
		t.Fatal("preflight wrote scratch/v")
	}
	if err := RunScratch(context.Background(), dir, 123); err != nil {
		t.Fatal(err)
	}
	if version, _ := readV(t, dir); version != 123 {
		t.Fatalf("version = %d", version)
	}
	for _, name := range []string{"music_transcoded/music", "db.backup", "thumbnails", "partial_uploads", "logs/access", "logs/scheduler"} {
		if _, err := os.Stat(filepath.Join(dir, name)); err != nil {
			t.Fatalf("missing preserved or baseline entry %s: %v", name, err)
		}
	}
}

func TestRunScratch_CatchesUpWithDataAndSkipsNilSteps(t *testing.T) {
	scratchSteps(t, nil, func(_ context.Context, env *ScratchEnv) error {
		return env.Journal.Rename(filepath.Join(env.ScratchDir, "thumbnails"), filepath.Join(env.ScratchDir, "images"))
	})
	data, dir := t.TempDir(), t.TempDir()
	writeV(t, data, 125)
	writeScratchFixture(t, filepath.Join(dir, "thumbnails/cached"))
	writeScratchFixture(t, filepath.Join(dir, "db.backup"))
	if err := RunScratch(context.Background(), dir, 125); err != nil {
		t.Fatal(err)
	}
	if version, _ := readV(t, dir); version != 125 {
		t.Fatalf("scratch version = %d", version)
	}
	if version, _ := readV(t, data); version != 125 {
		t.Fatalf("data version changed: %d", version)
	}
	for _, name := range []string{"images/cached", "db.backup", "logs/access"} {
		if contents, err := os.Stat(filepath.Join(dir, name)); err != nil || contents == nil {
			t.Fatalf("entry lost: %s: %v", name, err)
		}
	}
	if err := RunScratch(context.Background(), dir, 125); err != nil {
		t.Fatalf("second startup reran migration: %v", err)
	}
}

func TestRunScratch_FreshDirectoryStartsWithBaselineLayout(t *testing.T) {
	scratchSteps(t, func(_ context.Context, env *ScratchEnv) error {
		return env.Journal.Rename(filepath.Join(env.ScratchDir, "thumbnails"), filepath.Join(env.ScratchDir, "images"))
	})
	dir := filepath.Join(t.TempDir(), "scratch")
	if err := RunScratch(context.Background(), dir, 124); err != nil {
		t.Fatalf("baseline directory was not created before upgrading: %v", err)
	}
	if _, err := os.Stat(filepath.Join(dir, "images")); err != nil {
		t.Fatal(err)
	}
}

func TestCheckScratchVersion_RejectsOrphanAndCorruptRecovery(t *testing.T) {
	scratchSteps(t, nil)
	dir := t.TempDir()
	writeV(t, dir, 123)
	writeScratchFixture(t, filepath.Join(dir, "upgrade.journal"))
	if err := CheckScratchVersion(dir, 124); err == nil {
		t.Fatal("orphan journal accepted")
	}
	if err := writeLock(filepath.Join(dir, "upgrade.lock"), LockState{From: 123, To: 124}); err != nil {
		t.Fatal(err)
	}
	if err := CheckScratchVersion(dir, 124); err == nil {
		t.Fatal("corrupt uncommitted journal accepted")
	}
}

func TestRunScratch_FailureRetainsVersionAndRecoversOnRetry(t *testing.T) {
	fail := true
	scratchSteps(t, nil, func(_ context.Context, env *ScratchEnv) error {
		if err := env.Journal.Rename(filepath.Join(env.ScratchDir, "thumbnails"), filepath.Join(env.ScratchDir, "images")); err != nil {
			return err
		}
		if fail {
			return errors.New("injected scratch failure")
		}
		return nil
	})
	dir := t.TempDir()
	writeScratchFixture(t, filepath.Join(dir, "thumbnails/cached"))
	if err := RunScratch(context.Background(), dir, 125); err == nil {
		t.Fatal("expected failure")
	}
	if version, _ := readV(t, dir); version != 124 {
		t.Fatalf("failed step advanced version: %d", version)
	}
	fail = false
	if err := RunScratch(context.Background(), dir, 125); err != nil {
		t.Fatalf("retry did not recover old directory before migration: %v", err)
	}
	if _, err := os.Stat(filepath.Join(dir, "images/cached")); err != nil {
		t.Fatal(err)
	}
	if version, _ := readV(t, dir); version != 125 {
		t.Fatalf("version = %d", version)
	}
}

func TestRunScratch_RollbackRemovesRecreatedDirectoryBeforeRestoringRename(t *testing.T) {
	fail := true
	scratchSteps(t, func(_ context.Context, env *ScratchEnv) error {
		if err := env.Journal.Rename(filepath.Join(env.ScratchDir, "thumbnails"), filepath.Join(env.ScratchDir, "images")); err != nil {
			return err
		}
		if err := env.EnsureDir("thumbnails/new"); err != nil {
			return err
		}
		if fail {
			return errors.New("injected failure after recreating source directory")
		}
		return nil
	})
	dir := t.TempDir()
	writeScratchFixture(t, filepath.Join(dir, "thumbnails/cached"))
	if err := RunScratch(context.Background(), dir, 124); err == nil {
		t.Fatal("expected failure")
	}
	fail = false
	if err := RunScratch(context.Background(), dir, 124); err != nil {
		t.Fatalf("directory creation prevented rollback and retry: %v", err)
	}
	if _, err := os.Stat(filepath.Join(dir, "images/cached")); err != nil {
		t.Fatalf("cached content lost: %v", err)
	}
}

func TestRunScratch_CommittedStepOnlyCleansArtifacts(t *testing.T) {
	scratchSteps(t, func(context.Context, *ScratchEnv) error { t.Fatal("committed migration reran"); return nil })
	dir := t.TempDir()
	writeV(t, dir, 123)
	writeScratchFixture(t, filepath.Join(dir, "thumbnails/cached"))
	writeScratchFixture(t, filepath.Join(dir, "db.backup"))
	j, err := OpenJournal(dir)
	if err != nil {
		t.Fatal(err)
	}
	if err := j.Trash(filepath.Join(dir, "thumbnails")); err != nil {
		t.Fatal(err)
	}
	if err := j.Close(); err != nil {
		t.Fatal(err)
	}
	if err := writeLock(filepath.Join(dir, "upgrade.lock"), LockState{From: 123, To: 124}); err != nil {
		t.Fatal(err)
	}
	writeV(t, dir, 124)
	if err := RunScratch(context.Background(), dir, 124); err != nil {
		t.Fatal(err)
	}
	for _, name := range []string{"thumbnails", "upgrade.lock", "upgrade.journal", "upgrade.trash"} {
		if _, err := os.Stat(filepath.Join(dir, name)); !errors.Is(err, os.ErrNotExist) {
			t.Fatalf("committed cleanup did not remove %s: %v", name, err)
		}
	}
	if contents, err := os.ReadFile(filepath.Join(dir, "db.backup")); err != nil || string(contents) != "keep" {
		t.Fatalf("scratch recovery touched db.backup: %q %v", contents, err)
	}
}

func TestRunScratch_RejectsIncompatibleVersionWithoutChangingContents(t *testing.T) {
	scratchSteps(t)
	for _, value := range []string{"broken", "122", "124"} {
		t.Run(value, func(t *testing.T) {
			dir := t.TempDir()
			writeScratchFixture(t, filepath.Join(dir, "thumbnails/cached"))
			if err := os.WriteFile(filepath.Join(dir, "v"), []byte(value), 0644); err != nil {
				t.Fatal(err)
			}
			if err := CheckScratchVersion(dir, 123); err == nil {
				t.Fatal("expected preflight rejection")
			}
			if err := RunScratch(context.Background(), dir, 123); err == nil {
				t.Fatal("expected startup rejection")
			}
			if contents, _ := os.ReadFile(filepath.Join(dir, "v")); string(contents) != value {
				t.Fatalf("version changed: %s", contents)
			}
			if _, err := os.Stat(filepath.Join(dir, "thumbnails/cached")); err != nil {
				t.Fatalf("cache deleted: %v", err)
			}
		})
	}
}

func TestScratchMetadataAndDirectoriesRejectSymlinks(t *testing.T) {
	scratchSteps(t)
	for _, name := range []string{"v", "v.tmp", "upgrade.lock", "upgrade.lock.tmp", "upgrade.journal", "upgrade.trash"} {
		t.Run(name, func(t *testing.T) {
			dir := t.TempDir()
			if err := os.Symlink(filepath.Join(t.TempDir(), "missing"), filepath.Join(dir, name)); err != nil {
				t.Skipf("symlinks unavailable: %v", err)
			}
			if err := CheckScratchVersion(dir, 123); err == nil {
				t.Fatal("metadata symlink accepted")
			}
		})
	}
	dir, outside := t.TempDir(), t.TempDir()
	env := &ScratchEnv{ScratchDir: dir}
	if err := os.Symlink(outside, filepath.Join(dir, "linked")); err != nil {
		t.Skipf("symlinks unavailable: %v", err)
	}
	for _, path := range []string{"../outside", outside, "linked/child"} {
		if err := env.EnsureDir(path); err == nil {
			t.Fatalf("unsafe directory accepted: %s", path)
		}
	}
	if _, err := os.Stat(filepath.Join(outside, "child")); !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("symlink target modified: %v", err)
	}
}

func TestScratchJournalRejectsOutsidePaths(t *testing.T) {
	dir, outside := t.TempDir(), t.TempDir()
	path := filepath.Join(outside, "keep")
	writeScratchFixture(t, path)
	j, err := OpenJournal(dir)
	if err != nil {
		t.Fatal(err)
	}
	defer j.Close()
	if err := j.Trash(path); err == nil {
		t.Fatal("journal accepted outside path")
	}
	if _, err := os.Stat(path); err != nil {
		t.Fatalf("outside file changed: %v", err)
	}
	if got, err := j.rel("relative/child"); err != nil || got != "relative/child" {
		t.Fatalf("valid relative path rejected: %q %v", got, err)
	}
}
