//go:build prod

package pwa_test

import (
	"cicada/internal/config"
	"cicada/internal/server"
	"cicada/pwa"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestEmbeddedPWAUnderBasePath(t *testing.T) {
	previous := config.Get()
	t.Cleanup(func() { config.Set(previous) })
	for _, prefix := range []string{"", "/cicada", "/apps/music"} {
		t.Run(prefix, func(t *testing.T) {
			config.Set(config.Config{Mode: config.ModeProduction, Data: t.TempDir(), BasePath: prefix})
			r := server.NewServer()
			pwa.Register(r)
			for _, tc := range []struct {
				method string
				path   string
				status int
			}{
				{http.MethodGet, prefix + "/", 200},
				{http.MethodHead, prefix + "/", 200},
				{http.MethodGet, prefix + "/favicon-32_v1.png", 200},
				{http.MethodGet, prefix + "/service_worker.js", 200},
				{http.MethodGet, prefix + "/missing.js", 404},
				{http.MethodGet, prefix + "/api/missing", 404},
				{http.MethodGet, prefix + "/assets/", 404},
				{http.MethodPost, prefix + "/", 404},
			} {
				w := httptest.NewRecorder()
				r.ServeHTTP(w, httptest.NewRequest(tc.method, tc.path, nil))
				if w.Code != tc.status {
					t.Errorf("%s %s = %d; want %d", tc.method, tc.path, w.Code, tc.status)
				}
				if tc.method == http.MethodHead && w.Body.Len() != 0 {
					t.Error("HEAD response contains a body")
				}
				if tc.path == prefix+"/" && tc.method == http.MethodGet && !strings.Contains(w.Body.String(), "<html") {
					t.Error("index response does not contain HTML")
				}
			}
			if prefix != "" {
				for _, path := range []string{"/", "/favicon-32_v1.png", prefix + "-other/favicon-32_v1.png"} {
					w := httptest.NewRecorder()
					r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, path, nil))
					if w.Code != http.StatusNotFound {
						t.Errorf("outside mount %s = %d; want 404", path, w.Code)
					}
				}
			}
		})
	}
}
