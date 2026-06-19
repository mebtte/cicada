package server

import (
	"cicada/internal/auth"
	"cicada/internal/config"
	"cicada/internal/store"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestNewServerDoesNotPanic(t *testing.T) {
	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
	})
	_ = NewServer()
}

func TestCORSAllowsChunkedUploadHeaders(t *testing.T) {
	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
	})
	r := NewServer()
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodOptions, "/api/common/asset/upload/upload-id", nil)
	req.Header.Set("Origin", "http://localhost:5173")
	req.Header.Set("Access-Control-Request-Method", http.MethodPut)
	req.Header.Set("Access-Control-Request-Headers", "content-range,x-cicada-token")

	r.ServeHTTP(w, req)

	if w.Code != http.StatusNoContent {
		t.Fatalf("expected 204 preflight, got %d", w.Code)
	}
	allowHeaders := w.Header().Get("Access-Control-Allow-Headers")
	if !strings.Contains(strings.ToLower(allowHeaders), "content-range") {
		t.Fatalf("expected Content-Range to be allowed, got %q", allowHeaders)
	}
}

func TestAssetUploadRoutesUseCommonAPIAsset(t *testing.T) {
	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
	})
	r := NewServer()

	routes := map[string]bool{}
	for _, route := range r.Routes() {
		routes[route.Method+" "+route.Path] = true
	}

	for _, route := range []string{
		http.MethodPost + " /api/common/asset",
		http.MethodPost + " /api/common/asset/upload",
		http.MethodGet + " /api/common/asset/upload/:uploadId",
		http.MethodPut + " /api/common/asset/upload/:uploadId",
		http.MethodPost + " /api/common/asset/upload/:uploadId/complete",
	} {
		if !routes[route] {
			t.Fatalf("expected %s to be registered", route)
		}
	}
	for _, route := range []string{
		http.MethodPost + " /form/asset",
		http.MethodPost + " /form/asset/chunked/init",
		http.MethodGet + " /form/asset/chunked/:uploadId",
		http.MethodPut + " /form/asset/chunked/:uploadId",
		http.MethodPost + " /form/asset/chunked/:uploadId/complete",
		http.MethodPost + " /api/asset",
		http.MethodPost + " /api/asset/upload",
		http.MethodGet + " /api/asset/upload/:uploadId",
		http.MethodPut + " /api/asset/upload/:uploadId",
		http.MethodPost + " /api/asset/upload/:uploadId/complete",
		http.MethodDelete + " /api/common/asset/upload/:uploadId",
	} {
		if routes[route] {
			t.Fatalf("did not expect %s to be registered", route)
		}
	}
}

func TestBaseAndCommonRoutesUseAPIPrefixes(t *testing.T) {
	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
	})
	r := NewServer()

	routes := map[string]bool{}
	for _, route := range r.Routes() {
		routes[route.Method+" "+route.Path] = true
	}

	for _, route := range []string{
		http.MethodGet + " /api/base/metadata",
		http.MethodGet + " /api/base/captcha",
		http.MethodPost + " /api/base/login",
		http.MethodPost + " /api/base/login_with_2fa",
		http.MethodGet + " /api/common/profile",
		http.MethodGet + " /api/common/music",
		http.MethodGet + " /api/common/musicbill",
	} {
		if !routes[route] {
			t.Fatalf("expected %s to be registered", route)
		}
	}

	for _, route := range []string{
		http.MethodGet + " /base/metadata",
		http.MethodGet + " /base/captcha",
		http.MethodPost + " /base/login",
		http.MethodPost + " /base/login_with_2fa",
		http.MethodGet + " /api/profile",
		http.MethodGet + " /api/music",
		http.MethodGet + " /api/musicbill",
	} {
		if routes[route] {
			t.Fatalf("did not expect %s to be registered", route)
		}
	}
}

func TestMusicWriteRoutesAreUnderAdmin(t *testing.T) {
	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
	})
	r := NewServer()

	routes := map[string]bool{}
	for _, route := range r.Routes() {
		routes[route.Method+" "+route.Path] = true
	}

	for _, method := range []string{http.MethodPost, http.MethodPut, http.MethodDelete} {
		if !routes[method+" /api/admin/music"] {
			t.Fatalf("expected %s /api/admin/music to be registered", method)
		}
		if routes[method+" /api/music"] {
			t.Fatalf("did not expect %s /api/music to remain registered", method)
		}
		if routes[method+" /api/common/music"] {
			t.Fatalf("did not expect %s /api/common/music to be registered", method)
		}
	}
}

func TestMusicWriteRoutesRequireAdmin(t *testing.T) {
	if err := store.ResetForTests(); err != nil {
		t.Fatalf("reset store: %v", err)
	}
	t.Cleanup(func() {
		if err := store.ResetForTests(); err != nil {
			t.Fatalf("cleanup store: %v", err)
		}
	})

	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
	})
	if err := store.Initialize(); err != nil {
		t.Fatalf("initialize store: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO user (id,username,password,nickname,joinTimestamp,admin) VALUES (?,?,?,?,?,?)`,
		"USER01", "user", store.DoubleMD5("password"), "User", time.Now().UnixMilli(), 0,
	); err != nil {
		t.Fatalf("insert user: %v", err)
	}
	token, tokenPrefix, tokenHash, err := auth.NewSessionToken()
	if err != nil {
		t.Fatalf("create token: %v", err)
	}
	if _, err := store.CreateAuthSession("USER01", tokenHash, tokenPrefix, "test"); err != nil {
		t.Fatalf("create auth session: %v", err)
	}

	r := NewServer()
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/admin/music", nil)
	req.Header.Set("x-cicada-token", token)

	r.ServeHTTP(w, req)

	var resp struct {
		Code string `json:"code"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.Code != "not_authorized_for_admin" {
		t.Fatalf("expected not_authorized_for_admin, got %s body=%s", resp.Code, w.Body.String())
	}
}
