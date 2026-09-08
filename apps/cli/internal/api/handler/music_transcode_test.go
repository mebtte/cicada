package handler

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"sync"
	"testing"
	"time"

	"cicada/internal/config"
	"cicada/internal/musictranscode"

	"github.com/gin-gonic/gin"
)

type musicPlaybackFixture struct {
	router     *gin.Engine
	asset      string
	sourcePath string
	sourceTime time.Time
	caches     map[musictranscode.Quality]string
}

func newMusicPlaybackFixture(t *testing.T) musicPlaybackFixture {
	t.Helper()
	previous := config.Get()
	t.Cleanup(func() { config.Set(previous) })
	config.Set(config.Config{Data: t.TempDir(), Scratch: t.TempDir(), MusicTranscode: config.MusicTranscodeLazy})
	f := musicPlaybackFixture{
		asset:      "abcdef0123456789.mp3",
		sourceTime: time.Date(2025, time.January, 2, 3, 4, 5, 0, time.UTC),
		caches:     make(map[musictranscode.Quality]string),
	}
	_, f.sourcePath = config.AssetPath(config.AssetTypeMusic, f.asset)
	writeMusicPlaybackFile(t, f.sourcePath, "original audio")
	setMusicPlaybackMtime(t, f.sourcePath, f.sourceTime)
	for _, quality := range []musictranscode.Quality{musictranscode.QualitySmooth, musictranscode.QualitySource} {
		path := musictranscode.CachePath(f.asset, quality)
		writeMusicPlaybackFile(t, path, string(quality)+" audio")
		f.caches[quality] = path
	}
	writeMusicPlaybackFile(t, musictranscode.SourceCacheMetadataPath(f.asset), `{"contentType":"audio/mpeg"}`)
	f.router = gin.New()
	f.router.GET("/music/:filename", ServeAsset(config.AssetTypeMusic))
	f.router.HEAD("/music/:filename", ServeAsset(config.AssetTypeMusic))
	return f
}

func writeMusicPlaybackFile(t *testing.T, path, body string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte(body), 0644); err != nil {
		t.Fatal(err)
	}
}

func setMusicPlaybackMtime(t *testing.T, path string, when time.Time) {
	t.Helper()
	if err := os.Chtimes(path, when, when); err != nil {
		t.Fatal(err)
	}
}

func musicPlaybackMtime(t *testing.T, path string) time.Time {
	t.Helper()
	info, err := os.Stat(path)
	if err != nil {
		t.Fatal(err)
	}
	return info.ModTime()
}

func TestMusicPlaybackRequestsRenewOnlySelectedQualityWithStableValidators(t *testing.T) {
	f := newMusicPlaybackFixture(t)
	old := f.sourceTime.Add(time.Hour)
	lastModified := f.sourceTime.Format(http.TimeFormat)
	for _, quality := range []musictranscode.Quality{musictranscode.QualitySmooth, musictranscode.QualitySource} {
		body := string(quality) + " audio"
		otherQuality := musictranscode.QualitySmooth
		if quality == otherQuality {
			otherQuality = musictranscode.QualitySource
		}
		for _, tc := range []struct {
			name    string
			method  string
			headers map[string]string
			status  int
			body    string
		}{
			{name: "get", method: http.MethodGet, status: http.StatusOK, body: body},
			{name: "head", method: http.MethodHead, status: http.StatusOK},
			{name: "range", method: http.MethodGet, headers: map[string]string{"Range": "bytes=0-2"}, status: http.StatusPartialContent, body: body[:3]},
			{name: "not modified", method: http.MethodGet, headers: map[string]string{"If-Modified-Since": lastModified}, status: http.StatusNotModified},
			{name: "matching if range", method: http.MethodGet, headers: map[string]string{"Range": "bytes=0-2", "If-Range": lastModified}, status: http.StatusPartialContent, body: body[:3]},
			{name: "stale if range", method: http.MethodGet, headers: map[string]string{"Range": "bytes=0-2", "If-Range": f.sourceTime.Add(-time.Hour).Format(http.TimeFormat)}, status: http.StatusOK, body: body},
		} {
			t.Run(string(quality)+"/"+tc.name, func(t *testing.T) {
				for _, path := range f.caches {
					setMusicPlaybackMtime(t, path, old)
				}
				request := httptest.NewRequest(tc.method, "/music/"+f.asset+"?quality="+string(quality), nil)
				for name, value := range tc.headers {
					request.Header.Set(name, value)
				}
				response := httptest.NewRecorder()
				before := time.Now().Add(-time.Second)
				f.router.ServeHTTP(response, request)
				if response.Code != tc.status || response.Body.String() != tc.body {
					t.Fatalf("response = %d %q, want %d %q", response.Code, response.Body.String(), tc.status, tc.body)
				}
				if got := response.Header().Get("Last-Modified"); got != lastModified {
					t.Errorf("Last-Modified = %q, want stable source time %q", got, lastModified)
				}
				if got := musicPlaybackMtime(t, f.caches[quality]); got.Before(before) || got.After(time.Now()) {
					t.Errorf("selected cache was not renewed to request time: %s", got)
				}
				if got := musicPlaybackMtime(t, f.caches[otherQuality]); !got.Equal(old) {
					t.Errorf("other quality was renewed: %s", got)
				}
				if got := musicPlaybackMtime(t, f.sourcePath); !got.Equal(f.sourceTime) {
					t.Errorf("original asset time changed: %s", got)
				}
			})
		}
	}
}

