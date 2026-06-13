package migration

import (
	"context"
	"database/sql"
	"fmt"
	"path/filepath"
	"testing"

	_ "modernc.org/sqlite"
)

func initMusicArtistRelationPreV120Schema(t *testing.T, dir string) {
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
		`INSERT INTO artist (id,name,createTimestamp) VALUES
			('a1','Performer',1),
			('a2','Lyricist',1),
			('a3','Composer',1)`,
		`CREATE TABLE music (
			id TEXT PRIMARY KEY NOT NULL,
			type INTEGER NOT NULL,
			name TEXT NOT NULL,
			asset TEXT NOT NULL,
			createTimestamp INTEGER NOT NULL
		)`,
		`INSERT INTO music (id,type,name,asset,createTimestamp) VALUES ('m1',1,'Song','x.mp3',2)`,
		`CREATE TABLE music_singer_relation (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			musicId TEXT NOT NULL REFERENCES music(id),
			artistId TEXT NOT NULL REFERENCES artist(id),
			UNIQUE(musicId, artistId) ON CONFLICT REPLACE
		)`,
		`CREATE TABLE music_lyricist_relation (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			musicId TEXT NOT NULL REFERENCES music(id),
			artistId TEXT NOT NULL REFERENCES artist(id),
			UNIQUE(musicId, artistId) ON CONFLICT REPLACE
		)`,
		`CREATE TABLE music_composer_relation (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			musicId TEXT NOT NULL REFERENCES music(id),
			artistId TEXT NOT NULL REFERENCES artist(id),
			UNIQUE(musicId, artistId) ON CONFLICT REPLACE
		)`,
		`INSERT INTO music_singer_relation (id,musicId,artistId) VALUES (7,'m1','a1')`,
		`INSERT INTO music_lyricist_relation (id,musicId,artistId) VALUES (8,'m1','a2')`,
		`INSERT INTO music_composer_relation (id,musicId,artistId) VALUES (9,'m1','a3')`,
	}
	for _, s := range stmts {
		if _, err := db.Exec(s); err != nil {
			t.Fatalf("seed (%s): %v", s, err)
		}
	}
}

func TestM120_MergeMusicArtistRelations(t *testing.T) {
	resetForTests()
	dir := t.TempDir()
	initMusicArtistRelationPreV120Schema(t, dir)
	writeV(t, dir, BaselineVersion+19)

	Register(Migration{
		From:        BaselineVersion + 19,
		To:          BaselineVersion + 20,
		Description: "m120",
		Destructive: true,
		Up:          upMusicArtistRelation,
	})

	if err := Run(context.Background(), dir); err != nil {
		t.Fatalf("Run: %v", err)
	}

	v, _ := readV(t, dir)
	if v != BaselineVersion+20 {
		t.Fatalf("v = %d, want %d", v, BaselineVersion+20)
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

	rows := queryAll(t, dir, `SELECT musicId,artistId,role,position FROM music_artist_relation ORDER BY role`)
	if len(rows) != 3 {
		t.Fatalf("expected 3 migrated rows, got %+v", rows)
	}
	want := map[string]string{
		"composer":  "a3:9",
		"lyricist":  "a2:8",
		"performer": "a1:7",
	}
	for _, row := range rows {
		role := fmt.Sprint(row["role"])
		got := fmt.Sprintf("%v:%v", row["artistId"], row["position"])
		if want[role] != got {
			t.Fatalf("role %s migrated as %s, want %s; rows=%+v", role, got, want[role], rows)
		}
	}

	for _, table := range []string{"music_singer_relation", "music_lyricist_relation", "music_composer_relation"} {
		if tableExists(t, dir, table) {
			t.Fatalf("%s should have been dropped", table)
		}
	}
	for _, name := range []string{"idx_music_artist_relation_music_role", "idx_music_artist_relation_artist_role"} {
		var n string
		if err := db.QueryRow(`SELECT name FROM sqlite_master WHERE type='index' AND name=?`, name).Scan(&n); err != nil {
			t.Fatalf("missing index %s: %v", name, err)
		}
	}
	if _, err := db.Exec(`INSERT INTO music_artist_relation (musicId,artistId,role) VALUES ('m1','a1','performer')`); err != nil {
		t.Fatalf("duplicate role relation should replace: %v", err)
	}
	if _, err := db.Exec(`INSERT INTO music_artist_relation (musicId,artistId,role) VALUES ('m1','a1','invalid')`); err == nil {
		t.Fatalf("invalid role should be rejected")
	}
}
