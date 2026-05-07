package handler

import (
	"cicada/internal/config"
	"cicada/internal/ffmpeg"
	"context"
	"image"
	"image/color"
	"image/jpeg"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

func TestServeAssetWritesThumbnailCacheToThumbnailDir(t *testing.T) {
	gin.SetMode(gin.TestMode)

	config.Set(config.Config{
		Mode:      config.ModeProduction,
		Data:      t.TempDir(),
		Port:      8000,
		JWTExpiry: int64(180 * 24 * 60 * 60 * 1000),
	})

	if err := os.MkdirAll(config.AssetDir(config.AssetTypeMusicCover), 0755); err != nil {
		t.Fatalf("mkdir asset dir: %v", err)
	}
	assetPath := filepath.Join(config.AssetDir(config.AssetTypeMusicCover), "cover.jpg")
	writeTestJPEG(t, assetPath)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "filename", Value: "cover.jpg"}}
	c.Request = httptest.NewRequest(http.MethodGet, "/asset/music_cover/cover.jpg?size=32", nil)

	ServeAsset(config.AssetTypeMusicCover)(c)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}
	if _, err := os.Stat(filepath.Join(config.ThumbnailCacheDir(), "32_cover.jpg")); err != nil {
		t.Fatalf("expected thumbnail cache file: %v", err)
	}
	if _, err := os.Stat(filepath.Join(config.CacheDir(), "32_cover.jpg")); !os.IsNotExist(err) {
		t.Fatalf("expected no thumbnail cache file in cache root, got err=%v", err)
	}
}

func TestServeAssetRefreshesThumbnailCacheModTimeOnAccess(t *testing.T) {
	gin.SetMode(gin.TestMode)

	config.Set(config.Config{
		Mode:      config.ModeProduction,
		Data:      t.TempDir(),
		Port:      8000,
		JWTExpiry: int64(180 * 24 * 60 * 60 * 1000),
	})

	if err := os.MkdirAll(config.AssetDir(config.AssetTypeMusicCover), 0755); err != nil {
		t.Fatalf("mkdir asset dir: %v", err)
	}
	assetPath := filepath.Join(config.AssetDir(config.AssetTypeMusicCover), "cover.jpg")
	writeTestJPEG(t, assetPath)

	requestThumbnail(t, "cover.jpg", 32)
	cachePath := filepath.Join(config.ThumbnailCacheDir(), "32_cover.jpg")
	oldTime := time.Now().Add(-31 * 24 * time.Hour)
	if err := os.Chtimes(cachePath, oldTime, oldTime); err != nil {
		t.Fatalf("chtimes thumbnail cache: %v", err)
	}

	requestThumbnail(t, "cover.jpg", 32)

	info, err := os.Stat(cachePath)
	if err != nil {
		t.Fatalf("stat thumbnail cache: %v", err)
	}
	if !info.ModTime().After(oldTime) {
		t.Fatalf("expected thumbnail cache mod time to be refreshed, got %s", info.ModTime())
	}
}

func TestServeMusicAssetRejectsInvalidTranscodeQuery(t *testing.T) {
	gin.SetMode(gin.TestMode)

	config.Set(config.Config{
		Mode:      config.ModeProduction,
		Data:      t.TempDir(),
		Port:      8000,
		JWTExpiry: int64(180 * 24 * 60 * 60 * 1000),
	})

	if err := os.MkdirAll(config.AssetDir(config.AssetTypeMusic), 0755); err != nil {
		t.Fatalf("mkdir music asset dir: %v", err)
	}
	if err := os.WriteFile(filepath.Join(config.AssetDir(config.AssetTypeMusic), "song.flac"), []byte("not used"), 0644); err != nil {
		t.Fatalf("write music asset: %v", err)
	}

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "filename", Value: "song.flac"}}
	c.Request = httptest.NewRequest(http.MethodGet, "/asset/music/song.flac?codec=aac", nil)

	ServeAsset(config.AssetTypeMusic)(c)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", w.Code)
	}
}

func TestServeMusicAssetWithoutTranscodeQueryReturnsSource(t *testing.T) {
	gin.SetMode(gin.TestMode)

	config.Set(config.Config{
		Mode:      config.ModeProduction,
		Data:      t.TempDir(),
		Port:      8000,
		JWTExpiry: int64(180 * 24 * 60 * 60 * 1000),
	})

	if err := os.MkdirAll(config.AssetDir(config.AssetTypeMusic), 0755); err != nil {
		t.Fatalf("mkdir music asset dir: %v", err)
	}
	if err := os.WriteFile(filepath.Join(config.AssetDir(config.AssetTypeMusic), "song.flac"), []byte("source"), 0644); err != nil {
		t.Fatalf("write music asset: %v", err)
	}

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "filename", Value: "song.flac"}}
	c.Request = httptest.NewRequest(http.MethodGet, "/asset/music/song.flac", nil)

	ServeAsset(config.AssetTypeMusic)(c)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}
	if w.Body.String() != "source" {
		t.Fatalf("unexpected body %q", w.Body.String())
	}
}

