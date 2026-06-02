package handler

import (
	"cicada/internal/config"
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
	gin.SetMode(gin.TestMode)

	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
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
	_, cachePath := config.ThumbnailCachePath(32, "cover.jpg")
	if _, err := os.Stat(cachePath); err != nil {
		t.Fatalf("expected thumbnail cache file at %s: %v", cachePath, err)
	}
	if _, err := os.Stat(filepath.Join(config.ThumbnailCacheDir(), "32_cover.jpg")); !os.IsNotExist(err) {
		t.Fatalf("expected no flat thumbnail cache file in thumbnail root, got err=%v", err)
	}
	if _, err := os.Stat(filepath.Join(config.CacheDir(), "32_cover.jpg")); !os.IsNotExist(err) {
		t.Fatalf("expected no thumbnail cache file in cache root, got err=%v", err)
	}
}

func TestServeAssetRefreshesThumbnailCacheModTimeOnAccess(t *testing.T) {
	gin.SetMode(gin.TestMode)

	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
	})

	if err := os.MkdirAll(config.AssetDir(config.AssetTypeMusicCover), 0755); err != nil {
		t.Fatalf("mkdir asset dir: %v", err)
	}
	assetPath := filepath.Join(config.AssetDir(config.AssetTypeMusicCover), "cover.jpg")
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

	if err := os.MkdirAll(config.AssetDir(config.AssetTypeMusic), 0755); err != nil {
		t.Fatalf("mkdir music asset dir: %v", err)
	}
	if err := os.WriteFile(filepath.Join(config.AssetDir(config.AssetTypeMusic), "song.flac"), []byte("not used"), 0644); err != nil {
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

	if err := os.MkdirAll(config.AssetDir(config.AssetTypeMusic), 0755); err != nil {
		t.Fatalf("mkdir music asset dir: %v", err)
	}
	if err := os.WriteFile(filepath.Join(config.AssetDir(config.AssetTypeMusic), "song.mp3"), []byte("source"), 0644); err != nil {
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
