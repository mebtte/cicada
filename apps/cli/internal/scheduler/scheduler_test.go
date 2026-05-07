package scheduler

import (
	"cicada/internal/config"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestCleanOutdatedFileCleansThumbnailContentsWithoutRemovingDir(t *testing.T) {
	config.Set(config.Config{
		Mode:      config.ModeProduction,
		Data:      t.TempDir(),
		Port:      8000,
		JWTExpiry: int64(180 * 24 * 60 * 60 * 1000),
	})

	for _, dir := range []string{
		config.TrashDir(),
		config.LogDir(),
		config.CacheDir(),
		config.ThumbnailCacheDir(),
	} {
		if err := os.MkdirAll(dir, 0755); err != nil {
			t.Fatalf("mkdir %s: %v", dir, err)
		}
	}

	oldTime := time.Now().Add(-31 * 24 * time.Hour)
	oldRootCache := filepath.Join(config.CacheDir(), "old-cache")
	oldThumbnail := filepath.Join(config.ThumbnailCacheDir(), "64_old.jpg")
	freshThumbnail := filepath.Join(config.ThumbnailCacheDir(), "64_fresh.jpg")

	for _, path := range []string{oldRootCache, oldThumbnail, freshThumbnail} {
		if err := os.WriteFile(path, []byte("cache"), 0644); err != nil {
			t.Fatalf("write %s: %v", path, err)
		}
	}
	for _, path := range []string{oldRootCache, oldThumbnail} {
		if err := os.Chtimes(path, oldTime, oldTime); err != nil {
			t.Fatalf("chtimes %s: %v", path, err)
		}
	}
	if err := os.Chtimes(config.ThumbnailCacheDir(), oldTime, oldTime); err != nil {
		t.Fatalf("chtimes thumbnail dir: %v", err)
	}

	cleanOutdatedFile()

	if info, err := os.Stat(config.ThumbnailCacheDir()); err != nil || !info.IsDir() {
		t.Fatalf("expected thumbnail cache dir to remain, info=%v err=%v", info, err)
	}
	if _, err := os.Stat(oldRootCache); !os.IsNotExist(err) {
		t.Fatalf("expected old root cache file to be removed, err=%v", err)
	}
	if _, err := os.Stat(oldThumbnail); !os.IsNotExist(err) {
		t.Fatalf("expected old thumbnail cache file to be removed, err=%v", err)
	}
	if _, err := os.Stat(freshThumbnail); err != nil {
		t.Fatalf("expected fresh thumbnail cache file to remain: %v", err)
	}
}
