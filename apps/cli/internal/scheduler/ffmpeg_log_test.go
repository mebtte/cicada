package scheduler

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	"cicada/internal/config"
)

func TestCleanOutdatedFFmpegLogRetainsRecentAndOtherLogs(t *testing.T) {
	original := config.Get()
	t.Cleanup(func() { config.Set(original) })
	config.Set(config.Config{
		Mode: config.ModeProduction, Data: t.TempDir(), Scratch: t.TempDir(), Port: 8000,
	})

	oldLog := filepath.Join(config.FFmpegLogDir(), "ffmpeg-old.log")
	recentLog := filepath.Join(config.FFmpegLogDir(), "ffmpeg-recent.log")
	otherLog := filepath.Join(config.SchedulerLogDir(), "scheduler-old.log")
	for _, path := range []string{oldLog, recentLog, otherLog} {
		if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(path, []byte("{}\n"), 0644); err != nil {
			t.Fatal(err)
		}
	}
	oldTime := time.Now().Add(-31 * 24 * time.Hour)
	for _, path := range []string{oldLog, otherLog} {
		if err := os.Chtimes(path, oldTime, oldTime); err != nil {
			t.Fatal(err)
		}
	}
	// Keep a log near the retention boundary, not merely today's file.
	recentTime := time.Now().Add(-29 * 24 * time.Hour)
	if err := os.Chtimes(recentLog, recentTime, recentTime); err != nil {
		t.Fatal(err)
	}

	result, err := cleanOutdatedFFmpegLog()
	if err != nil {
		t.Fatal(err)
	}
	if got := result.Metrics["removed_ffmpeg_log_entries"]; got != 1 {
		t.Fatalf("removed entries = %d, want 1", got)
	}
	if _, err := os.Stat(oldLog); !os.IsNotExist(err) {
		t.Fatalf("old ffmpeg log should be removed, err=%v", err)
	}
	for _, path := range []string{recentLog, otherLog, config.FFmpegLogDir()} {
		if _, err := os.Stat(path); err != nil {
			t.Fatalf("expected %s to remain: %v", path, err)
		}
	}
}

func TestCleanOutdatedFFmpegLogAllowsAbsentDirectory(t *testing.T) {
	original := config.Get()
	t.Cleanup(func() { config.Set(original) })
	config.Set(config.Config{
		Mode: config.ModeProduction, Data: t.TempDir(), Scratch: t.TempDir(), Port: 8000,
	})
	result, err := cleanOutdatedFFmpegLog()
	if err != nil || result.Metrics["removed_ffmpeg_log_entries"] != 0 {
		t.Fatalf("clean absent directory: result=%+v err=%v", result, err)
	}
}
