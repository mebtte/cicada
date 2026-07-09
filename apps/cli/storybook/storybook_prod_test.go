//go:build prod

package storybook

import (
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
