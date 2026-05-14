package migration

import (
	"context"
	"database/sql"
	"os"
	"path/filepath"
	"testing"

	_ "modernc.org/sqlite"
)

func initMusicAssetInfoPreV106Schema(t *testing.T, dir string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Join(dir, "assets", "music"), 0755); err != nil {
		t.Fatalf("mkdir music assets: %v", err)
	}
	if err := os.WriteFile(filepath.Join(dir, "assets", "music", "song.mp3"), []byte("not a real audio file"), 0644); err != nil {
		t.Fatalf("write music asset: %v", err)
	}

	db, err := sql.Open("sqlite", filepath.Join(dir, "db"))
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	defer db.Close()
	db.SetMaxOpenConns(1)
	if _, err := db.Exec(`
		PRAGMA journal_mode=WAL;
		CREATE TABLE music (
			id TEXT PRIMARY KEY NOT NULL,
			asset TEXT NOT NULL
		);
		INSERT INTO music (id, asset) VALUES ('m-1', 'song.mp3');
	`); err != nil {
		t.Fatalf("seed db: %v", err)
	}
}

func TestM106_MusicAssetInfo(t *testing.T) {
	resetForTests()
	dir := t.TempDir()
	initMusicAssetInfoPreV106Schema(t, dir)
	writeV(t, dir, BaselineVersion+5)

	Register(Migration{
		From:        BaselineVersion + 5,
		To:          BaselineVersion + 6,
		Description: "m106",
		Up:          upMusicAssetInfo,
	})

	if err := Run(context.Background(), dir); err != nil {
		t.Fatalf("Run: %v", err)
	}

	for _, col := range []string{"assetSize", "assetDurationMs", "assetCodec", "assetBitRate"} {
		if !columnExists(t, dir, "music", col) {
			t.Fatalf("expected music.%s to exist", col)
		}
	}

	db, err := sql.Open("sqlite", filepath.Join(dir, "db"))
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	defer db.Close()

	var assetSize int64
	if err := db.QueryRow(`SELECT assetSize FROM music WHERE id='m-1'`).Scan(&assetSize); err != nil {
		t.Fatalf("read asset size: %v", err)
	}
	if assetSize == 0 {
		t.Fatal("expected asset size to be backfilled")
	}
}
