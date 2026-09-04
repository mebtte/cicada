package store

import (
	"cicada/internal/config"
	"cicada/internal/store/migration"
	"os"
	"path/filepath"
	"strconv"
	"testing"
)

func setupScratchStoreTest(t *testing.T) {
	t.Helper()
	previous := config.Get()
	if err := ResetForTests(); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		if err := ResetForTests(); err != nil {
			t.Error(err)
		}
		config.Set(previous)
	})
}

func TestInitializeCreatesScratchAndPreservesExistingContents(t *testing.T) {
	setupScratchStoreTest(t)
	root := t.TempDir()
	for _, custom := range []bool{false, true} {
		t.Run(strconv.FormatBool(custom), func(t *testing.T) {
			data := filepath.Join(root, t.Name())
			scratch := filepath.Join(data, "scratch")
			cfg := config.Config{Data: data, Mode: config.ModeProduction}
			if custom {
				scratch = filepath.Join(root, "outside", "working files")
				cfg.Scratch = scratch
			}
			config.Set(cfg)
			if err := Initialize(); err != nil {
				t.Fatal(err)
			}
			assertScratchVersionMatchesData(t, data, scratch)
			for _, child := range []string{"", "bin", "thumbnails", "music_transcoded", "partial_uploads", "logs/access", "logs/scheduler", "logs/ffmpeg"} {
				if info, err := os.Stat(filepath.Join(scratch, child)); err != nil || !info.IsDir() {
					t.Fatalf("missing %s: %v", child, err)
				}
			}
			for _, legacy := range []string{"cache", "partial_uploads", "logs"} {
				if _, err := os.Stat(filepath.Join(data, legacy)); !os.IsNotExist(err) {
					t.Fatalf("created legacy %s: %v", legacy, err)
				}
			}
			sentinel := filepath.Join(scratch, "keep")
			if err := os.WriteFile(sentinel, []byte("keep"), 0644); err != nil {
				t.Fatal(err)
			}
			if err := ResetForTests(); err != nil {
				t.Fatal(err)
			}
			if err := Initialize(); err != nil {
				t.Fatal(err)
			}
			if contents, err := os.ReadFile(sentinel); err != nil || string(contents) != "keep" {
				t.Fatalf("existing contents lost: %v", err)
			}
			if err := ResetForTests(); err != nil {
				t.Fatal(err)
			}
		})
	}
}

func assertScratchVersionMatchesData(t *testing.T, data, scratch string) {
	t.Helper()
	dataVersion, err := os.ReadFile(filepath.Join(data, "v"))
	if err != nil {
		t.Fatal(err)
	}
	scratchVersion, err := os.ReadFile(filepath.Join(scratch, "v"))
	if err != nil {
		t.Fatal(err)
	}
	if string(scratchVersion) != string(dataVersion) {
		t.Fatalf("scratch version %q != data version %q", scratchVersion, dataVersion)
	}
}

func TestInitializeAdoptsDeviceScratchAfterDataAlreadyUpgraded(t *testing.T) {
	setupScratchStoreTest(t)
	data := t.TempDir()
	firstScratch := t.TempDir()
	config.Set(config.Config{Data: data, Scratch: firstScratch})
	if err := Initialize(); err != nil {
		t.Fatal(err)
	}
	if err := ResetForTests(); err != nil {
		t.Fatal(err)
	}
	// A second device has the current data/v but its own unversioned scratch.
	secondScratch := t.TempDir()
	for _, name := range []string{"thumbnails/ab/image.jpg", "music_transcoded/ab/audio", "partial_uploads/session/data", "logs/access/history.log"} {
		path := filepath.Join(secondScratch, name)
		if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(path, []byte(name), 0644); err != nil {
			t.Fatal(err)
		}
	}
	config.Set(config.Config{Data: data, Scratch: secondScratch})
	if err := Initialize(); err != nil {
		t.Fatal(err)
	}
	assertScratchVersionMatchesData(t, data, secondScratch)
	for _, name := range []string{"thumbnails/ab/image.jpg", "partial_uploads/session/data", "logs/access/history.log"} {
		content, err := os.ReadFile(filepath.Join(secondScratch, name))
		if err != nil || string(content) != name {
			t.Fatalf("scratch content %s changed: %q %v", name, content, err)
		}
	}
	// Device-local scratch still runs the 123 -> 124 cache migration even
	// though the synced data directory has already advanced to that version.
	entries, err := os.ReadDir(filepath.Join(secondScratch, "music_transcoded"))
	if err != nil || len(entries) != 0 {
		t.Fatalf("legacy music cache not discarded: %v, %v", entries, err)
	}
}

