package musictranscode

import (
	"context"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"sync"
	"sync/atomic"
	"testing"

	"cicada/internal/config"
	"cicada/internal/ffmpeg"
)

func TestParseQualityOnlyReadsQualityParameter(t *testing.T) {
	tests := []struct {
		name      string
		query     url.Values
		quality   Quality
		transcode bool
		valid     bool
	}{
		{
			name:  "source file with no quality",
			query: url.Values{},
			valid: true,
		},
		{
			name:  "unknown params ignored",
			query: url.Values{"codec": {"aac"}, "bitrate": {"192"}},
			valid: true,
		},
		{
			name:      "smooth with ignored params",
			query:     url.Values{"quality": {"smooth"}, "codec": {"aac"}},
			quality:   QualitySmooth,
			transcode: true,
			valid:     true,
		},
		{
			name:      "source",
			query:     url.Values{"quality": {"source"}},
			quality:   QualitySource,
			transcode: true,
			valid:     true,
		},
		{
			name:      "unknown quality",
			query:     url.Values{"quality": {"flac"}},
			transcode: true,
		},
		{
			name:      "repeated quality",
			query:     url.Values{"quality": {"smooth", "source"}},
			transcode: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			quality, transcode, valid := ParseQuality(tt.query)
			if quality != tt.quality || transcode != tt.transcode || valid != tt.valid {
				t.Fatalf("quality, transcode, valid = %q, %v, %v", quality, transcode, valid)
			}
		})
	}
}

func TestSmoothBitrateCapsLossySourceBitrate(t *testing.T) {
	if bitrate := smoothBitrate(ffmpeg.AudioStreamInfo{BitRate: 128000}); bitrate != "128k" {
		t.Fatalf("bitrate = %q", bitrate)
	}

	for _, bitRate := range []int64{0, 256000} {
		t.Run(strconv.FormatInt(bitRate, 10), func(t *testing.T) {
			if bitrate := smoothBitrate(ffmpeg.AudioStreamInfo{BitRate: bitRate}); bitrate != "192k" {
				t.Fatalf("bitrate = %q", bitrate)
			}
		})
	}
}

func TestEnsureSharesConcurrentSmoothTranscode(t *testing.T) {
	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
	})
	sourcePath := writeMusicSource(t, "song.flac", "source")

	restore := stubFFmpeg(t)
	defer restore()

	var calls atomic.Int32
	var once sync.Once
	started := make(chan struct{})
	release := make(chan struct{})
	probeAudioStream = func(ctx context.Context, path string) (ffmpeg.AudioStreamInfo, error) {
		return ffmpeg.AudioStreamInfo{CodecName: "flac", BitRate: 256000}, nil
	}
	transcodeAudio = func(ctx context.Context, inputPath, outputPath string, profile ffmpeg.AudioTranscodeProfile) error {
		if inputPath != sourcePath {
			return fmt.Errorf("input path = %q", inputPath)
		}
		calls.Add(1)
		once.Do(func() {
			close(started)
		})
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-release:
		}
		return os.WriteFile(outputPath, []byte("cache"), 0644)
	}

	const requestCount = 5
	errCh := make(chan error, requestCount)
	go func() {
		_, err := Ensure(context.Background(), "song.flac", QualitySmooth)
		errCh <- err
	}()
	<-started
	for i := 1; i < requestCount; i++ {
		go func() {
			_, err := Ensure(context.Background(), "song.flac", QualitySmooth)
			errCh <- err
		}()
	}
	close(release)

	for i := 0; i < requestCount; i++ {
		if err := <-errCh; err != nil {
			t.Fatalf("ensure transcode cache: %v", err)
		}
	}
	if calls.Load() != 1 {
		t.Fatalf("transcode calls = %d", calls.Load())
	}
	cachePath := CachePath("song.flac", QualitySmooth)
	if content, err := os.ReadFile(cachePath); err != nil || string(content) != "cache" {
		t.Fatalf("cache content = %q, err=%v", string(content), err)
	}
}

func TestEnsureDoesNotProbeExistingSmoothCache(t *testing.T) {
	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
	})

	cachePath := CachePath("song.flac", QualitySmooth)
	if err := os.MkdirAll(filepath.Dir(cachePath), 0755); err != nil {
		t.Fatalf("mkdir cache dir: %v", err)
	}
	if err := os.WriteFile(cachePath, []byte("cache"), 0644); err != nil {
		t.Fatalf("write cache: %v", err)
	}

	restore := stubFFmpeg(t)
	defer restore()

	var probeCalls atomic.Int32
	probeAudioStream = func(ctx context.Context, path string) (ffmpeg.AudioStreamInfo, error) {
		probeCalls.Add(1)
		return ffmpeg.AudioStreamInfo{BitRate: 128000}, nil
	}

	result, err := Ensure(context.Background(), "song.flac", QualitySmooth)
	if err != nil {
		t.Fatalf("ensure transcode cache: %v", err)
	}
	if result.Generated {
		t.Fatalf("expected existing cache to be served")
	}
	if probeCalls.Load() != 0 {
		t.Fatalf("probe calls = %d", probeCalls.Load())
	}
}

