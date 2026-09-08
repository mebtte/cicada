package handler

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"cicada/internal/config"
)

func TestUploadedMusicProbeUsesScratchAndRemovesTemporaryFile(t *testing.T) {
	originalConfig := config.Get()
	originalProbe := probeUploadedMusicHasAudioStream
	t.Cleanup(func() {
		config.Set(originalConfig)
		probeUploadedMusicHasAudioStream = originalProbe
	})
	for _, probeFails := range []bool{false, true} {
		name := "success"
		if probeFails {
			name = "probe error"
		}
		t.Run(name, func(t *testing.T) {
			data := t.TempDir()
			scratch := filepath.Join(t.TempDir(), "scratch")
			config.Set(config.Config{Data: data, Scratch: scratch})
			probeErr := errors.New("probe failed")
			probePath := ""
			probeUploadedMusicHasAudioStream = func(_ context.Context, path string) (bool, error) {
				probePath = path
				if filepath.Dir(path) != scratch || !strings.HasPrefix(filepath.Base(path), "upload_music_") {
					t.Fatalf("probe temporary path = %q", path)
				}
				if content, err := os.ReadFile(path); err != nil || string(content) != "music" {
					t.Fatalf("probe input = %q, error = %v", content, err)
				}
				if probeFails {
					return false, probeErr
				}
				return true, nil
			}
			ok, err := uploadedMusicHasAudioStream(context.Background(), []byte("music"), "audio/flac")
			if probeFails {
				if ok || !errors.Is(err, probeErr) {
					t.Fatalf("probe result = %v, %v", ok, err)
				}
			} else if !ok || err != nil {
				t.Fatalf("probe result = %v, %v", ok, err)
			}
			if probePath == "" {
				t.Fatal("probe was not called")
			}
			if _, err := os.Stat(probePath); !os.IsNotExist(err) {
				t.Fatalf("temporary file was not removed: %v", err)
			}
			if _, err := os.Stat(filepath.Join(data, "cache")); !os.IsNotExist(err) {
				t.Fatalf("unexpected legacy cache directory: %v", err)
			}
		})
	}
}
