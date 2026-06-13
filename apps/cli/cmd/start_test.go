package cmd

import (
	"cicada/internal/config"
	"testing"
)

func TestParseStartFileMaxSizeUsesFlagBeforeEnv(t *testing.T) {
	t.Setenv(config.AudioFileMaxSizeEnvVar, "300mb")

	got, err := parseStartFileMaxSize(
		"audio file max size",
		"250mb",
		config.AudioFileMaxSizeEnvVar,
		config.DefaultAudioFileMaxSize,
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

func TestParseStartFileMaxSizeUsesVideoEnv(t *testing.T) {
	t.Setenv(config.VideoFileMaxSizeEnvVar, "2gb")

	got, err := parseStartFileMaxSize(
		"video file max size",
		"",
		config.VideoFileMaxSizeEnvVar,
		config.DefaultVideoFileMaxSize,
	)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	if got != 2*1024*1024*1024 {
		t.Fatalf("size = %d, want %d", got, 2*1024*1024*1024)
	}
}

func TestParseStartFileMaxSizeRejectsInvalidEnv(t *testing.T) {
	t.Setenv(config.AudioFileMaxSizeEnvVar, "invalid")

	if _, err := parseStartFileMaxSize(
		"audio file max size",
		"",
		config.AudioFileMaxSizeEnvVar,
		config.DefaultAudioFileMaxSize,
	); err == nil {
		t.Fatalf("expected error")
	}
}
