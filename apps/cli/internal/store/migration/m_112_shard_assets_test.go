package migration

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"testing"
)

func TestM112_ShardAssets(t *testing.T) {
	resetForTests()
	dir := t.TempDir()
	initDB(t, dir)
	writeV(t, dir, BaselineVersion+11)

	type fileSpec struct {
		path    string
		content string
	}

	// 散在 root 的扁平 asset, 迁移后应移到 shard 子目录, 内容保持不变
	flatMoves := []struct {
		from, to string
		content  string
	}{
		{
			from:    filepath.Join(dir, "assets", "music", "abcdef0123456789abcdef0123456789.mp3"),
			to:      filepath.Join(dir, "assets", "music", "ab", "abcdef0123456789abcdef0123456789.mp3"),
			content: "music-1",
		},
		{
			from:    filepath.Join(dir, "assets", "music", "ff11223344556677ff11223344556677.flac"),
			to:      filepath.Join(dir, "assets", "music", "ff", "ff11223344556677ff11223344556677.flac"),
			content: "music-2",
		},
		{
			from:    filepath.Join(dir, "assets", "music_cover", "a1b2c3d4e5f60718a1b2c3d4e5f60718.jpg"),
			to:      filepath.Join(dir, "assets", "music_cover", "a1", "a1b2c3d4e5f60718a1b2c3d4e5f60718.jpg"),
			content: "cover-1",
		},
		{
			from:    filepath.Join(dir, "assets", "user_avatar", "deadbeefcafef00ddeadbeefcafef00d.jpg"),
			to:      filepath.Join(dir, "assets", "user_avatar", "de", "deadbeefcafef00ddeadbeefcafef00d.jpg"),
			content: "avatar-1",
		},
	}
	// 预存的 shard 子目录及其内容, 迁移后必须保留, 内容不变
	keptInShard := []fileSpec{
		{
			path:    filepath.Join(dir, "assets", "music", "01", "0123456789abcdef0123456789abcdef.mp3"),
			content: "pre-sharded music",
		},
		{
			path:    filepath.Join(dir, "assets", "musicbill_cover", "ab", "abcdef0123456789abcdef0123456789.jpg"),
			content: "pre-sharded musicbill cover",
		},
	}
	// .hashes 子树 (秒传索引) 迁移后必须整棵消失
	hashes := []fileSpec{
		{
			path:    filepath.Join(dir, "assets", "music", ".hashes", "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"),
			content: "abc.mp3",
		},
		{
			path:    filepath.Join(dir, "assets", "music_cover", ".hashes", "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210"),
			content: "xyz.jpg",
		},
	}

	allWrites := []fileSpec{}
	for _, m := range flatMoves {
		allWrites = append(allWrites, fileSpec{path: m.from, content: m.content})
	}
	allWrites = append(allWrites, keptInShard...)
	allWrites = append(allWrites, hashes...)
	for _, f := range allWrites {
		if err := os.MkdirAll(filepath.Dir(f.path), 0755); err != nil {
			t.Fatalf("mkdir %s: %v", filepath.Dir(f.path), err)
		}
		if err := os.WriteFile(f.path, []byte(f.content), 0644); err != nil {
			t.Fatalf("write %s: %v", f.path, err)
		}
	}

	Register(Migration{
		From:        BaselineVersion + 11,
		To:          BaselineVersion + 12,
		Description: "m112",
		Destructive: true,
		Up:          upShardAssets,
	})

	if err := Run(context.Background(), dir); err != nil {
		t.Fatalf("Run: %v", err)
	}

	v, _ := readV(t, dir)
	if v != BaselineVersion+12 {
		t.Fatalf("v = %d, want %d", v, BaselineVersion+12)
	}

	for _, m := range flatMoves {
		if _, err := os.Stat(m.from); !errors.Is(err, os.ErrNotExist) {
			t.Fatalf("expected flat %s to be moved, err=%v", m.from, err)
		}
		got, err := os.ReadFile(m.to)
		if err != nil {
			t.Fatalf("expected sharded %s to exist: %v", m.to, err)
		}
		if string(got) != m.content {
			t.Fatalf("content at %s = %q, want %q", m.to, got, m.content)
		}
	}
	for _, f := range keptInShard {
		got, err := os.ReadFile(f.path)
		if err != nil {
			t.Fatalf("expected pre-sharded %s to remain: %v", f.path, err)
		}
		if string(got) != f.content {
			t.Fatalf("content at %s = %q, want %q", f.path, got, f.content)
		}
	}
	for _, f := range hashes {
		if _, err := os.Stat(f.path); !errors.Is(err, os.ErrNotExist) {
			t.Fatalf("expected hash marker %s to be removed, err=%v", f.path, err)
		}
	}
	for _, at := range []string{"music", "music_cover"} {
		if _, err := os.Stat(filepath.Join(dir, "assets", at, ".hashes")); !errors.Is(err, os.ErrNotExist) {
			t.Fatalf("expected assets/%s/.hashes to be removed, err=%v", at, err)
		}
	}
}

func TestM112_NoAssetsDir(t *testing.T) {
	resetForTests()
	dir := t.TempDir()
	initDB(t, dir)
	writeV(t, dir, BaselineVersion+11)

	Register(Migration{
		From:        BaselineVersion + 11,
		To:          BaselineVersion + 12,
		Description: "m112",
		Destructive: true,
		Up:          upShardAssets,
	})

	if err := Run(context.Background(), dir); err != nil {
		t.Fatalf("Run: %v", err)
	}

	v, _ := readV(t, dir)
	if v != BaselineVersion+12 {
		t.Fatalf("v = %d, want %d", v, BaselineVersion+12)
	}
}

func TestM112_Idempotent(t *testing.T) {
	resetForTests()
	dir := t.TempDir()
	initDB(t, dir)
	writeV(t, dir, BaselineVersion+11)

	// 起始就是已经分片的状态, 迁移应当无操作通过 + bump 版本
	sharded := filepath.Join(dir, "assets", "music", "ab", "abcdef0123456789abcdef0123456789.mp3")
	if err := os.MkdirAll(filepath.Dir(sharded), 0755); err != nil {
		t.Fatalf("mkdir: %v", err)
	}
	if err := os.WriteFile(sharded, []byte("x"), 0644); err != nil {
		t.Fatalf("write: %v", err)
	}

	Register(Migration{
		From:        BaselineVersion + 11,
		To:          BaselineVersion + 12,
		Description: "m112",
		Destructive: true,
		Up:          upShardAssets,
	})

	if err := Run(context.Background(), dir); err != nil {
		t.Fatalf("Run: %v", err)
	}
	if _, err := os.Stat(sharded); err != nil {
		t.Fatalf("pre-sharded file should remain: %v", err)
	}
	v, _ := readV(t, dir)
	if v != BaselineVersion+12 {
		t.Fatalf("v = %d, want %d", v, BaselineVersion+12)
	}
}
