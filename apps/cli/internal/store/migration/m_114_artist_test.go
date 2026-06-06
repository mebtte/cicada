package migration

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"testing"
)

func TestM114_MoveSingerPhotoAssetsIntoArtistShards(t *testing.T) {
	dir := t.TempDir()
	flat := filepath.Join(dir, "assets", "singer_photo", "abcdef0123456789abcdef0123456789.jpg")
	sharded := filepath.Join(dir, "assets", "singer_photo", "de", "def0123456789abcdef0123456789abc.jpg")
	short := filepath.Join(dir, "assets", "singer_photo", "x")
	writeFile(t, flat, "flat")
	writeFile(t, sharded, "sharded")
	writeFile(t, short, "short")

	journal, err := OpenJournal(dir)
	if err != nil {
		t.Fatalf("open journal: %v", err)
	}
	defer journal.Close()

	if err := moveSingerPhotoAssets(&Env{DataDir: dir, Journal: journal}); err != nil {
		t.Fatalf("move singer photo assets: %v", err)
	}

	assertMissing(t, flat)
	assertMissing(t, sharded)
	assertMissing(t, short)
	assertFileContent(t, filepath.Join(dir, "assets", "artist_photo", "ab", filepath.Base(flat)), "flat")
	assertFileContent(t, filepath.Join(dir, "assets", "artist_photo", "de", filepath.Base(sharded)), "sharded")
	assertFileContent(t, filepath.Join(dir, "assets", "artist_photo", "00", filepath.Base(short)), "short")
}

func TestM115_RepairArtistPhotoAssetLocations(t *testing.T) {
	dir := t.TempDir()
	rootArtistPhoto := filepath.Join(dir, "assets", "artist_photo", "abcdef0123456789abcdef0123456789.jpg")
	leftoverSingerPhoto := filepath.Join(dir, "assets", "singer_photo", "de", "def0123456789abcdef0123456789abc.jpg")
	writeFile(t, rootArtistPhoto, "root artist")
	writeFile(t, leftoverSingerPhoto, "leftover singer")

	journal, err := OpenJournal(dir)
	if err != nil {
		t.Fatalf("open journal: %v", err)
	}
	defer journal.Close()

	if err := upRepairArtistPhotoAssets(context.Background(), &Env{DataDir: dir, Journal: journal}); err != nil {
		t.Fatalf("repair artist photo assets: %v", err)
	}

	assertMissing(t, rootArtistPhoto)
	assertMissing(t, leftoverSingerPhoto)
	assertFileContent(t, filepath.Join(dir, "assets", "artist_photo", "ab", filepath.Base(rootArtistPhoto)), "root artist")
	assertFileContent(t, filepath.Join(dir, "assets", "artist_photo", "de", filepath.Base(leftoverSingerPhoto)), "leftover singer")
}

func writeFile(t *testing.T, path, content string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		t.Fatalf("mkdir %s: %v", filepath.Dir(path), err)
	}
	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		t.Fatalf("write %s: %v", path, err)
	}
}

func assertMissing(t *testing.T, path string) {
	t.Helper()
	if _, err := os.Stat(path); !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("expected %s to be missing, err=%v", path, err)
	}
}

func assertFileContent(t *testing.T, path, want string) {
	t.Helper()
	got, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read %s: %v", path, err)
	}
	if string(got) != want {
		t.Fatalf("%s = %q, want %q", path, got, want)
	}
}
