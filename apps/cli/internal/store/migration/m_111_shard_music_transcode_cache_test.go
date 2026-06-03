package migration

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"testing"
)

func TestM111_ShardMusicTranscodeCache(t *testing.T) {
	resetForTests()
	dir := t.TempDir()
	initDB(t, dir)
	writeV(t, dir, BaselineVersion+10)

	// 旧的平铺音乐转码缓存, 迁移后应被移除
	flatFiles := []string{
		filepath.Join(dir, "cache", "music_transcoded", "abcdef0123456789.flac__quality-smooth_v1.m4a"),
		filepath.Join(dir, "cache", "music_transcoded", "abcdef0123456789.flac__quality-source_v1.audio"),
		filepath.Join(dir, "cache", "music_transcoded", "abcdef0123456789.flac__quality-source_v1.audio.json"),
	}
	// 已经存在的 shard 子目录及其中文件, 迁移后必须保留
	keptFiles := []string{
		filepath.Join(dir, "cache", "music_transcoded", "ab", "abdeadbeef.flac__quality-smooth_v1.m4a"),
		filepath.Join(dir, "cache", "music_transcoded", "ef", "ef1122.mp3__quality-source_v1.audio.json"),
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
		From:        BaselineVersion + 10,
		To:          BaselineVersion + 11,
		Description: "m111",
		Destructive: true,
		Up:          upShardMusicTranscodeCache,
	})

	if err := Run(context.Background(), dir); err != nil {
		t.Fatalf("Run: %v", err)
	}

	v, _ := readV(t, dir)
	if v != BaselineVersion+11 {
		t.Fatalf("v = %d, want %d", v, BaselineVersion+11)
	}
	for _, p := range flatFiles {
		if _, err := os.Stat(p); !errors.Is(err, os.ErrNotExist) {
			t.Fatalf("expected flat music transcode cache %s to be removed, err=%v", p, err)
		}
	}
	for _, p := range keptFiles {
		if _, err := os.Stat(p); err != nil {
			t.Fatalf("expected sharded music transcode cache %s to be preserved, err=%v", p, err)
		}
	}
}

func TestM111_NoMusicTranscodeDir(t *testing.T) {
	resetForTests()
	dir := t.TempDir()
	initDB(t, dir)
	writeV(t, dir, BaselineVersion+10)

	Register(Migration{
		From:        BaselineVersion + 10,
		To:          BaselineVersion + 11,
		Description: "m111",
		Destructive: true,
		Up:          upShardMusicTranscodeCache,
	})

	if err := Run(context.Background(), dir); err != nil {
		t.Fatalf("Run: %v", err)
	}

	v, _ := readV(t, dir)
	if v != BaselineVersion+11 {
		t.Fatalf("v = %d, want %d", v, BaselineVersion+11)
	}
}
