package migration

import (
	"context"
	"database/sql"
	"path/filepath"
	"testing"

	_ "modernc.org/sqlite"
)

func initComposerPreV118Schema(t *testing.T, dir string) {
	t.Helper()
	db, err := sql.Open("sqlite", filepath.Join(dir, "db"))
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	defer db.Close()
	db.SetMaxOpenConns(1)
	stmts := []string{
		`PRAGMA journal_mode=WAL`,
		`PRAGMA foreign_keys=ON`,
		`CREATE TABLE artist (
			id TEXT PRIMARY KEY NOT NULL,
			name TEXT NOT NULL,
			aliases TEXT NOT NULL DEFAULT '',
			searchKeywords TEXT NOT NULL DEFAULT '',
			createTimestamp INTEGER NOT NULL
		)`,
		`INSERT INTO artist (id,name,createTimestamp) VALUES ('a1','Composer',1)`,
		`CREATE TABLE music (
			id TEXT PRIMARY KEY NOT NULL,
			type INTEGER NOT NULL,
			name TEXT NOT NULL,
			asset TEXT NOT NULL,
			createTimestamp INTEGER NOT NULL
		)`,
		`INSERT INTO music (id,type,name,asset,createTimestamp) VALUES ('m1',1,'Song','x.mp3',2)`,
	}
	for _, s := range stmts {
		if _, err := db.Exec(s); err != nil {
			t.Fatalf("seed (%s): %v", s, err)
		}
	}
}

func TestM118_AddMusicComposerRelation(t *testing.T) {
	resetForTests()
	dir := t.TempDir()
	initComposerPreV118Schema(t, dir)
	writeV(t, dir, BaselineVersion+17)

	Register(Migration{
		From:        BaselineVersion + 17,
		To:          BaselineVersion + 18,
		Description: "m118",
		Up:          upComposer,
	})

	if err := Run(context.Background(), dir); err != nil {
		t.Fatalf("Run: %v", err)
	}

	v, _ := readV(t, dir)
	if v != BaselineVersion+18 {
		t.Fatalf("v = %d, want %d", v, BaselineVersion+18)
	}

	db, err := sql.Open("sqlite", filepath.Join(dir, "db"))
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	defer db.Close()
	db.SetMaxOpenConns(1)
	if _, err := db.Exec(`PRAGMA foreign_keys=ON`); err != nil {
		t.Fatalf("enable fk: %v", err)
	}

	// Table accepts valid pairs, enforces uniqueness, and rejects orphans.
	if _, err := db.Exec(`INSERT INTO music_composer_relation (musicId,artistId) VALUES ('m1','a1')`); err != nil {
		t.Fatalf("insert composer relation: %v", err)
	}
	if _, err := db.Exec(`INSERT INTO music_composer_relation (musicId,artistId) VALUES ('m1','a1')`); err != nil {
		t.Fatalf("ON CONFLICT REPLACE should not fail on duplicate: %v", err)
	}
	var count int
	if err := db.QueryRow(`SELECT COUNT(1) FROM music_composer_relation`).Scan(&count); err != nil {
		t.Fatalf("count: %v", err)
	}
	if count != 1 {
		t.Fatalf("expected 1 row after dedup, got %d", count)
	}
	if _, err := db.Exec(`INSERT INTO music_composer_relation (musicId,artistId) VALUES ('ghost','a1')`); err == nil {
		t.Fatalf("FK to music should reject orphan musicId")
	}
	if _, err := db.Exec(`INSERT INTO music_composer_relation (musicId,artistId) VALUES ('m1','ghost')`); err == nil {
		t.Fatalf("FK to artist should reject orphan artistId")
	}

	// Indices exist.
	for _, name := range []string{"idx_music_composer_relation_music", "idx_music_composer_relation_artist"} {
		var n string
		if err := db.QueryRow(`SELECT name FROM sqlite_master WHERE type='index' AND name=?`, name).Scan(&n); err != nil {
			t.Fatalf("missing index %s: %v", name, err)
		}
	}
}
