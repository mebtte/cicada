package embeddedtools

import (
	"os"
	"path/filepath"
	"runtime"
	"testing"
	"time"
)

func putFile(t *testing.T, path, content string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		t.Fatal(err)
	}
}

func assertFile(t *testing.T, path, content string) {
	t.Helper()
	got, err := os.ReadFile(path)
	if err != nil || string(got) != content {
		t.Fatalf("%s = %q, %v; want %q", path, got, err, content)
	}
}

func TestPrepareReusesAndReplacesExecutables(t *testing.T) {
	dir := filepath.Join(t.TempDir(), "scratch", "bin")
	tools := []Tool{{Name: "ffmpeg", Data: []byte("v1")}, {Name: "ffprobe", Data: []byte("probe")}}
	if err := Prepare(dir, tools); err != nil {
		t.Fatal(err)
	}
	path := filepath.Join(dir, "ffmpeg")
	oldTime := time.Unix(1000000000, 0)
	if err := os.Chtimes(path, oldTime, oldTime); err != nil {
		t.Fatal(err)
	}
	if err := os.Chmod(path, 0644); err != nil {
		t.Fatal(err)
	}
	before, err := os.Stat(path)
	if err != nil {
		t.Fatal(err)
	}
	if err := Prepare(dir, tools); err != nil {
		t.Fatal(err)
	}
	after, err := os.Stat(path)
	if err != nil {
		t.Fatal(err)
	}
	if !os.SameFile(before, after) || !after.ModTime().Equal(before.ModTime()) {
		t.Fatal("unchanged executable was rewritten")
	}
	if runtime.GOOS != "windows" && after.Mode().Perm() != 0755 {
		t.Fatalf("executable permissions not restored: %v", after.Mode())
	}
	tools[0].Data = []byte("v2")
	if err := Prepare(dir, tools); err != nil {
		t.Fatal(err)
	}
	assertFile(t, path, "v2")
	assertFile(t, filepath.Join(dir, "ffprobe"), "probe")
	after, err = os.Stat(path)
	if err != nil {
		t.Fatal(err)
	}
	if os.SameFile(before, after) {
		t.Fatal("changed executable was overwritten in place")
	}
	entries, err := os.ReadDir(dir)
	if err != nil || len(entries) != 2 {
		t.Fatalf("unexpected leftover staging files: %v, %v", entries, err)
	}
}

func TestPrepareCrossPlatformAndInventoryChanges(t *testing.T) {
	root := t.TempDir()
	dir := filepath.Join(root, "bin")
	putFile(t, filepath.Join(root, "logs", "keep"), "keep")
	for _, names := range [][]string{
		{"ffmpeg", "ffprobe", "extra-tool"},
		{"ffmpeg.exe", "ffprobe.exe"},
		{"ffmpeg", "ffprobe"},
	} {
		putFile(t, filepath.Join(dir, ".tool-interrupted"), "partial")
		putFile(t, filepath.Join(dir, "obsolete-platform", "old-tool"), "old")
		var tools []Tool
		for _, name := range names {
			tools = append(tools, Tool{Name: name, Data: []byte(name)})
		}
		if err := Prepare(dir, tools); err != nil {
			t.Fatal(err)
		}
		entries, err := os.ReadDir(dir)
		if err != nil || len(entries) != len(names) {
			t.Fatalf("obsolete inventory retained: %v, %v", entries, err)
		}
		for _, name := range names {
			assertFile(t, filepath.Join(dir, name), name)
		}
	}
	assertFile(t, filepath.Join(root, "logs", "keep"), "keep")
}

func TestPrepareFailurePreservesObsoleteFilesAndCanRetry(t *testing.T) {
	dir := t.TempDir()
	// A directory at a tool path is an error, never recursively replaced.
	if err := os.Mkdir(filepath.Join(dir, "ffprobe"), 0755); err != nil {
		t.Fatal(err)
	}
	putFile(t, filepath.Join(dir, "ffmpeg.exe"), "old platform")
	tools := []Tool{{Name: "ffmpeg", Data: []byte("new")}, {Name: "ffprobe", Data: []byte("probe")}}
	if err := Prepare(dir, tools); err == nil {
		t.Fatal("expected preparation failure")
	}
	assertFile(t, filepath.Join(dir, "ffmpeg.exe"), "old platform")
	if err := os.Remove(filepath.Join(dir, "ffprobe")); err != nil {
		t.Fatal(err)
	}
	if err := Prepare(dir, tools); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(filepath.Join(dir, "ffmpeg.exe")); !os.IsNotExist(err) {
		t.Fatalf("retry did not remove obsolete binary: %v", err)
	}
}

func TestPreparePrunesCaseVariantsWithoutDeletingInstalledTool(t *testing.T) {
	dir := t.TempDir()
	putFile(t, filepath.Join(dir, "FFMPEG"), "old")
	if err := Prepare(dir, []Tool{{Name: "ffmpeg", Data: []byte("new")}}); err != nil {
		t.Fatal(err)
	}
	assertFile(t, filepath.Join(dir, "ffmpeg"), "new")
	entries, err := os.ReadDir(dir)
	if err != nil || len(entries) != 1 {
		t.Fatalf("case variant retained: %v, %v", entries, err)
	}
}

func TestPrepareDoesNotFollowSymlinks(t *testing.T) {
	root, outside := t.TempDir(), t.TempDir()
	target := filepath.Join(outside, "target")
	putFile(t, target, "same")
	alias := filepath.Join(root, "bin-alias")
	if err := os.Symlink(outside, alias); err != nil {
		t.Skipf("symlinks unavailable: %v", err)
	}
	tools := []Tool{{Name: "ffmpeg", Data: []byte("same")}}
	if err := Prepare(alias, tools); err == nil {
		t.Fatal("accepted symlink as bin directory")
	}
	dir := filepath.Join(root, "bin")
	if err := os.Mkdir(dir, 0755); err != nil {
		t.Fatal(err)
	}
	for name, destination := range map[string]string{"ffmpeg": target, "obsolete": outside} {
		if err := os.Symlink(destination, filepath.Join(dir, name)); err != nil {
			t.Fatal(err)
		}
	}
	if err := Prepare(dir, tools); err != nil {
		t.Fatal(err)
	}
	info, err := os.Lstat(filepath.Join(dir, "ffmpeg"))
	if err != nil || !info.Mode().IsRegular() {
		t.Fatalf("executable symlink not replaced: %v, %v", info, err)
	}
	assertFile(t, target, "same")
	info, err = os.Stat(target)
	if err != nil || (runtime.GOOS != "windows" && info.Mode().Perm() != 0644) {
		t.Fatalf("symlink target permissions changed: %v, %v", info, err)
	}
	if _, err := os.Lstat(filepath.Join(dir, "obsolete")); !os.IsNotExist(err) {
		t.Fatalf("obsolete symlink retained: %v", err)
	}
}

func TestPrepareRejectsInvalidInventoryBeforeWriting(t *testing.T) {
	for _, tools := range [][]Tool{
		nil,
		{{Name: "../escape", Data: []byte("bad")}},
		{{Name: `..\escape`, Data: []byte("bad")}},
		{{Name: "ffmpeg"}},
		{{Name: "ffmpeg", Data: []byte("one")}, {Name: "FFMPEG", Data: []byte("two")}},
	} {
		dir := filepath.Join(t.TempDir(), "bin")
		if err := Prepare(dir, tools); err == nil {
			t.Fatalf("accepted invalid inventory: %v", tools)
		}
		if _, err := os.Stat(dir); !os.IsNotExist(err) {
			t.Fatalf("invalid inventory created directory: %v", err)
		}
	}
}