func TestParseMusicTranscodeProfile(t *testing.T) {
	tests := []struct {
		name         string
		query        url.Values
		transcode    bool
		valid        bool
		cacheSuffix  string
		contentType  string
		losslessOnly bool
	}{
		{
			name:        "aac 192",
			query:       url.Values{"codec": {"aac"}, "bitrate": {"192"}},
			transcode:   true,
			valid:       true,
			cacheSuffix: "codec-aac_bitrate-192k.m4a",
			contentType: "audio/mp4",
		},
		{
			name:         "flac",
			query:        url.Values{"codec": {"flac"}},
			transcode:    true,
			valid:        true,
			cacheSuffix:  "codec-flac.flac",
			contentType:  "audio/flac",
			losslessOnly: true,
		},
		{
			name:  "source",
			query: url.Values{},
			valid: true,
		},
		{
			name:  "missing aac bitrate",
			query: url.Values{"codec": {"aac"}},
		},
		{
			name:  "flac with bitrate",
			query: url.Values{"codec": {"flac"}, "bitrate": {"192"}},
		},
		{
			name:  "unknown codec",
			query: url.Values{"codec": {"mp3"}, "bitrate": {"192"}},
		},
		{
			name:  "unknown parameter",
			query: url.Values{"codec": {"aac"}, "bitrate": {"192"}, "x": {"1"}},
		},
		{
			name:  "old aac 320",
			query: url.Values{"codec": {"aac"}, "bitrate": {"320"}},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			profile, transcode, valid := parseMusicTranscodeProfile(tt.query)
			if transcode != tt.transcode || valid != tt.valid {
				t.Fatalf("transcode, valid = %v, %v", transcode, valid)
			}
			if tt.cacheSuffix != "" && profile.CacheSuffix != tt.cacheSuffix {
				t.Fatalf("cache suffix = %q", profile.CacheSuffix)
			}
			if tt.contentType != "" && profile.ContentType != tt.contentType {
				t.Fatalf("content type = %q", profile.ContentType)
			}
			if profile.LosslessSourceOnly != tt.losslessOnly {
				t.Fatalf("lossless source only = %v", profile.LosslessSourceOnly)
			}
		})
	}
}

func TestApplyMusicTranscodeSourceLimitsCapsAACBitrate(t *testing.T) {
	profile := newAACMusicTranscodeProfile(192)
	profile = applyMusicTranscodeSourceLimits(profile, ffmpeg.AudioStreamInfo{BitRate: 128000})

	if profile.FFmpegProfile.Bitrate != "128k" {
		t.Fatalf("bitrate = %q", profile.FFmpegProfile.Bitrate)
	}
	if profile.CacheSuffix != "codec-aac_bitrate-192k.m4a" {
		t.Fatalf("cache suffix = %q", profile.CacheSuffix)
	}
}

func TestApplyMusicTranscodeSourceLimitsKeepsTargetWhenSourceBitrateIsHigherOrUnknown(t *testing.T) {
	for _, bitRate := range []int64{0, 256000} {
		t.Run(strconv.FormatInt(bitRate, 10), func(t *testing.T) {
			profile := newAACMusicTranscodeProfile(192)
			profile = applyMusicTranscodeSourceLimits(profile, ffmpeg.AudioStreamInfo{BitRate: bitRate})

			if profile.FFmpegProfile.Bitrate != "192k" {
				t.Fatalf("bitrate = %q", profile.FFmpegProfile.Bitrate)
			}
			if profile.CacheSuffix != "codec-aac_bitrate-192k.m4a" {
				t.Fatalf("cache suffix = %q", profile.CacheSuffix)
			}
		})
	}
}

