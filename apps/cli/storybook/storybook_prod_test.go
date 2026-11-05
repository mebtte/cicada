//go:build prod

package storybook

import (
	"cicada/internal/config"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func newEngine() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	Register(r)
	return r
}

func TestRedirectToTrailingSlash(t *testing.T) {
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/storybook", nil)
	newEngine().ServeHTTP(w, req)

	if w.Code != http.StatusMovedPermanently {
		t.Fatalf("want 301, got %d", w.Code)
	}
	if loc := w.Header().Get("Location"); loc != "/storybook/" {
		t.Fatalf("want redirect to /storybook/, got %q", loc)
	}
}

func TestServesIndex(t *testing.T) {
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/storybook/", nil)
	newEngine().ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("want 200 for index, got %d", w.Code)
	}
	if !strings.Contains(w.Body.String(), "<html") {
		t.Fatalf("index.html body does not look like HTML: %.80q", w.Body.String())
	}
}

func TestServesRealAsset(t *testing.T) {
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/storybook/iframe.html", nil)
	newEngine().ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("want 200 for iframe.html, got %d", w.Code)
	}
}

func TestUnknownPath404(t *testing.T) {
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/storybook/does-not-exist.js", nil)
	newEngine().ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("want 404 for missing file, got %d", w.Code)
	}
}

func TestStorybookUnderBasePath(t *testing.T) {
	previous := config.Get()
	t.Cleanup(func() { config.Set(previous) })
	for _, prefix := range []string{"/cicada", "/apps/music"} {
		t.Run(prefix, func(t *testing.T) {
			config.Set(config.Config{BasePath: prefix})
			r := newEngine()
			for _, method := range []string{http.MethodGet, http.MethodHead} {
				w := httptest.NewRecorder()
				r.ServeHTTP(w, httptest.NewRequest(method, prefix+"/storybook?x=1", nil))
				if w.Code != http.StatusMovedPermanently || w.Header().Get("Location") != prefix+"/storybook/?x=1" {
					t.Fatalf("storybook redirect = %d %q", w.Code, w.Header().Get("Location"))
				}
				for _, path := range []string{"/storybook/", "/storybook/iframe.html"} {
					w = httptest.NewRecorder()
					r.ServeHTTP(w, httptest.NewRequest(method, prefix+path, nil))
					if w.Code != http.StatusOK {
						t.Errorf("%s %s = %d; want 200", method, prefix+path, w.Code)
					}
					if method == http.MethodHead && w.Body.Len() != 0 {
						t.Error("HEAD response contains a body")
					}
				}
			}
			for _, path := range []string{"/storybook/", prefix + "-other/storybook/", prefix + "/storybook/missing.js"} {
				w := httptest.NewRecorder()
				r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, path, nil))
				if w.Code != http.StatusNotFound {
					t.Errorf("%s = %d; want 404", path, w.Code)
				}
			}
		})
	}
}
