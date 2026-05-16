package migration

import (
	"context"
	"database/sql"
	"os"
	"path/filepath"
	"testing"

	_ "modernc.org/sqlite"
)

func initPlayRecordIdempotencyPreV107Schema(t *testing.T, dir string) {
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
			percent REAL NOT NULL,
			timestamp INTEGER NOT NULL
		);
		INSERT INTO music_play_record (userId,musicId,percent,timestamp)
			VALUES ('user-1','music-1',0.5,1710000000000);
	`); err != nil {
		t.Fatalf("seed db: %v", err)
	}
	if err := os.MkdirAll(filepath.Join(dir, "assets"), 0755); err != nil {
		t.Fatalf("mkdir assets: %v", err)
	}
}

func TestM107_PlayRecordIdempotency(t *testing.T) {
	resetForTests()
	dir := t.TempDir()
	initPlayRecordIdempotencyPreV107Schema(t, dir)
	writeV(t, dir, BaselineVersion+6)

	Register(Migration{
		From:        BaselineVersion + 6,
		To:          BaselineVersion + 7,
		Description: "m107",
		Up:          upPlayRecordIdempotency,
	})

	if err := Run(context.Background(), dir); err != nil {
		t.Fatalf("Run: %v", err)
	}

	if !columnExists(t, dir, "music_play_record", "clientRecordId") {
		t.Fatal("expected music_play_record.clientRecordId to exist")
	}
	if !columnExists(t, dir, "music_play_record", "heatCounted") {
		t.Fatal("expected music_play_record.heatCounted to exist")
	}

	db, err := sql.Open("sqlite", filepath.Join(dir, "db"))
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	defer db.Close()

	if _, err := db.Exec(
		`INSERT INTO music_play_record (userId,musicId,clientRecordId,percent,timestamp)
			VALUES ('user-1','music-1','client-record-1',0.2,1710000000001)`,
	); err != nil {
		t.Fatalf("insert first client record: %v", err)
	}
	if _, err := db.Exec(
		`INSERT INTO music_play_record (userId,musicId,clientRecordId,percent,timestamp)
			VALUES ('user-1','music-1','client-record-1',0.3,1710000000002)`,
	); err == nil {
		t.Fatal("expected duplicate client record insert to fail")
	}
	if _, err := db.Exec(
		`INSERT INTO music_play_record (userId,musicId,clientRecordId,percent,timestamp)
			VALUES ('user-1','music-1','',0.4,1710000000003)`,
	); err != nil {
		t.Fatalf("insert blank client record id: %v", err)
	}
}
