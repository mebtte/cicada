package migration

import (
	"context"
	"database/sql"
	"os"
	"path/filepath"
	"testing"

	_ "modernc.org/sqlite"
)

func initPlayRecordPlayedAtPreV108Schema(t *testing.T, dir string) {
	t.Helper()
	db, err := sql.Open("sqlite", filepath.Join(dir, "db"))
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	defer db.Close()
	db.SetMaxOpenConns(1)
	if _, err := db.Exec(`
		PRAGMA journal_mode=WAL;
		CREATE TABLE music_play_record (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			userId TEXT NOT NULL,
			musicId TEXT NOT NULL,
			clientRecordId TEXT NOT NULL DEFAULT '',
			percent REAL NOT NULL,
			timestamp INTEGER NOT NULL,
			heatCounted INTEGER NOT NULL DEFAULT 0
		);
		INSERT INTO music_play_record (userId,musicId,clientRecordId,percent,timestamp,heatCounted)
			VALUES ('user-1','music-1','client-record-1',0.5,1710000000000,0);
	`); err != nil {
		t.Fatalf("seed db: %v", err)
	}
	if err := os.MkdirAll(filepath.Join(dir, "assets"), 0755); err != nil {
		t.Fatalf("mkdir assets: %v", err)
	}
}

func TestM108_PlayRecordPlayedAt(t *testing.T) {
	resetForTests()
	dir := t.TempDir()
	initPlayRecordPlayedAtPreV108Schema(t, dir)
	writeV(t, dir, BaselineVersion+7)

	Register(Migration{
		From:        BaselineVersion + 7,
		To:          BaselineVersion + 8,
		Description: "m108",
		Up:          upPlayRecordPlayedAt,
	})

	if err := Run(context.Background(), dir); err != nil {
		t.Fatalf("Run: %v", err)
	}

	if !columnExists(t, dir, "music_play_record", "playedAt") {
		t.Fatal("expected music_play_record.playedAt to exist")
	}
	if columnExists(t, dir, "music_play_record", "timestamp") {
		t.Fatal("expected music_play_record.timestamp to be renamed")
	}

	db, err := sql.Open("sqlite", filepath.Join(dir, "db"))
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	defer db.Close()

	var playedAt int64
	if err := db.QueryRow(`SELECT playedAt FROM music_play_record WHERE clientRecordId='client-record-1'`).Scan(&playedAt); err != nil {
		t.Fatalf("query playedAt: %v", err)
	}
	if playedAt != 1710000000000 {
		t.Fatalf("playedAt = %d, want %d", playedAt, int64(1710000000000))
	}
}
