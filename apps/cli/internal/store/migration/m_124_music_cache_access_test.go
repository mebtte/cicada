package migration

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestM124_DataVersionAdvancesWithoutChangingLibrary(t *testing.T) {
	scratchSteps(t, scratchUpMusicCacheAccess)
	resetForTests()
	Register(Migration{From: 123, To: 124, Up: upMusicCacheAccess, ScratchUp: scratchUpMusicCacheAccess})
	dir := t.TempDir()
	initDB(t, dir)
	writeV(t, dir, 123)
	original := filepath.Join(dir, "assets/music/aa/original.mp3")
	writeScratchFixture(t, original)
	if err := Run(context.Background(), dir); err != nil {
		t.Fatal(err)
	}
	if version, _ := readV(t, dir); version != 124 {
		t.Fatalf("data version = %d, want 124", version)
	}
	if got := canaryValue(t, dir); got != 42 {
		t.Fatalf("business database changed: %d", got)
	}
	if contents, err := os.ReadFile(original); err != nil || string(contents) != "keep" {
		t.Fatalf("original changed: %q, %v", contents, err)
	}
}

func TestM124_ScratchDiscardsHardlinksAndPreservesOtherFiles(t *testing.T) {
	scratchSteps(t, scratchUpMusicCacheAccess)
	dir := t.TempDir()
	writeV(t, dir, 123)
	original := filepath.Join(t.TempDir(), "original.mp3")
	writeScratchFixture(t, original)
	oldTime := time.Unix(1600000000, 0)
	if err := os.Chtimes(original, oldTime, oldTime); err != nil {
		t.Fatal(err)
	}
	cache := filepath.Join(dir, "music_transcoded/aa/music__quality-source_v1.audio")
	if err := os.MkdirAll(filepath.Dir(cache), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.Link(original, cache); err != nil {
		t.Fatal(err)
	}
	writeScratchFixture(t, cache+".json")
	writeScratchFixture(t, filepath.Join(dir, "music_transcoded/aa/smooth_v1.m4a.tmp"))
	for _, name := range []string{"thumbnails/image", "partial_uploads/session", "logs/access/log", "db.backup"} {
		writeScratchFixture(t, filepath.Join(dir, name))
	}
	if err := RunScratch(context.Background(), dir, 124); err != nil {
		t.Fatal(err)
	}
	entries, err := os.ReadDir(filepath.Join(dir, "music_transcoded"))
	if err != nil || len(entries) != 0 {
		t.Fatalf("legacy cache not replaced with empty directory: %v, %v", entries, err)
	}
	if contents, err := os.ReadFile(original); err != nil || string(contents) != "keep" {
		t.Fatalf("hardlink original changed: %q, %v", contents, err)
	}
	if info, err := os.Stat(original); err != nil || !info.ModTime().Equal(oldTime) {
		t.Fatalf("hardlink original modification time changed: %v, %v", info, err)
	}
	for _, name := range []string{"thumbnails/image", "partial_uploads/session", "logs/access/log", "db.backup"} {
		if contents, err := os.ReadFile(filepath.Join(dir, name)); err != nil || string(contents) != "keep" {
			t.Fatalf("unrelated scratch %s changed: %q, %v", name, contents, err)
		}
	}
	if version, _ := readV(t, dir); version != 124 {
		t.Fatalf("scratch version = %d, want 124", version)
	}
	// A subsequent startup must preserve newly generated caches.
	newCache := filepath.Join(dir, "music_transcoded/aa/new_v2.audio")
	writeScratchFixture(t, newCache)
	if err := RunScratch(context.Background(), dir, 124); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(newCache); err != nil {
		t.Fatalf("upgrade repeated and discarded new cache: %v", err)
	}
}

func TestM124_ScratchRecoveryRestoresOldCacheAndRetries(t *testing.T) {
	fail := true
	scratchSteps(t, func(ctx context.Context, env *ScratchEnv) error {
		if err := scratchUpMusicCacheAccess(ctx, env); err != nil {
			return err
		}
		if fail {
			return errors.New("injected failure after cache recreation")
		}
		return nil
	})
	dir := t.TempDir()
	writeV(t, dir, 123)
	cache := filepath.Join(dir, "music_transcoded/aa/old.audio")
	writeScratchFixture(t, cache)
	writeScratchFixture(t, cache+".json")
	if err := RunScratch(context.Background(), dir, 124); err == nil {
		t.Fatal("expected injected failure")
	}
	if version, _ := readV(t, dir); version != 123 {
		t.Fatalf("failed step advanced scratch version: %d", version)
	}
	if err := recoverScratch(dir); err != nil {
		t.Fatal(err)
	}
	for _, path := range []string{cache, cache + ".json"} {
		if contents, err := os.ReadFile(path); err != nil || string(contents) != "keep" {
			t.Fatalf("old cache not restored: %s: %q, %v", path, contents, err)
		}
	}
	fail = false
	if err := RunScratch(context.Background(), dir, 124); err != nil {
		t.Fatalf("retry failed: %v", err)
	}
	entries, err := os.ReadDir(filepath.Join(dir, "music_transcoded"))
	if err != nil || len(entries) != 0 {
		t.Fatalf("retry did not discard cache: %v, %v", entries, err)
	}
}

func TestM124_ScratchMissingDirectoryAndSymlink(t *testing.T) {
	scratchSteps(t, scratchUpMusicCacheAccess)
	for _, linked := range []bool{false, true} {
		t.Run(map[bool]string{false: "missing", true: "symlink"}[linked], func(t *testing.T) {
			dir, outside := t.TempDir(), t.TempDir()
			writeV(t, dir, 123)
			original := filepath.Join(outside, "original")
			writeScratchFixture(t, original)
			cacheDir := filepath.Join(dir, "music_transcoded")
			if linked {
				if err := os.Symlink(outside, cacheDir); err != nil {
					t.Fatal(err)
				}
			}
			if err := RunScratch(context.Background(), dir, 124); err != nil {
				t.Fatal(err)
			}
			if info, err := os.Lstat(cacheDir); err != nil || !info.IsDir() {
				t.Fatalf("cache is not a real directory: %v, %v", info, err)
			}
			if contents, err := os.ReadFile(original); err != nil || string(contents) != "keep" {
				t.Fatalf("symlink target changed: %q, %v", contents, err)
			}
		})
	}
}
