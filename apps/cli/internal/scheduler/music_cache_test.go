package scheduler

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	"cicada/internal/config"
	"cicada/internal/musictranscode"
)

func TestMusicCleanupUsesConfiguredMode(t *testing.T) {
	previous := config.Get()
	t.Cleanup(func() { config.Set(previous) })
	for _, mode := range []config.MusicTranscodeMode{config.MusicTranscodeEager, config.MusicTranscodeLazy} {
		t.Run(string(mode), func(t *testing.T) {
			config.Set(config.Config{Data: t.TempDir(), Scratch: t.TempDir(), MusicTranscode: mode})
			writeMusicAssetForCleanTest(t, "song.mp3")
			path := musictranscode.CachePath("song.mp3", musictranscode.QualitySmooth)
			if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
				t.Fatal(err)
			}
			if err := os.WriteFile(path, []byte("cache"), 0644); err != nil {
				t.Fatal(err)
			}
			old := time.Now().Add(-musictranscode.CacheIdleTTL - time.Hour)
			if err := os.Chtimes(path, old, old); err != nil {
				t.Fatal(err)
			}
			result, err := cleanMusicTranscodeCache()
			if err != nil {
				t.Fatal(err)
			}
			_, err = os.Stat(path)
			if mode == config.MusicTranscodeLazy {
				if !os.IsNotExist(err) || result.Metrics["removed_expired_music_transcode_cache_entries"] != 1 {
					t.Fatalf("lazy result = %+v, stat = %v", result, err)
				}
			} else if err != nil {
				t.Fatalf("eager removed valid cache: %v", err)
			}
		})
	}
}
