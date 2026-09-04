package config

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestScratchPaths(t *testing.T) {
	previous := Get()
	t.Cleanup(func() { Set(previous) })
	root := t.TempDir()
	t.Chdir(root)
	for _, tc := range []struct{ name, data, scratch, want string }{
		{"default", "library", "", filepath.Join(root, "library", "scratch")},
		{"relative", "library", "local working/files", filepath.Join(root, "local working", "files")},
		{"absolute", "library", filepath.Join(root, "external"), filepath.Join(root, "external")},
	} {
		t.Run(tc.name, func(t *testing.T) {
			got, err := ResolveScratchDir(tc.data, tc.scratch)
			if err != nil || got != tc.want {
				t.Fatalf("ResolveScratchDir = %q, %v; want %q", got, err, tc.want)
			}
			Set(Config{Data: tc.data, Scratch: got})
			for _, p := range []struct{ got, suffix string }{
				{ThumbnailCacheDir(), "thumbnails"}, {MusicTranscodeCacheDir(), "music_transcoded"},
				{PartialUploadDir(), "partial_uploads"}, {AccessLogDir(), "logs/access"},
				{SchedulerLogDir(), "logs/scheduler"}, {BinDir(), "bin"},
				{FFmpegLogDir(), "logs/ffmpeg"},
			} {
				if want := filepath.Join(tc.want, p.suffix); p.got != want {
					t.Fatalf("path = %q, want %q", p.got, want)
				}
			}
		})
	}
	Set(Config{Data: filepath.Join(root, "another-library")})
	if want := filepath.Join(root, "another-library", "scratch"); ScratchDir() != want {
		t.Fatalf("empty Scratch should fall back to current Data: %s", ScratchDir())
	}
}

func TestScratchRejectsBinSymlink(t *testing.T) {
	data, scratch, outside := t.TempDir(), t.TempDir(), t.TempDir()
	if err := os.Symlink(outside, filepath.Join(scratch, "bin")); err != nil {
		t.Skipf("symlinks unavailable: %v", err)
	}
	if _, err := ResolveScratchDir(data, scratch); err == nil {
		t.Fatal("accepted a bin symlink that could redirect executable cleanup")
	}
}

func TestScratchRejectsFileRoot(t *testing.T) {
	root := t.TempDir()
	file, err := os.CreateTemp(root, "scratch-*")
	if err != nil {
		t.Fatal(err)
	}
	if err := file.Close(); err != nil {
		t.Fatal(err)
	}
	for _, name := range []string{"file", "symlink"} {
		t.Run(name, func(t *testing.T) {
			scratch := file.Name()
			if name == "symlink" {
				scratch = filepath.Join(root, "alias")
				if err := os.Symlink(file.Name(), scratch); err != nil {
					t.Skipf("symlinks unavailable: %v", err)
				}
			}
			_, err := ResolveScratchDir(filepath.Join(root, "data"), scratch)
			if err == nil || !strings.Contains(err.Error(), scratch) || !strings.Contains(err.Error(), "is not a directory") {
				t.Fatalf("expected actionable error for scratch file, got %v", err)
			}
			info, err := os.Stat(file.Name())
			if err != nil || !info.Mode().IsRegular() || info.Size() != 0 {
				t.Fatalf("scratch file must remain unchanged: %v, %v", info, err)
			}
		})
	}
}

func TestScratchAcceptsTemporaryDirectory(t *testing.T) {
	scratch := t.TempDir()
	got, err := ResolveScratchDir(t.TempDir(), scratch)
	if err != nil || got != scratch {
		t.Fatalf("ResolveScratchDir = %q, %v; want %q", got, err, scratch)
	}
}