func TestEnsureSourceCacheRegeneratesWhenMetadataIsMissing(t *testing.T) {
	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
	})
	writeMusicSource(t, "song.mp3", "source")
	cachePath := CachePath("song.mp3", QualitySource)
	if err := os.MkdirAll(filepath.Dir(cachePath), 0755); err != nil {
		t.Fatalf("mkdir cache dir: %v", err)
	}
	if err := os.WriteFile(cachePath, []byte("old cache"), 0644); err != nil {
		t.Fatalf("write old cache: %v", err)
	}

	restore := stubFFmpeg(t)
	defer restore()

	probeAudioStream = func(ctx context.Context, path string) (ffmpeg.AudioStreamInfo, error) {
		return ffmpeg.AudioStreamInfo{CodecName: "mp3", BitRate: 128000}, nil
	}
	transcodeAudio = func(ctx context.Context, inputPath, outputPath string, profile ffmpeg.AudioTranscodeProfile) error {
		return fmt.Errorf("playable lossy source should not be transcoded")
	}

	result, err := Ensure(context.Background(), "song.mp3", QualitySource)
	if err != nil {
		t.Fatalf("ensure source cache: %v", err)
	}
	if !result.Generated {
		t.Fatalf("expected source cache to be regenerated")
	}
	if result.ContentType != "audio/mpeg" {
		t.Fatalf("content type = %q", result.ContentType)
	}
	if content, err := os.ReadFile(cachePath); err != nil || string(content) != "source" {
		t.Fatalf("cache content = %q, err=%v", string(content), err)
	}
	if _, err := ReadSourceCacheMetadata("song.mp3"); err != nil {
		t.Fatalf("read source cache metadata: %v", err)
	}
}

func TestEnsurePassesDefaultThreadsToTranscoder(t *testing.T) {
	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
	})
	writeMusicSource(t, "song.flac", "source")

	restore := stubFFmpeg(t)
	defer restore()

	probeAudioStream = func(ctx context.Context, path string) (ffmpeg.AudioStreamInfo, error) {
		return ffmpeg.AudioStreamInfo{CodecName: "flac", BitRate: 256000}, nil
	}
	var gotThreads int
	transcodeAudio = func(ctx context.Context, inputPath, outputPath string, profile ffmpeg.AudioTranscodeProfile) error {
		gotThreads = profile.Threads
		return os.WriteFile(outputPath, []byte("cache"), 0644)
	}

	if _, err := Ensure(context.Background(), "song.flac", QualitySmooth); err != nil {
		t.Fatalf("ensure: %v", err)
	}
	if gotThreads != 0 {
		t.Fatalf("threads = %d, want 0 (ffmpeg default)", gotThreads)
	}
}

func TestEnsureBackgroundForcesSingleThread(t *testing.T) {
	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
	})
	writeMusicSource(t, "song.flac", "source")

	restore := stubFFmpeg(t)
	defer restore()

	probeAudioStream = func(ctx context.Context, path string) (ffmpeg.AudioStreamInfo, error) {
		return ffmpeg.AudioStreamInfo{CodecName: "flac", BitRate: 256000}, nil
	}
	var gotThreads int
	transcodeAudio = func(ctx context.Context, inputPath, outputPath string, profile ffmpeg.AudioTranscodeProfile) error {
		gotThreads = profile.Threads
		return os.WriteFile(outputPath, []byte("cache"), 0644)
	}

	if _, err := EnsureBackground(context.Background(), "song.flac", QualitySmooth); err != nil {
		t.Fatalf("ensure background: %v", err)
	}
	if gotThreads != 1 {
		t.Fatalf("threads = %d, want 1", gotThreads)
	}
}

func TestBuildSourcePlanRejectsUnsupportedLossySourceWithoutBitrate(t *testing.T) {
	_, err := buildGenerationPlan(
		QualitySource,
		"song.ogg",
		ffmpeg.AudioStreamInfo{CodecName: "vorbis"},
	)
	if err == nil {
		t.Fatalf("expected source plan error")
	}
}

func writeMusicSource(t *testing.T, filename, content string) string {
	t.Helper()

	dir, path := config.AssetPath(config.AssetTypeMusic, filename)
	if err := os.MkdirAll(dir, 0755); err != nil {
		t.Fatalf("mkdir source dir: %v", err)
	}
	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		t.Fatalf("write source: %v", err)
	}
	return path
}

func stubFFmpeg(t *testing.T) func() {
	t.Helper()

	originalProbeAudioStream := probeAudioStream
	originalTranscodeAudio := transcodeAudio
	return func() {
		probeAudioStream = originalProbeAudioStream
		transcodeAudio = originalTranscodeAudio
	}
}
