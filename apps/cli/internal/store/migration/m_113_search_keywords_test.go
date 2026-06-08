package migration

import (
	"context"
	"database/sql"
	"path/filepath"
	"testing"

	_ "modernc.org/sqlite"
)

func TestM113_SearchKeywords(t *testing.T) {
	resetForTests()
	dir := t.TempDir()
	initDB(t, dir)
	writeV(t, dir, BaselineVersion+12)

	db, err := sql.Open("sqlite", filepath.Join(dir, "db"))
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	db.SetMaxOpenConns(1)
	if _, err := db.Exec(`
		CREATE TABLE music (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL);
		CREATE TABLE singer (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL);
		INSERT INTO music (id,name) VALUES ('music-1','Song');
		INSERT INTO singer (id,name) VALUES ('singer-1','Singer');
	`); err != nil {
		db.Close()
		t.Fatalf("seed old schema: %v", err)
	}
	if err := db.Close(); err != nil {
		t.Fatalf("close db: %v", err)
	}

	Register(Migration{
		From:        BaselineVersion + 12,
		To:          BaselineVersion + 13,
		Description: "m113",
		Up:          upSearchKeywords,
	})

	if err := Run(context.Background(), dir); err != nil {
		t.Fatalf("Run: %v", err)
	}

	v, _ := readV(t, dir)
	if v != BaselineVersion+13 {
		t.Fatalf("v = %d, want %d", v, BaselineVersion+13)
	}
	if !columnExists(t, dir, "music", "searchKeywords") {
		t.Fatal("music.searchKeywords column not added")
	}
	if !columnExists(t, dir, "singer", "searchKeywords") {
		t.Fatal("singer.searchKeywords column not added")
	}

	db, err = sql.Open("sqlite", filepath.Join(dir, "db"))
	if err != nil {
		t.Fatalf("reopen db: %v", err)
	}
	defer db.Close()
	db.SetMaxOpenConns(1)

	var musicSearchKeywords string
	if err := db.QueryRow(`SELECT searchKeywords FROM music WHERE id='music-1'`).Scan(&musicSearchKeywords); err != nil {
		t.Fatalf("read music searchKeywords: %v", err)
	}
	if musicSearchKeywords != "" {
		t.Fatalf("music searchKeywords = %q, want empty string", musicSearchKeywords)
	}

	var singerSearchKeywords string
	if err := db.QueryRow(`SELECT searchKeywords FROM singer WHERE id='singer-1'`).Scan(&singerSearchKeywords); err != nil {
		t.Fatalf("read singer searchKeywords: %v", err)
	}
	if singerSearchKeywords != "" {
		t.Fatalf("singer searchKeywords = %q, want empty string", singerSearchKeywords)
	}
}
