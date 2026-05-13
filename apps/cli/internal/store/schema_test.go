package store

import (
	"cicada/internal/config"
	"os"
	"path/filepath"
	"testing"
)

func TestInitializeCreatesThumbnailCacheDirAndLeavesExistingRootCache(t *testing.T) {
	if err := ResetForTests(); err != nil {
		t.Fatalf("reset store: %v", err)
	}
	t.Cleanup(func() {
		if err := ResetForTests(); err != nil {
			t.Fatalf("cleanup store: %v", err)
		}
	})

	dataDir := t.TempDir()
	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: dataDir,
		Port: 8000,
	})

	if err := os.MkdirAll(config.CacheDir(), 0755); err != nil {
		t.Fatalf("mkdir cache dir: %v", err)
	}
	legacyThumbnail := filepath.Join(config.CacheDir(), "64_cover.jpg")
	if err := os.WriteFile(legacyThumbnail, []byte("old thumbnail"), 0644); err != nil {
		t.Fatalf("write legacy thumbnail: %v", err)
	}
	otherCache := filepath.Join(config.CacheDir(), "cache-state")
	if err := os.WriteFile(otherCache, []byte("keep"), 0644); err != nil {
		t.Fatalf("write other cache: %v", err)
	}

	if err := Initialize(); err != nil {
		t.Fatalf("initialize store: %v", err)
	}

	if info, err := os.Stat(config.ThumbnailCacheDir()); err != nil || !info.IsDir() {
		t.Fatalf("expected thumbnail cache dir, info=%v err=%v", info, err)
	}
	if info, err := os.Stat(config.MusicTranscodeCacheDir()); err != nil || !info.IsDir() {
		t.Fatalf("expected music transcode cache dir, info=%v err=%v", info, err)
	}
	if _, err := os.Stat(filepath.Join(dataDir, "trash")); !os.IsNotExist(err) {
		t.Fatalf("expected runtime trash dir to not be created, err=%v", err)
	}
	if _, err := os.Stat(legacyThumbnail); err != nil {
		t.Fatalf("expected legacy thumbnail cache file to remain until scheduled cleanup: %v", err)
	}
	if _, err := os.Stat(otherCache); err != nil {
		t.Fatalf("expected non-thumbnail cache file to remain: %v", err)
	}
}