func TestMusicOriginalDownloadDoesNotRenewTranscodeCaches(t *testing.T) {
	f := newMusicPlaybackFixture(t)
	for _, path := range f.caches {
		setMusicPlaybackMtime(t, path, f.sourceTime)
	}
	response := httptest.NewRecorder()
	f.router.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/music/"+f.asset, nil))
	if response.Code != http.StatusOK || response.Body.String() != "original audio" {
		t.Fatalf("original response = %d %q", response.Code, response.Body.String())
	}
	for quality, path := range f.caches {
		if got := musicPlaybackMtime(t, path); !got.Equal(f.sourceTime) {
			t.Errorf("raw download renewed %s cache: %s", quality, got)
		}
	}
}

type blockedMusicResponse struct {
	*httptest.ResponseRecorder
	started chan struct{}
	resume  chan struct{}
	once    sync.Once
}

func (w *blockedMusicResponse) Write(body []byte) (int, error) {
	w.once.Do(func() {
		close(w.started)
		<-w.resume
	})
	return w.ResponseRecorder.Write(body)
}

func TestMusicResponseProtectsCacheUntilBodyCompletes(t *testing.T) {
	f := newMusicPlaybackFixture(t)
	w := &blockedMusicResponse{
		ResponseRecorder: httptest.NewRecorder(),
		started:          make(chan struct{}),
		resume:           make(chan struct{}),
	}
	done := make(chan struct{})
	var resumeOnce sync.Once
	resume := func() { resumeOnce.Do(func() { close(w.resume) }) }
	t.Cleanup(func() { resume(); <-done })
	go func() {
		defer close(done)
		f.router.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/music/"+f.asset+"?quality=source", nil))
	}()
	select {
	case <-w.started:
	case <-time.After(5 * time.Second):
		t.Fatal("response did not start writing")
	}
	// Move the cleanup clock beyond expiry so the active response lease is
	// what protects this cache, rather than the request's timestamp refresh.
	cleanupTime := time.Now().Add(musictranscode.CacheIdleTTL + time.Hour)
	metrics, err := musictranscode.CleanCache(true, cleanupTime)
	if err != nil {
		t.Fatal(err)
	}
	if metrics["skipped_active_music_transcode_caches"] != 1 {
		t.Fatalf("expected source response to protect one cache, metrics: %v", metrics)
	}
	for _, path := range []string{f.caches[musictranscode.QualitySource], musictranscode.SourceCacheMetadataPath(f.asset)} {
		if _, err := os.Stat(path); err != nil {
			t.Fatalf("active response cache disappeared: %v", err)
		}
	}
	resume()
	<-done
	if w.Code != http.StatusOK || w.Body.String() != "source audio" {
		t.Fatalf("response = %d %q", w.Code, w.Body.String())
	}
	if _, err := musictranscode.CleanCache(true, cleanupTime); err != nil {
		t.Fatal(err)
	}
	for _, path := range []string{f.caches[musictranscode.QualitySource], musictranscode.SourceCacheMetadataPath(f.asset)} {
		if _, err := os.Stat(path); !os.IsNotExist(err) {
			t.Fatalf("completed response did not release expired cache %s: %v", path, err)
		}
	}
}
