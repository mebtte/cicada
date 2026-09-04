package musictranscode

import (
	"context"
	"os"
	"path/filepath"
	"sync"
	"testing"
	"time"

	"cicada/internal/ffmpeg"
)

func TestCleanupIdleBoundaryAndEagerRetention(t *testing.T) {
	for _, expire := range []bool{false, true} {
		name := "eager"
		if expire {
			name = "lazy"
		}
		t.Run(name, func(t *testing.T) {
			setupCacheTest(t)
			now := time.Now().Truncate(time.Second)
			for _, test := range []struct {
				name    string
				age     time.Duration
				expired bool
			}{
				{"fresh.mp3", CacheIdleTTL - time.Second, false},
				{"boundary.mp3", CacheIdleTTL, false},
				{"expired.mp3", CacheIdleTTL + time.Second, true},
			} {
				for _, quality := range []Quality{QualitySmooth, QualitySource} {
					path := seedCache(t, test.name, quality, now.Add(-test.age))
					metrics, err := CleanCache(expire, now)
					if err != nil {
						t.Fatal(err)
					}
					_, err = os.Stat(path)
					if expire && test.expired {
						if !os.IsNotExist(err) {
							t.Fatalf("expected expiry: %s, %v", path, err)
						}
						if metrics["removed_expired_music_transcode_cache_entries"] == 0 {
							t.Fatalf("metrics = %v", metrics)
						}
						if _, err := os.Stat(path + ".json"); !os.IsNotExist(err) {
							t.Fatalf("metadata survived: %v", err)
						}
					} else if err != nil {
						t.Fatalf("retained cache %s: %v", path, err)
					}
				}
			}
		})
	}
}

func TestCleanupSkipsPlaybackLeaseAndRechecksRenewedTime(t *testing.T) {
	setupCacheTest(t)
	now := time.Now().Truncate(time.Second)
	old := now.Add(-CacheIdleTTL - time.Hour)
	path := seedCache(t, "song.mp3", QualitySource, old)
	p, err := OpenForPlayback(context.Background(), "song.mp3", QualitySource)
	if err != nil {
		t.Fatal(err)
	}
	defer p.Close()
	// Force an old timestamp while the response is open to prove the lease,
	// independently of renewal, protects the audio and its metadata.
	setCacheTime(t, path, old)
	metrics, err := CleanCache(true, now)
	if err != nil {
		t.Fatal(err)
	}
	if metrics["skipped_active_music_transcode_caches"] != 1 {
		t.Fatalf("metrics = %v", metrics)
	}
	if _, err := os.Stat(path + ".json"); err != nil {
		t.Fatal(err)
	}
	if err := touchCache(path); err != nil {
		t.Fatal(err)
	}
	p.Close()
	if _, err := CleanCache(true, now); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(path); err != nil {
		t.Fatal("cleanup ignored renewed time:", err)
	}
	setCacheTime(t, path, old)
	if _, err := CleanCache(true, now); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(path); !os.IsNotExist(err) {
		t.Fatal("cache did not expire after response closed")
	}
}

func TestCleanupProtectsTranscodeTemporaryOutput(t *testing.T) {
	setupCacheTest(t)
	restore := stubFFmpeg(t)
	defer restore()
	writeMusicSource(t, "song.flac", "source")
	probeAudioStream = func(context.Context, string) (ffmpeg.AudioStreamInfo, error) {
		return ffmpeg.AudioStreamInfo{CodecName: "flac", BitRate: 256000}, nil
	}
	started := make(chan string, 1)
	finish := make(chan struct{})
	var once sync.Once
	defer once.Do(func() { close(finish) })
	transcodeAudio = func(ctx context.Context, input, output string, profile ffmpeg.AudioTranscodeProfile) error {
		if err := os.WriteFile(output, []byte("partial"), 0644); err != nil {
			return err
		}
		started <- output
		<-finish
		return os.WriteFile(output, []byte("complete"), 0644)
	}
	done := make(chan error, 1)
	go func() { _, err := EnsureBackground(context.Background(), "song.flac", QualitySmooth); done <- err }()
	var temp string
	select {
	case temp = <-started:
	case <-time.After(5 * time.Second):
		t.Fatal("transcode did not start")
	}
	metrics, err := CleanCache(true, time.Now())
	if err != nil {
		t.Fatal(err)
	}
	if metrics["skipped_active_music_transcode_caches"] != 1 {
		t.Fatalf("metrics = %v", metrics)
	}
	if _, err := os.Stat(temp); err != nil {
		t.Fatal("active temporary file removed:", err)
	}
	once.Do(func() { close(finish) })
	if err := <-done; err != nil {
		t.Fatal(err)
	}
	// The same filename is removable when it is an abandoned temp.
	if err := os.WriteFile(temp, []byte("abandoned"), 0644); err != nil {
		t.Fatal(err)
	}
	if _, err := CleanCache(false, time.Now()); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(temp); !os.IsNotExist(err) {
		t.Fatalf("abandoned temp remains: %v", err)
	}
	if _, err := os.Stat(filepath.Dir(temp)); err != nil {
		t.Fatal(err)
	}
}