func TestInitializeRejectsInvalidScratchVersionBeforeDataUpgrade(t *testing.T) {
	for _, version := range []string{"broken", "122", strconv.Itoa(migration.CurrentVersion() + 1)} {
		t.Run(version, func(t *testing.T) {
			setupScratchStoreTest(t)
			data, scratch := t.TempDir(), t.TempDir()
			if err := os.WriteFile(filepath.Join(data, "v"), []byte("122"), 0644); err != nil {
				t.Fatal(err)
			}
			legacy := filepath.Join(data, "cache", "keep")
			if err := os.MkdirAll(filepath.Dir(legacy), 0755); err != nil {
				t.Fatal(err)
			}
			if err := os.WriteFile(legacy, []byte("keep"), 0644); err != nil {
				t.Fatal(err)
			}
			if err := os.WriteFile(filepath.Join(scratch, "v"), []byte(version), 0644); err != nil {
				t.Fatal(err)
			}
			config.Set(config.Config{Data: data, Scratch: scratch})
			if err := Initialize(); err == nil {
				t.Fatal("expected incompatible scratch version error")
			}
			if got, err := os.ReadFile(filepath.Join(data, "v")); err != nil || string(got) != "122" {
				t.Fatalf("data version changed: %q %v", got, err)
			}
			if got, err := os.ReadFile(legacy); err != nil || string(got) != "keep" {
				t.Fatalf("legacy content changed: %q %v", got, err)
			}
		})
	}
}

func TestInitializeScratchFailureDoesNotDeleteLegacyData(t *testing.T) {
	for _, child := range []string{"", "logs", "thumbnails"} {
		t.Run("file-"+child, func(t *testing.T) {
			setupScratchStoreTest(t)
			root := t.TempDir()
			data, scratch := filepath.Join(root, "data"), filepath.Join(root, "scratch")
			legacy := filepath.Join(data, "cache", "keep")
			if err := os.MkdirAll(filepath.Dir(legacy), 0755); err != nil {
				t.Fatal(err)
			}
			if err := os.WriteFile(legacy, []byte("keep"), 0644); err != nil {
				t.Fatal(err)
			}
			if err := os.WriteFile(filepath.Join(data, "v"), []byte("122"), 0644); err != nil {
				t.Fatal(err)
			}
			blocked := filepath.Join(scratch, child)
			if err := os.MkdirAll(filepath.Dir(blocked), 0755); err != nil {
				t.Fatal(err)
			}
			if err := os.WriteFile(blocked, []byte("blocked"), 0644); err != nil {
				t.Fatal(err)
			}
			config.Set(config.Config{Data: data, Scratch: scratch})
			if err := Initialize(); err == nil {
				t.Fatal("expected invalid scratch error")
			}
			if _, err := os.Stat(legacy); err != nil {
				t.Fatalf("legacy deleted before scratch validation: %v", err)
			}
			if v, err := os.ReadFile(filepath.Join(data, "v")); err != nil || string(v) != "122" {
				t.Fatalf("version changed: %q %v", v, err)
			}
		})
	}
}

func TestInitializeUpgradesLegacyDirectoriesToScratch(t *testing.T) {
	setupScratchStoreTest(t)
	data, scratch := t.TempDir(), filepath.Join(t.TempDir(), "working")
	config.Set(config.Config{Data: data, Scratch: scratch})
	// Create a valid database, then simulate a library last opened at v122.
	if err := Initialize(); err != nil {
		t.Fatal(err)
	}
	if err := ResetForTests(); err != nil {
		t.Fatal(err)
	}
	for _, name := range []string{"cache", "partial_uploads", "logs", "assets/music/ab"} {
		dir := filepath.Join(data, name)
		if err := os.MkdirAll(dir, 0755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(filepath.Join(dir, "keep"), []byte("payload"), 0644); err != nil {
			t.Fatal(err)
		}
	}
	if err := os.WriteFile(filepath.Join(data, "v"), []byte("122"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := Initialize(); err != nil {
		t.Fatal(err)
	}
	for _, name := range []string{"cache", "partial_uploads", "logs", "upgrade.trash"} {
		if _, err := os.Lstat(filepath.Join(data, name)); !os.IsNotExist(err) {
			t.Fatalf("legacy %s remains: %v", name, err)
		}
	}
	if b, err := os.ReadFile(filepath.Join(data, "assets/music/ab/keep")); err != nil || string(b) != "payload" {
		t.Fatalf("asset lost: %v", err)
	}
	if b, err := os.ReadFile(filepath.Join(data, "v")); err != nil || string(b) != strconv.Itoa(migration.CurrentVersion()) {
		t.Fatalf("wrong version %q: %v", b, err)
	}
}