func TestScratchRejectsReservedPathsBeforeCreatingAnything(t *testing.T) {
	root := t.TempDir()
	data := filepath.Join(root, "data")
	for _, scratch := range []string{
		root, data, filepath.Join(data, "cache"), filepath.Join(data, "cache", "new", "scratch"),
		filepath.Join(data, "partial_uploads"), filepath.Join(data, "logs", "access"),
		filepath.Join(data, "upgrade.trash", "new"), filepath.Join(data, "assets", "music"),
		filepath.Join(data, "db"), filepath.Join(data, "db", "scratch"), filepath.Join(data, "v"),
		filepath.Join(data, "db.backup"), filepath.Join(data, "upgrade.lock"), filepath.Join(data, "upgrade.journal"),
	} {
		if _, err := ResolveScratchDir(data, scratch); err == nil {
			t.Fatalf("accepted unsafe scratch %q", scratch)
		}
	}
	if _, err := os.Stat(data); !os.IsNotExist(err) {
		t.Fatalf("path resolution must not create data: %v", err)
	}
	if _, err := ResolveScratchDir(data, filepath.Join(data, "cache-scratch")); err != nil {
		t.Fatalf("path prefix is not ancestry: %v", err)
	}
}

func TestScratchCannotContainLinkedAssets(t *testing.T) {
	root := t.TempDir()
	data, scratch := filepath.Join(root, "data"), filepath.Join(root, "scratch")
	assets := filepath.Join(scratch, "music-library")
	for _, dir := range []string{data, assets} {
		if err := os.MkdirAll(dir, 0755); err != nil {
			t.Fatal(err)
		}
	}
	if err := os.Symlink(assets, filepath.Join(data, "assets")); err != nil {
		t.Skipf("symlinks unavailable: %v", err)
	}
	if _, err := ResolveScratchDir(data, scratch); err == nil {
		t.Fatal("accepted scratch containing the library's linked assets")
	}
}

func TestScratchRejectsSymlinkAliases(t *testing.T) {
	root := t.TempDir()
	data := filepath.Join(root, "data")
	legacy := filepath.Join(data, "cache")
	if err := os.MkdirAll(legacy, 0755); err != nil {
		t.Fatal(err)
	}
	alias := filepath.Join(root, "alias")
	if err := os.Symlink(legacy, alias); err != nil {
		t.Skipf("symlinks unavailable: %v", err)
	}
	if _, err := ResolveScratchDir(data, filepath.Join(alias, "missing", "scratch")); err == nil {
		t.Fatal("accepted missing descendant of a legacy directory symlink")
	}
	scratch := filepath.Join(root, "scratch")
	if err := os.MkdirAll(scratch, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(legacy, filepath.Join(scratch, "logs")); err != nil {
		t.Fatal(err)
	}
	if _, err := ResolveScratchDir(data, scratch); err == nil {
		t.Fatal("accepted managed scratch child pointing into legacy cache")
	}
}

func TestScratchRejectsLegacySymlinkToScratch(t *testing.T) {
	root := t.TempDir()
	data, scratch := filepath.Join(root, "data"), filepath.Join(root, "scratch")
	for _, dir := range []string{data, scratch} {
		if err := os.MkdirAll(dir, 0755); err != nil {
			t.Fatal(err)
		}
	}
	if err := os.Symlink(scratch, filepath.Join(data, "logs")); err != nil {
		t.Skipf("symlinks unavailable: %v", err)
	}
	if _, err := ResolveScratchDir(data, scratch); err == nil {
		t.Fatal("accepted scratch alias used by historical log migrations")
	}
}

func TestScratchVersionCannotAliasDataVersion(t *testing.T) {
	data, scratch := t.TempDir(), t.TempDir()
	versionPath := filepath.Join(data, "v")
	if err := os.WriteFile(versionPath, []byte("123"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(versionPath, filepath.Join(scratch, "v")); err != nil {
		t.Skipf("symlinks unavailable: %v", err)
	}
	if _, err := ResolveScratchDir(data, scratch); err == nil {
		t.Fatal("accepted scratch/v pointing to data/v")
	}
}
