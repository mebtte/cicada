package migration

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"testing"
)

func TestM110_ShardThumbnailCache(t *testing.T) {
	resetForTests()
	dir := t.TempDir()
	initDB(t, dir)
	writeV(t, dir, BaselineVersion+9)

	// 旧的平铺缩略图, 迁移后应被移除
	flatFiles := []string{
		filepath.Join(dir, "cache", "thumbnails", "64_a.jpg"),
		filepath.Join(dir, "cache", "thumbnails", "128_b.jpg"),
		filepath.Join(dir, "cache", "thumbnails", "200_c.jpg"),
	}
	// 已经存在的 shard 子目录及其中文件, 迁移后必须保留
	keptFiles := []string{
		filepath.Join(dir, "cache", "thumbnails", "ab", "abdeadbeef_200.jpg"),
		filepath.Join(dir, "cache", "thumbnails", "ef", "ef1122_64.jpg"),
	}
	for _, p := range append(append([]string{}, flatFiles...), keptFiles...) {
		if err := os.MkdirAll(filepath.Dir(p), 0755); err != nil {
			t.Fatalf("mkdir %s: %v", filepath.Dir(p), err)
		}
		if err := os.WriteFile(p, []byte("x"), 0644); err != nil {
			t.Fatalf("write %s: %v", p, err)
		}
	}

	Register(Migration{
		From:        BaselineVersion + 9,
		To:          BaselineVersion + 10,
		Description: "m110",
		Destructive: true,
		Up:          upShardThumbnailCache,
	})

	if err := Run(context.Background(), dir); err != nil {
		t.Fatalf("Run: %v", err)
	}

	v, _ := readV(t, dir)
	if v != BaselineVersion+10 {
		t.Fatalf("v = %d, want %d", v, BaselineVersion+10)
	}
	for _, p := range flatFiles {
		if _, err := os.Stat(p); !errors.Is(err, os.ErrNotExist) {
			t.Fatalf("expected flat thumbnail %s to be removed, err=%v", p, err)
		}
	}
	for _, p := range keptFiles {
		if _, err := os.Stat(p); err != nil {
			t.Fatalf("expected sharded thumbnail %s to be preserved, err=%v", p, err)
		}
	}
}

func TestM110_NoThumbnailsDir(t *testing.T) {
	resetForTests()
	dir := t.TempDir()
	initDB(t, dir)
	writeV(t, dir, BaselineVersion+9)

	Register(Migration{
		From:        BaselineVersion + 9,
		To:          BaselineVersion + 10,
		Description: "m110",
		Destructive: true,
		Up:          upShardThumbnailCache,
	})

	if err := Run(context.Background(), dir); err != nil {
		t.Fatalf("Run: %v", err)
	}

	v, _ := readV(t, dir)
	if v != BaselineVersion+10 {
		t.Fatalf("v = %d, want %d", v, BaselineVersion+10)
	}
}
