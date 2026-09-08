package handler

import (
	"cicada/internal/config"
	"cicada/internal/musictranscode"
	"image"
	"image/color"
	"image/jpeg"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strconv"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

func TestServeAssetWritesThumbnailCacheToThumbnailDir(t *testing.T) {
	original := config.Get()
	t.Cleanup(func() { config.Set(original) })
	scratch := t.TempDir()
	gin.SetMode(gin.TestMode)

	config.Set(config.Config{
		Mode:    config.ModeProduction,
		Data:    t.TempDir(),
		Scratch: scratch,
		Port:    8000,
	})

	assetDir, assetPath := config.AssetPath(config.AssetTypeMusicCover, "cover.jpg")
	if err := os.MkdirAll(assetDir, 0755); err != nil {
		t.Fatalf("mkdir asset dir: %v", err)
	}
	writeTestJPEG(t, assetPath)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "filename", Value: "cover.jpg"}}
	c.Request = httptest.NewRequest(http.MethodGet, "/asset/music_cover/cover.jpg?size=32", nil)

	ServeAsset(config.AssetTypeMusicCover)(c)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}
	cachePath := filepath.Join(scratch, "thumbnails", "co", "cover_32.jpg")
	if _, err := os.Stat(cachePath); err != nil {
		t.Fatalf("expected thumbnail cache file at %s: %v", cachePath, err)
	}
	if _, err := os.Stat(filepath.Join(config.ThumbnailCacheDir(), "32_cover.jpg")); !os.IsNotExist(err) {
		t.Fatalf("expected no flat thumbnail cache file in thumbnail root, got err=%v", err)
	}
	if _, err := os.Stat(filepath.Join(config.Get().Data, "cache")); !os.IsNotExist(err) {
		t.Fatalf("expected no legacy cache directory, got err=%v", err)
	}
}

func TestServeAssetRefreshesThumbnailCacheModTimeOnAccess(t *testing.T) {
	gin.SetMode(gin.TestMode)

	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
	})

	assetDir, assetPath := config.AssetPath(config.AssetTypeMusicCover, "cover.jpg")
	if err := os.MkdirAll(assetDir, 0755); err != nil {
		t.Fatalf("mkdir asset dir: %v", err)
	}
	writeTestJPEG(t, assetPath)

	requestThumbnail(t, "cover.jpg", 32)
	_, cachePath := config.ThumbnailCachePath(32, "cover.jpg")
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
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
	})

	dir, path := config.AssetPath(config.AssetTypeMusic, "song.flac")
	if err := os.MkdirAll(dir, 0755); err != nil {
		t.Fatalf("mkdir music asset dir: %v", err)
	}
	if err := os.WriteFile(path, []byte("not used"), 0644); err != nil {
		t.Fatalf("write music asset: %v", err)
	}

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "filename", Value: "song.flac"}}
	c.Request = httptest.NewRequest(http.MethodGet, "/asset/music/song.flac?quality=unknown", nil)

	ServeAsset(config.AssetTypeMusic)(c)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", w.Code)
	}
}

func TestServeMusicAssetIgnoresUnknownQueryParameters(t *testing.T) {
	gin.SetMode(gin.TestMode)

	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
	})

	dir, path := config.AssetPath(config.AssetTypeMusic, "song.mp3")
	if err := os.MkdirAll(dir, 0755); err != nil {
		t.Fatalf("mkdir music asset dir: %v", err)
	}
	if err := os.WriteFile(path, []byte("source"), 0644); err != nil {
		t.Fatalf("write music asset: %v", err)
	}

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "filename", Value: "song.mp3"}}
	c.Request = httptest.NewRequest(http.MethodGet, "/asset/music/song.mp3?codec=aac&bitrate=192", nil)

	ServeAsset(config.AssetTypeMusic)(c)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}
	if w.Body.String() != "source" {
		t.Fatalf("unexpected body %q", w.Body.String())
	}
}

func TestServeMusicAssetWithoutTranscodeQueryReturnsSource(t *testing.T) {
	gin.SetMode(gin.TestMode)

	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
	})

	dir, path := config.AssetPath(config.AssetTypeMusic, "song.flac")
	if err := os.MkdirAll(dir, 0755); err != nil {
		t.Fatalf("mkdir music asset dir: %v", err)
	}
	if err := os.WriteFile(path, []byte("source"), 0644); err != nil {
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

func TestServeMusicCachedRangeUsesExternalScratch(t *testing.T) {
	original := config.Get()
	t.Cleanup(func() { config.Set(original) })
	scratch := t.TempDir()
	config.Set(config.Config{Mode: config.ModeProduction, Data: t.TempDir(), Scratch: scratch})
	gin.SetMode(gin.TestMode)
	for _, quality := range []musictranscode.Quality{musictranscode.QualitySmooth, musictranscode.QualitySource} {
		t.Run(string(quality), func(t *testing.T) {
			// Seed the documented layout independently of config path helpers.
			shard := filepath.Join(scratch, "music_transcoded", "so")
			if err := os.MkdirAll(shard, 0755); err != nil {
				t.Fatal(err)
			}
			path := filepath.Join(shard, musictranscode.CacheName("song.mp3", quality))
			if err := os.WriteFile(path, []byte("0123456789"), 0644); err != nil {
				t.Fatal(err)
			}
			if quality == musictranscode.QualitySource {
				if err := os.WriteFile(filepath.Join(shard, musictranscode.SourceCacheMetadataName("song.mp3")), []byte(`{"contentType":"audio/mpeg"}`), 0644); err != nil {
					t.Fatal(err)
				}
			}
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Params = gin.Params{{Key: "filename", Value: "song.mp3"}}
			c.Request = httptest.NewRequest(http.MethodGet, "/asset/music/song.mp3?quality="+string(quality), nil)
			c.Request.Header.Set("Range", "bytes=2-5")
			ServeAsset(config.AssetTypeMusic)(c)
			if w.Code != http.StatusPartialContent || w.Body.String() != "2345" {
				t.Fatalf("range response = %d %q", w.Code, w.Body.String())
			}
			if got := w.Header().Get("Content-Range"); got != "bytes 2-5/10" {
				t.Fatalf("content range = %q", got)
			}
		})
	}
	if _, err := os.Stat(filepath.Join(config.Get().Data, "cache")); !os.IsNotExist(err) {
		t.Fatalf("unexpected legacy cache: %v", err)
	}
}
