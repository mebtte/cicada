package migration

import (
	"context"
	"database/sql"
	"path/filepath"
	"testing"

	_ "modernc.org/sqlite"
)

func initResourceUserColumnsPreV117Schema(t *testing.T, dir string) {
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
		`CREATE TABLE user (
			id TEXT PRIMARY KEY NOT NULL,
			username TEXT UNIQUE NOT NULL,
			nickname TEXT NOT NULL,
			joinTimestamp INTEGER NOT NULL,
			password TEXT NOT NULL
		)`,
		`INSERT INTO user (id,username,nickname,joinTimestamp,password) VALUES ('u1','alice','Alice',1,'h')`,
		`CREATE TABLE artist (
			id TEXT PRIMARY KEY NOT NULL,
			name TEXT NOT NULL,
			aliases TEXT NOT NULL DEFAULT '',
			searchKeywords TEXT NOT NULL DEFAULT '',
			createUserId TEXT NOT NULL REFERENCES user(id),
			createTimestamp INTEGER NOT NULL
		)`,
		`INSERT INTO artist (id,name,createUserId,createTimestamp) VALUES ('a1','Singer','u1',10)`,
		`CREATE TABLE music (
			id TEXT PRIMARY KEY NOT NULL,
			type INTEGER NOT NULL,
			name TEXT NOT NULL,
			year INTEGER DEFAULT NULL,
			aliases TEXT NOT NULL DEFAULT '',
			searchKeywords TEXT NOT NULL DEFAULT '',
			cover TEXT NOT NULL DEFAULT '',
			coverThumbnail TEXT NOT NULL DEFAULT '',
			asset TEXT NOT NULL,
			assetSize INTEGER NOT NULL DEFAULT 0,
			assetDurationMs INTEGER NOT NULL DEFAULT 0,
			assetCodec TEXT NOT NULL DEFAULT '',
			assetBitRate INTEGER NOT NULL DEFAULT 0,
			heat INTEGER NOT NULL DEFAULT 0,
			createUserId TEXT NOT NULL REFERENCES user(id),
			createTimestamp INTEGER NOT NULL
		)`,
		`INSERT INTO music (id,type,name,year,asset,createUserId,createTimestamp)
			VALUES ('m1',1,'Song',2020,'song.mp3','u1',20)`,
		`CREATE TABLE artist_photo (
			id TEXT PRIMARY KEY NOT NULL,
			artistId TEXT NOT NULL REFERENCES artist(id),
			asset TEXT NOT NULL,
			thumbnail TEXT NOT NULL DEFAULT '',
			position INTEGER NOT NULL,
			description TEXT NOT NULL DEFAULT '',
			addUserId TEXT NOT NULL REFERENCES user(id),
			addTimestamp INTEGER NOT NULL
		)`,
		`INSERT INTO artist_photo (id,artistId,asset,position,addUserId,addTimestamp)
			VALUES ('p1','a1','x.jpg',0,'u1',30)`,
		// Tables that hold FKs onto music/artist - we want these to keep working
		// after the rebuild.
		`CREATE TABLE music_singer_relation (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			musicId TEXT NOT NULL REFERENCES music(id),
			artistId TEXT NOT NULL REFERENCES artist(id),
			UNIQUE(musicId, artistId) ON CONFLICT REPLACE
		)`,
		`INSERT INTO music_singer_relation (musicId,artistId) VALUES ('m1','a1')`,
	}
	for _, s := range stmts {
		if _, err := db.Exec(s); err != nil {
			t.Fatalf("seed (%s): %v", s, err)
		}
	}
}

func TestM117_DropResourceUserColumns(t *testing.T) {
	resetForTests()
	dir := t.TempDir()
	initResourceUserColumnsPreV117Schema(t, dir)
	writeV(t, dir, BaselineVersion+16)

	Register(Migration{
		From:               BaselineVersion + 16,
		To:                 BaselineVersion + 17,
		Description:        "m117",
		Destructive:        true,
		WithoutForeignKeys: true,
		Up:                 upDropResourceUserColumns,
	})

	if err := Run(context.Background(), dir); err != nil {
		t.Fatalf("Run: %v", err)
	}

	v, _ := readV(t, dir)
	if v != BaselineVersion+17 {
		t.Fatalf("v = %d, want %d", v, BaselineVersion+17)
	}
	for _, c := range []struct {
		Table  string
		Column string
	}{
		{Table: "artist", Column: "createUserId"},
		{Table: "music", Column: "createUserId"},
		{Table: "artist_photo", Column: "addUserId"},
	} {
		if columnExists(t, dir, c.Table, c.Column) {
			t.Fatalf("%s.%s should be removed", c.Table, c.Column)
		}
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

	var artistName string
	if err := db.QueryRow(`SELECT name FROM artist WHERE id='a1'`).Scan(&artistName); err != nil {
		t.Fatalf("read migrated artist: %v", err)
	}
	if artistName != "Singer" {
		t.Fatalf("unexpected artist name: %q", artistName)
	}
	var musicName string
	var musicYear sql.NullInt64
	if err := db.QueryRow(`SELECT name,year FROM music WHERE id='m1'`).Scan(&musicName, &musicYear); err != nil {
		t.Fatalf("read migrated music: %v", err)
	}
	if musicName != "Song" {
		t.Fatalf("unexpected music name: %q", musicName)
	}
	if !musicYear.Valid || musicYear.Int64 != 2020 {
		t.Fatalf("unexpected music year: %+v", musicYear)
	}
	var photoAsset string
	if err := db.QueryRow(`SELECT asset FROM artist_photo WHERE id='p1'`).Scan(&photoAsset); err != nil {
		t.Fatalf("read migrated photo: %v", err)
	}
	if photoAsset != "x.jpg" {
		t.Fatalf("unexpected photo asset: %q", photoAsset)
	}

	// music_singer_relation should still hold its row and its FK to music/artist
	// should still resolve (rejecting orphan inserts).
	var rel int
	if err := db.QueryRow(
		`SELECT COUNT(1) FROM music_singer_relation WHERE musicId='m1' AND artistId='a1'`,
	).Scan(&rel); err != nil {
		t.Fatalf("count relation: %v", err)
	}
	if rel != 1 {
		t.Fatalf("expected 1 surviving relation row, got %d", rel)
	}
	if _, err := db.Exec(`INSERT INTO music_singer_relation (musicId,artistId) VALUES ('ghost','a1')`); err == nil {
		t.Fatalf("FK to music should still reject orphan musicId")
	}
	if _, err := db.Exec(`INSERT INTO music_singer_relation (musicId,artistId) VALUES ('m1','ghost')`); err == nil {
		t.Fatalf("FK to artist should still reject orphan artistId")
	}
}
