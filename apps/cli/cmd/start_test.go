package cmd

import (
	"cicada/internal/config"
	"testing"
)

func TestParseStartFileMaxSizeUsesFlagBeforeEnv(t *testing.T) {
	t.Setenv(config.MusicFileMaxSizeEnvVar, "300mb")

	got, err := parseStartFileMaxSize(
		"music file max size",
		"250mb",
		config.MusicFileMaxSizeEnvVar,
		config.DefaultMusicFileMaxSize,
	)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	if got != 250*1024*1024 {
		t.Fatalf("size = %d, want %d", got, 250*1024*1024)
	}
}

func TestParseStartFileMaxSizeUsesEnv(t *testing.T) {
	t.Setenv(config.ImageFileMaxSizeEnvVar, "8mb")

	got, err := parseStartFileMaxSize(
		"image file max size",
		"",
		config.ImageFileMaxSizeEnvVar,
		config.DefaultImageFileMaxSize,
	)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	if got != 8*1024*1024 {
		t.Fatalf("size = %d, want %d", got, 8*1024*1024)
	}
}

func TestParseStartFileMaxSizeRejectsInvalidEnv(t *testing.T) {
	t.Setenv(config.MusicFileMaxSizeEnvVar, "invalid")

	if _, err := parseStartFileMaxSize(
		"music file max size",
		"",
		config.MusicFileMaxSizeEnvVar,
		config.DefaultMusicFileMaxSize,
	); err == nil {
		t.Fatalf("expected error")
	}
}
