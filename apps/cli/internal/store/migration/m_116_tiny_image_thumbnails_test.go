package migration

import (
	"context"
	"database/sql"
	"image"
	"image/color"
	"image/jpeg"
	"os"
	"path/filepath"
	"strings"
	"testing"

	_ "modernc.org/sqlite"
)

func TestM116_TinyImageThumbnails(t *testing.T) {
	resetForTests()
	dir := t.TempDir()
	writeV(t, dir, BaselineVersion+15)

	cover := "abcover.jpg"
	photo := "cdphoto.jpg"
	writeMigrationTestJPEG(t, filepath.Join(dir, "assets", "music_cover", "ab", cover))
	writeMigrationTestJPEG(t, filepath.Join(dir, "assets", "artist_photo", "cd", photo))

	db, err := sql.Open("sqlite", filepath.Join(dir, "db"))
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	db.SetMaxOpenConns(1)
	if _, err := db.Exec(`
		PRAGMA journal_mode=WAL;
		CREATE TABLE music (
			id TEXT PRIMARY KEY NOT NULL,
			cover TEXT NOT NULL DEFAULT ''
		);
		CREATE TABLE artist_photo (
			id TEXT PRIMARY KEY NOT NULL,
			asset TEXT NOT NULL
		);
	`); err != nil {
		db.Close()
		t.Fatalf("seed db: %v", err)
	}
	if _, err := db.Exec(`INSERT INTO music (id, cover) VALUES ('music-1', ?)`, cover); err != nil {
		db.Close()
		t.Fatalf("insert music: %v", err)
	}
	if _, err := db.Exec(`INSERT INTO artist_photo (id, asset) VALUES ('photo-1', ?)`, photo); err != nil {
		db.Close()
		t.Fatalf("insert artist photo: %v", err)
	}
	if err := db.Close(); err != nil {
		t.Fatalf("close seed db: %v", err)
	}

	Register(Migration{
		From:        BaselineVersion + 15,
		To:          BaselineVersion + 16,
		Description: "m116",
		Up:          upTinyImageThumbnails,
	})

	if err := Run(context.Background(), dir); err != nil {
		t.Fatalf("Run: %v", err)
	}

	if !columnExists(t, dir, "music", "coverThumbnail") {
		t.Fatal("expected music.coverThumbnail column")
	}
	if !columnExists(t, dir, "artist_photo", "thumbnail") {
		t.Fatal("expected artist_photo.thumbnail column")
	}

	db, err = sql.Open("sqlite", filepath.Join(dir, "db"))
	if err != nil {
		t.Fatalf("open upgraded db: %v", err)
	}
	defer db.Close()

	var coverThumbnail, photoThumbnail string
	if err := db.QueryRow(`SELECT coverThumbnail FROM music WHERE id='music-1'`).Scan(&coverThumbnail); err != nil {
		t.Fatalf("read cover thumbnail: %v", err)
	}
	if err := db.QueryRow(`SELECT thumbnail FROM artist_photo WHERE id='photo-1'`).Scan(&photoThumbnail); err != nil {
		t.Fatalf("read photo thumbnail: %v", err)
	}
	for name, value := range map[string]string{
		"cover": coverThumbnail,
		"photo": photoThumbnail,
	} {
		if !strings.HasPrefix(value, "data:image/jpeg;base64,") {
			t.Fatalf("expected %s thumbnail data URL, got %q", name, value)
		}
	}
}

func writeMigrationTestJPEG(t *testing.T, path string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		t.Fatalf("mkdir %s: %v", filepath.Dir(path), err)
	}

	img := image.NewRGBA(image.Rect(0, 0, 32, 32))
	for y := 0; y < 32; y++ {
		for x := 0; x < 32; x++ {
			img.Set(x, y, color.RGBA{R: uint8(x * 8), G: uint8(y * 8), B: 100, A: 255})
		}
	}

	f, err := os.Create(path)
	if err != nil {
		t.Fatalf("create jpeg: %v", err)
	}
	defer f.Close()
	if err := jpeg.Encode(f, img, &jpeg.Options{Quality: 90}); err != nil {
		t.Fatalf("encode jpeg: %v", err)
	}
}
