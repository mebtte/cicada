package server

import (
	"cicada/internal/config"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
)

func TestServerBasePath(t *testing.T) {
	previous := config.Get()
	t.Cleanup(func() { config.Set(previous) })
	for _, prefix := range []string{"", "/cicada", "/apps/music"} {
		t.Run(prefix, func(t *testing.T) {
			config.Set(config.Config{Mode: config.ModeProduction, Data: t.TempDir(), BasePath: prefix})
			r := NewServer()
			for _, tc := range []struct {
				method string
				path   string
				status int
			}{
				{http.MethodGet, prefix + "/api/base/metadata", 200},
				{http.MethodGet, prefix + "/api/common/profile", 200},
				{http.MethodGet, prefix + "/apidoc", 200},
				{http.MethodGet, prefix + "/apidoc/", 200},
				{http.MethodGet, prefix + "/apidoc/openapi.json", 200},
				{http.MethodGet, prefix + "/api/missing", 404},
				{http.MethodOptions, prefix + "/api/common/asset/upload/id", 204},
			} {
				w := httptest.NewRecorder()
				r.ServeHTTP(w, httptest.NewRequest(tc.method, tc.path, nil))
				if w.Code != tc.status {
					t.Errorf("%s %s = %d; want %d", tc.method, tc.path, w.Code, tc.status)
				}
			}
			for _, route := range r.Routes() {
				if prefix != "" && route.Path != prefix && !strings.HasPrefix(route.Path, prefix+"/") {
					t.Errorf("route leaked outside base path: %s %s", route.Method, route.Path)
				}
			}
			// Auth must still run after mounting both normal and upload routes.
			for _, path := range []string{"/api/common/profile", "/api/common/asset/upload", "/api/admin/music"} {
				method := http.MethodPost
				if path == "/api/common/profile" {
					method = http.MethodGet
				}
				w := httptest.NewRecorder()
				r.ServeHTTP(w, httptest.NewRequest(method, prefix+path, nil))
				var response struct {
					Code string `json:"code"`
				}
				if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil || response.Code != "not_authorized" {
					t.Fatalf("mounted auth %s %s returned %s (%v)", method, prefix+path, w.Body.String(), err)
				}
			}
			assetDir, assetPath := config.AssetPath(config.AssetTypeMusicCover, "cover.jpg")
			if err := os.MkdirAll(assetDir, 0755); err != nil {
				t.Fatal(err)
			}
			if err := os.WriteFile(assetPath, []byte("0123456789"), 0644); err != nil {
				t.Fatal(err)
			}
			for _, method := range []string{http.MethodGet, http.MethodHead} {
				w := httptest.NewRecorder()
				req := httptest.NewRequest(method, prefix+"/asset/music_cover/cover.jpg", nil)
				req.Header.Set("Range", "bytes=2-5")
				r.ServeHTTP(w, req)
				if w.Code != http.StatusPartialContent || w.Header().Get("Content-Range") != "bytes 2-5/10" {
					t.Fatalf("mounted asset range %s returned %d %q", method, w.Code, w.Header().Get("Content-Range"))
				}
				if method == http.MethodGet && w.Body.String() != "2345" || method == http.MethodHead && w.Body.Len() != 0 {
					t.Fatalf("mounted asset %s body = %q", method, w.Body.String())
				}
			}
			w := httptest.NewRecorder()
			r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, prefix+"/apidoc/openapi.json", nil))
			var spec struct {
				Servers []struct {
					URL string `json:"url"`
				} `json:"servers"`
				Paths map[string]json.RawMessage `json:"paths"`
			}
			if err := json.Unmarshal(w.Body.Bytes(), &spec); err != nil {
				t.Fatal(err)
			}
			serverURL := prefix
			if serverURL == "" {
				serverURL = "/"
			}
			if len(spec.Servers) != 1 || spec.Servers[0].URL != serverURL || spec.Paths["/api/base/metadata"] == nil {
				t.Fatalf("OpenAPI has incorrect base URL or logical paths: %+v", spec)
			}
			w = httptest.NewRecorder()
			r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, prefix+"/apidoc", nil))
			if !strings.Contains(w.Body.String(), `href="`+prefix+`/apidoc/openapi.json"`) || !strings.Contains(w.Body.String(), `fetch("`+prefix+`/apidoc/openapi.json")`) {
				t.Fatal("documentation page does not use mounted spec URL")
			}
			if prefix == "" {
				return
			}
			for _, method := range []string{http.MethodGet, http.MethodHead} {
				w := httptest.NewRecorder()
				r.ServeHTTP(w, httptest.NewRequest(method, prefix+"?x=1&x=2", nil))
				if w.Code != http.StatusPermanentRedirect || w.Header().Get("Location") != prefix+"/?x=1&x=2" {
					t.Fatalf("mount redirect = %d %q", w.Code, w.Header().Get("Location"))
				}
			}
			for _, path := range []string{"/", "/api/base/metadata", "/asset/music/test.mp3", prefix + "-other/api/base/metadata", "/apidoc/openapi.json"} {
				for _, method := range []string{http.MethodGet, http.MethodOptions} {
					w := httptest.NewRecorder()
					r.ServeHTTP(w, httptest.NewRequest(method, path, nil))
					if w.Code != http.StatusNotFound {
						t.Errorf("outside mount %s %s = %d; want 404", method, path, w.Code)
					}
				}
			}
		})
	}
}
