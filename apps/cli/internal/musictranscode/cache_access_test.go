package musictranscode

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"testing"
	"time"

	"cicada/internal/config"
	"cicada/internal/ffmpeg"
)

func setupCacheTest(t *testing.T) {
	t.Helper()
	original := config.Get()
	t.Cleanup(func() { config.Set(original) })
	config.Set(config.Config{Data: t.TempDir(), Scratch: t.TempDir()})
}

func seedCache(t *testing.T, asset string, quality Quality, modified time.Time) string {
	t.Helper()
	writeMusicSource(t, asset, "source")
	path := CachePath(asset, quality)
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte("audio"), 0644); err != nil {
		t.Fatal(err)
	}
	if quality == QualitySource {
		if err := os.WriteFile(path+".json", []byte(`{"contentType":"audio/mpeg"}`), 0644); err != nil {
			t.Fatal(err)
		}
	}
	setCacheTime(t, path, modified)
	return path
}

func setCacheTime(t *testing.T, path string, modified time.Time) {
	t.Helper()
	if err := os.Chtimes(path, modified, modified); err != nil {
		t.Fatal(err)
	}
}

func fileTime(t *testing.T, path string) time.Time {
	t.Helper()
	info, err := os.Stat(path)
	if err != nil {
		t.Fatal(err)
	}
	return info.ModTime()
}

func TestPlaybackRenewsOnlyRequestedQualityAndBackgroundDoesNotRenew(t *testing.T) {
	setupCacheTest(t)
	old := time.Now().Add(-61 * 24 * time.Hour).Truncate(time.Second)
	smooth := seedCache(t, "song.mp3", QualitySmooth, old)
	source := seedCache(t, "song.mp3", QualitySource, old)
	for _, quality := range []Quality{QualitySmooth, QualitySource} {
		if _, err := EnsureBackground(context.Background(), "song.mp3", quality); err != nil {
			t.Fatal(err)
		}
	}
	if !fileTime(t, smooth).Equal(old) || !fileTime(t, source).Equal(old) {
		t.Fatal("background scan renewed cache")
	}
	for range 2 {
		setCacheTime(t, smooth, old)
		before := time.Now().Add(-time.Second)
		playback, err := OpenForPlayback(context.Background(), "song.mp3", QualitySmooth)
		if err != nil {
			t.Fatal(err)
		}
		if err := playback.Close(); err != nil {
			t.Fatal(err)
		}
		if fileTime(t, smooth).Before(before) {
			t.Fatal("cache hit did not renew mtime")
		}
		if !fileTime(t, source).Equal(old) {
			t.Fatal("smooth access renewed source quality")
		}
	}
	metrics, err := CleanCache(true, time.Now())
	if err != nil {
		t.Fatal(err)
	}
	if metrics["removed_expired_music_transcode_cache_entries"] != 2 {
		t.Fatalf("metrics = %v", metrics)
	}
	if _, err := os.Stat(smooth); err != nil {
		t.Fatal(err)
	}
}

func TestCopiedSourceIsIndependentAndAgeStartsAtCompletion(t *testing.T) {
	setupCacheTest(t)
	restore := stubFFmpeg(t)
	defer restore()
	probeAudioStream = func(context.Context, string) (ffmpeg.AudioStreamInfo, error) {
		return ffmpeg.AudioStreamInfo{CodecName: "mp3", BitRate: 128000}, nil
	}
	source := writeMusicSource(t, "song.mp3", "source")
	old := time.Now().Add(-100 * 24 * time.Hour).Truncate(time.Second)
	setCacheTime(t, source, old)
	before := time.Now().Add(-time.Second)
	result, err := EnsureBackground(context.Background(), "song.mp3", QualitySource)
	if err != nil {
		t.Fatal(err)
	}
	sourceInfo, _ := os.Stat(source)
	cacheInfo, _ := os.Stat(result.Path)
	if os.SameFile(sourceInfo, cacheInfo) {
		t.Fatal("cache is still a hard link")
	}
	if cacheInfo.ModTime().Before(before) {
		t.Fatal("copy inherited original age")
	}
	playback, err := OpenForPlayback(context.Background(), "song.mp3", QualitySource)
	if err != nil {
		t.Fatal(err)
	}
	if !playback.ModTime.Equal(old) {
		t.Fatalf("HTTP time = %v", playback.ModTime)
	}
	playback.Close()
	if !fileTime(t, source).Equal(old) {
		t.Fatal("access changed source time")
	}
}

func TestTouchFailurePreservesPlaybackAndPreventsExpiryUntilSuccess(t *testing.T) {
	setupCacheTest(t)
	old := time.Now().Add(-61 * 24 * time.Hour).Truncate(time.Second)
	path := seedCache(t, "song.mp3", QualitySmooth, old)
	original := cacheChtimes
	t.Cleanup(func() { cacheChtimes = original })
	cacheChtimes = func(string, time.Time, time.Time) error { return errors.New("read-only metadata") }
	p, err := OpenForPlayback(context.Background(), "song.mp3", QualitySmooth)
	if err != nil {
		t.Fatal(err)
	}
	p.Close()
	metrics, err := CleanCache(true, time.Now())
	if err != nil {
		t.Fatal(err)
	}
	if metrics["skipped_untracked_music_transcode_caches"] != 1 {
		t.Fatalf("metrics = %v", metrics)
	}
	if !fileTime(t, path).Equal(old) {
		t.Fatal("fixture unexpectedly touched")
	}
	cacheChtimes = original
	p, err = OpenForPlayback(context.Background(), "song.mp3", QualitySmooth)
	if err != nil {
		t.Fatal(err)
	}
	p.Close()
	cacheStates.Lock()
	_, retained := cacheStates.entries[path]
	cacheStates.Unlock()
	if retained {
		t.Fatal("successful touch retained idle lifecycle state")
	}
	setCacheTime(t, path, old)
	if _, err := CleanCache(true, time.Now()); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(path); !os.IsNotExist(err) {
		t.Fatalf("cache should expire after touch recovery: %v", err)
	}
}
