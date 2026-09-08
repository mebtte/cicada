package cmd

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestStartMusicTranscodeFlag(t *testing.T) {
	flag := startCmd.Flags().Lookup("music-transcode")
	if flag == nil || flag.DefValue != "eager" {
		t.Fatalf("music-transcode flag missing or default is not eager: %v", flag)
	}
	if !strings.Contains(flag.Usage, "lazy") || !strings.Contains(flag.Usage, "60 days") {
		t.Fatalf("flag help must describe lazy retention: %s", flag.Usage)
	}
	previous := startMusicTranscode
	t.Cleanup(func() { startMusicTranscode = previous })
	if err := flag.Value.Set("lazy"); err != nil {
		t.Fatal(err)
	}
	if startMusicTranscode != "lazy" {
		t.Fatalf("parsed mode = %q, want lazy", startMusicTranscode)
	}
}

func TestStartRejectsInvalidMusicTranscodeBeforeInitializingData(t *testing.T) {
	previousMode, previousData := startMusicTranscode, startData
	t.Cleanup(func() { startMusicTranscode, startData = previousMode, previousData })
	startMusicTranscode = "disabled"
	startData = filepath.Join(t.TempDir(), "uninitialized")
	err := runStart(startCmd, nil)
	if err == nil || !strings.Contains(err.Error(), "--music-transcode") {
		t.Fatalf("expected mode validation error, got %v", err)
	}
	if _, err := os.Stat(startData); !os.IsNotExist(err) {
		t.Fatalf("invalid mode must not initialize data: %v", err)
	}
}
