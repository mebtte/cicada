package migration

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"testing"
)

func TestM109_RemoveLegacyRootFiles(t *testing.T) {
	resetForTests()
	dir := t.TempDir()
	initDB(t, dir)
	writeV(t, dir, BaselineVersion+8)

	// 旧版本散落在 logs / cache 根目录下的文件, 迁移后应被移除
	looseFiles := []string{
		filepath.Join(dir, "logs", "access.log"),
		filepath.Join(dir, "logs", "2024-01-01.log"),
		filepath.Join(dir, "cache", "old-cache"),
		filepath.Join(dir, "cache", "upload_music_123"),
	}
	// 当前版本使用的子目录及其中的文件, 迁移后必须保留
	keptFiles := []string{
		filepath.Join(dir, "logs", "access", "2026-05-25.log"),
		filepath.Join(dir, "logs", "scheduler", "scheduler-2026-05-25.log"),
		filepath.Join(dir, "cache", "thumbnails", "64_a.jpg"),
		filepath.Join(dir, "cache", "music_transcoded", "song.flac_codec-flac.flac"),
	}
	for _, p := range append(append([]string{}, looseFiles...), keptFiles...) {
		if err := os.MkdirAll(filepath.Dir(p), 0755); err != nil {
			t.Fatalf("mkdir %s: %v", filepath.Dir(p), err)
		}
		if err := os.WriteFile(p, []byte("x"), 0644); err != nil {
			t.Fatalf("write %s: %v", p, err)
		}
	}

	Register(Migration{
		From:        BaselineVersion + 8,
		To:          BaselineVersion + 9,
		Description: "m109",
		Destructive: true,
		Up:          upRemoveLegacyRootFiles,
	})

	if err := Run(context.Background(), dir); err != nil {
		t.Fatalf("Run: %v", err)
	}

	v, _ := readV(t, dir)
	if v != BaselineVersion+9 {
		t.Fatalf("v = %d, want %d", v, BaselineVersion+9)
	}
	for _, p := range looseFiles {
		if _, err := os.Stat(p); !errors.Is(err, os.ErrNotExist) {
			t.Fatalf("expected legacy root file %s to be removed, err=%v", p, err)
		}
	}
	for _, p := range keptFiles {
		if _, err := os.Stat(p); err != nil {
			t.Fatalf("expected subdirectory file %s to be preserved, err=%v", p, err)
		}
	}
}
