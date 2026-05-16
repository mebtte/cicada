package migration

import (
	"context"
	"database/sql"
	"path/filepath"
	"testing"

	_ "modernc.org/sqlite"
)

// initMusicModifyRecordSchema seeds a sqlite db at dir/db with just enough
// schema for migration 102: a music_modify_record table with a sample row, plus
// the user/music tables it references.
func initMusicModifyRecordSchema(t *testing.T, dir string) {
	t.Helper()
	db, err := sql.Open("sqlite", filepath.Join(dir, "db"))
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	defer db.Close()
	db.SetMaxOpenConns(1)
	stmts := []string{
		`PRAGMA journal_mode=WAL`,
		`CREATE TABLE user (id TEXT PRIMARY KEY NOT NULL)`,
		`CREATE TABLE music (id TEXT PRIMARY KEY NOT NULL)`,
		`CREATE TABLE music_modify_record (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			musicId TEXT NOT NULL REFERENCES music(id),
			modifyUserId TEXT NOT NULL REFERENCES user(id),
			key TEXT NOT NULL,
			modifyTimestamp INTEGER NOT NULL
		)`,
		`INSERT INTO user (id) VALUES ('user-a')`,
		`INSERT INTO music (id) VALUES ('m-1')`,
		`INSERT INTO music_modify_record (musicId, modifyUserId, key, modifyTimestamp) VALUES
			('m-1', 'user-a', 'name', 1700000000000)`,
	}
	for _, s := range stmts {
		if _, err := db.Exec(s); err != nil {
			t.Fatalf("seed (%s): %v", s, err)
		}
	}
}

func TestM102_DropMusicModifyRecord(t *testing.T) {
	resetForTests()
	dir := t.TempDir()
	initMusicModifyRecordSchema(t, dir)
	writeV(t, dir, BaselineVersion+1)

	Register(Migration{
		From:        BaselineVersion + 1,
		To:          BaselineVersion + 2,
		Description: "m102 (test)",
		Destructive: true,
		Up:          upDropMusicModifyRecord,
	})

	if err := Run(context.Background(), dir); err != nil {
		t.Fatalf("Run: %v", err)
	}

	v, _ := readV(t, dir)
	if v != BaselineVersion+2 {
		t.Fatalf("v = %d, want %d", v, BaselineVersion+2)
	}

	if tableExists(t, dir, "music_modify_record") {
		t.Error("music_modify_record should have been dropped")
	}
}

func TestM102_DropMusicModifyRecord_NoTable(t *testing.T) {
	resetForTests()
	dir := t.TempDir()
	// Fresh db without the table — DROP IF NOT EXISTS should be a no-op.
	initDB(t, dir)
	writeV(t, dir, BaselineVersion+1)

	Register(Migration{
		From:        BaselineVersion + 1,
		To:          BaselineVersion + 2,
		Description: "m102",
		Destructive: true,
		Up:          upDropMusicModifyRecord,
	})

	if err := Run(context.Background(), dir); err != nil {
		t.Fatalf("Run should be a no-op when table is absent: %v", err)
	}
	v, _ := readV(t, dir)
	if v != BaselineVersion+2 {
		t.Fatalf("v = %d, want %d", v, BaselineVersion+2)
	}
}
