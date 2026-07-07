package migration

import (
	"context"
	"database/sql"
	"path/filepath"
	"strings"
	"testing"

	_ "modernc.org/sqlite"
)

func TestM122_MusicbillCoverThumbnails(t *testing.T) {
	resetForTests()
	dir := t.TempDir()
	writeV(t, dir, BaselineVersion+21)

	cover := "abcover.jpg"
	writeMigrationTestJPEG(t, filepath.Join(dir, "assets", "musicbill_cover", "ab", cover))

	db, err := sql.Open("sqlite", filepath.Join(dir, "db"))
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	db.SetMaxOpenConns(1)
	if _, err := db.Exec(`
		PRAGMA journal_mode=WAL;
		CREATE TABLE musicbill (
			id TEXT PRIMARY KEY NOT NULL,
			cover TEXT NOT NULL DEFAULT ''
		);
	`); err != nil {
		db.Close()
		t.Fatalf("seed db: %v", err)
	}
	if _, err := db.Exec(`INSERT INTO musicbill (id, cover) VALUES ('musicbill-1', ?)`, cover); err != nil {
		db.Close()
		t.Fatalf("insert musicbill: %v", err)
	}
	if err := db.Close(); err != nil {
		t.Fatalf("close seed db: %v", err)
	}

	Register(Migration{
		From:        BaselineVersion + 21,
		To:          BaselineVersion + 22,
		Description: "m122",
		Up:          upMusicbillCoverThumbnails,
	})

	if err := Run(context.Background(), dir); err != nil {
		t.Fatalf("Run: %v", err)
	}

	if !columnExists(t, dir, "musicbill", "coverThumbnail") {
		t.Fatal("expected musicbill.coverThumbnail column")
	}

	db, err = sql.Open("sqlite", filepath.Join(dir, "db"))
	if err != nil {
		t.Fatalf("open upgraded db: %v", err)
	}
	defer db.Close()

	var thumbnail string
	if err := db.QueryRow(`SELECT coverThumbnail FROM musicbill WHERE id='musicbill-1'`).Scan(&thumbnail); err != nil {
		t.Fatalf("read cover thumbnail: %v", err)
	}
	if !strings.HasPrefix(thumbnail, "data:image/jpeg;base64,") {
		t.Fatalf("expected musicbill cover thumbnail data URL, got %q", thumbnail)
	}
}