func TestEnsureMusicTranscodeCacheSharesConcurrentTranscode(t *testing.T) {
	config.Set(config.Config{
		Mode:      config.ModeProduction,
		Data:      t.TempDir(),
		Port:      8000,
		JWTExpiry: int64(180 * 24 * 60 * 60 * 1000),
	})

	sourcePath := filepath.Join(config.AssetDir(config.AssetTypeMusic), "song.flac")
	if err := os.MkdirAll(filepath.Dir(sourcePath), 0755); err != nil {
		t.Fatalf("mkdir source dir: %v", err)
	}
	if err := os.WriteFile(sourcePath, []byte("source"), 0644); err != nil {
		t.Fatalf("write source: %v", err)
	}
	sourceInfo, err := os.Stat(sourcePath)
	if err != nil {
		t.Fatalf("stat source: %v", err)
	}

	originalTranscodeAudio := musicTranscodeAudio
	originalProbeAudioStream := musicProbeAudioStream
	t.Cleanup(func() {
		musicTranscodeAudio = originalTranscodeAudio
		musicProbeAudioStream = originalProbeAudioStream
	})

	var calls atomic.Int32
	var once sync.Once
	started := make(chan struct{})
	release := make(chan struct{})
	musicProbeAudioStream = func(ctx context.Context, path string) (ffmpeg.AudioStreamInfo, error) {
		return ffmpeg.AudioStreamInfo{BitRate: 256000}, nil
	}
	musicTranscodeAudio = func(ctx context.Context, inputPath, outputPath string, profile ffmpeg.AudioTranscodeProfile) error {
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

	cachePath := filepath.Join(config.MusicTranscodeCacheDir(), "song.flac_codec-aac_bitrate-192k.m4a")
	profile := newAACMusicTranscodeProfile(192)
	const requestCount = 5
	errCh := make(chan error, requestCount)

	go func() {
		_, err := ensureMusicTranscodeCache(context.Background(), sourcePath, cachePath, sourceInfo.ModTime(), profile)
		errCh <- err
	}()
	<-started
	for i := 1; i < requestCount; i++ {
		go func() {
			_, err := ensureMusicTranscodeCache(context.Background(), sourcePath, cachePath, sourceInfo.ModTime(), profile)
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
	if content, err := os.ReadFile(cachePath); err != nil || string(content) != "cache" {
		t.Fatalf("cache content = %q, err=%v", string(content), err)
	}
}

func TestEnsureMusicTranscodeCacheDoesNotProbeFreshCache(t *testing.T) {
	config.Set(config.Config{
		Mode:      config.ModeProduction,
		Data:      t.TempDir(),
		Port:      8000,
		JWTExpiry: int64(180 * 24 * 60 * 60 * 1000),
	})

	sourcePath := filepath.Join(config.AssetDir(config.AssetTypeMusic), "song.flac")
	if err := os.MkdirAll(filepath.Dir(sourcePath), 0755); err != nil {
		t.Fatalf("mkdir source dir: %v", err)
	}
	if err := os.WriteFile(sourcePath, []byte("source"), 0644); err != nil {
		t.Fatalf("write source: %v", err)
	}
	sourceInfo, err := os.Stat(sourcePath)
	if err != nil {
		t.Fatalf("stat source: %v", err)
	}

	cachePath := filepath.Join(config.MusicTranscodeCacheDir(), "song.flac_codec-aac_bitrate-192k.m4a")
	if err := os.MkdirAll(filepath.Dir(cachePath), 0755); err != nil {
		t.Fatalf("mkdir cache dir: %v", err)
	}
	if err := os.WriteFile(cachePath, []byte("cache"), 0644); err != nil {
		t.Fatalf("write cache: %v", err)
	}
	freshTime := sourceInfo.ModTime().Add(time.Second)
	if err := os.Chtimes(cachePath, freshTime, freshTime); err != nil {
		t.Fatalf("chtimes cache: %v", err)
	}

	originalProbeAudioStream := musicProbeAudioStream
	t.Cleanup(func() {
		musicProbeAudioStream = originalProbeAudioStream
	})

	var probeCalls atomic.Int32
	musicProbeAudioStream = func(ctx context.Context, path string) (ffmpeg.AudioStreamInfo, error) {
		probeCalls.Add(1)
		return ffmpeg.AudioStreamInfo{BitRate: 128000}, nil
	}

	serveSource, err := ensureMusicTranscodeCache(
		context.Background(),
		sourcePath,
		cachePath,
		sourceInfo.ModTime(),
		newAACMusicTranscodeProfile(192),
	)
	if err != nil {
		t.Fatalf("ensure transcode cache: %v", err)
	}
	if serveSource {
		t.Fatalf("expected cache to be served")
	}
	if probeCalls.Load() != 0 {
		t.Fatalf("probe calls = %d", probeCalls.Load())
	}
}

func requestThumbnail(t *testing.T, filename string, size int) {
	t.Helper()

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "filename", Value: filename}}
	c.Request = httptest.NewRequest(
		http.MethodGet,
		"/asset/music_cover/"+filename+"?size="+strconv.Itoa(size),
		nil,
	)

	ServeAsset(config.AssetTypeMusicCover)(c)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}
}

func writeTestJPEG(t *testing.T, path string) {
	t.Helper()

	img := image.NewRGBA(image.Rect(0, 0, 64, 64))
	for y := 0; y < 64; y++ {
		for x := 0; x < 64; x++ {
			img.Set(x, y, color.RGBA{R: uint8(x * 4), G: uint8(y * 4), B: 120, A: 255})
		}
	}

	f, err := os.Create(path)
	if err != nil {
		t.Fatalf("create jpeg: %v", err)
	}
	defer f.Close()
	if err := jpeg.Encode(f, img, &jpeg.Options{Quality: 90}); err != nil {
		t.Fatalf("encode jpeg: %v", err)
	}
}
