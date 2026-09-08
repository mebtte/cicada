package ffmpeg

import (
	"cicada/internal/config"
	"os"
	"path/filepath"
	"testing"
)

func TestPreparePathsUsesScratchBin(t *testing.T) {
	previousConfig, previousBundle := config.Get(), bundle
	t.Cleanup(func() { config.Set(previousConfig); bundle = previousBundle })
	for _, custom := range []bool{false, true} {
		cfg := config.Config{Data: t.TempDir()}
		if custom {
			cfg.Scratch = filepath.Join(t.TempDir(), "custom scratch")
		}
		config.Set(cfg)
		for _, suffix := range []string{"", ".exe"} {
			bundle = embeddedBundle{
				ffmpegName: "ffmpeg" + suffix, ffprobeName: "ffprobe" + suffix,
				ffmpegData: []byte("embedded ffmpeg"), ffprobeData: []byte("embedded ffprobe"),
			}
			paths, err := preparePaths()
			if err != nil {
				t.Fatal(err)
			}
			if paths.FFmpeg != filepath.Join(config.BinDir(), bundle.ffmpegName) || paths.FFprobe != filepath.Join(config.BinDir(), bundle.ffprobeName) {
				t.Fatalf("unexpected paths: %+v", paths)
			}
			for path, want := range map[string]string{paths.FFmpeg: "embedded ffmpeg", paths.FFprobe: "embedded ffprobe"} {
				got, err := os.ReadFile(path)
				if err != nil || string(got) != want {
					t.Fatalf("%s = %q, %v", path, got, err)
				}
			}
		}
	}
}

func TestMissingBundlePreservesBin(t *testing.T) {
	previousConfig, previousBundle := config.Get(), bundle
	t.Cleanup(func() { config.Set(previousConfig); bundle = previousBundle })
	config.Set(config.Config{Data: t.TempDir()})
	if err := os.MkdirAll(config.BinDir(), 0755); err != nil {
		t.Fatal(err)
	}
	path := filepath.Join(config.BinDir(), "keep")
	if err := os.WriteFile(path, []byte("keep"), 0644); err != nil {
		t.Fatal(err)
	}
	bundle = embeddedBundle{}
	if _, err := preparePaths(); err == nil {
		t.Fatal("accepted missing embedded tools")
	}
	if got, err := os.ReadFile(path); err != nil || string(got) != "keep" {
		t.Fatalf("existing bin modified: %q, %v", got, err)
	}
}
