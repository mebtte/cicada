package handler

import (
	"bytes"
	"cicada/internal/api/apperr"
	"cicada/internal/config"
	"cicada/internal/store"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

func responseCode(t *testing.T, w *httptest.ResponseRecorder) string {
	t.Helper()

	var resp struct {
		Code string `json:"code"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	return resp.Code
}

func TestAdminCreateMusicNameLimit(t *testing.T) {
	gin.SetMode(gin.TestMode)
	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
	})

	call := func(name string) string {
		t.Helper()

		body, err := json.Marshal(map[string]any{
			"name":         name,
			"performerIds": "",
			"type":         int(store.MusicTypeSong),
			"asset":        "missing.mp3",
		})
		if err != nil {
			t.Fatalf("marshal body: %v", err)
		}

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest(http.MethodPost, "/api/admin/music", bytes.NewReader(body))
		c.Request.Header.Set("Content-Type", "application/json")
		c.Set("authed_user", &store.User{ID: "USER01", Admin: 1})

		AdminCreateMusic(c)

		return responseCode(t, w)
	}

	// Missing asset is intentional: it proves a 128-character name passes name
	// validation without creating a row or invoking metadata sync.
	if code := call(strings.Repeat("歌", musicNameMaxLength)); code != apperr.AssetNotExisted {
		t.Fatalf("expected %s after valid name, got %s", apperr.AssetNotExisted, code)
	}
	if code := call(strings.Repeat("歌", musicNameMaxLength+1)); code != apperr.WrongParameter {
		t.Fatalf("expected %s for overlong name, got %s", apperr.WrongParameter, code)
	}
}

func TestAdminCreateMusicRejectsInstrumentalLyricists(t *testing.T) {
	gin.SetMode(gin.TestMode)
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

	now := time.Now().UnixMilli()
	if _, err := store.DB().Exec(
		`INSERT INTO artist (id,name,createTimestamp) VALUES (?,?,?)`,
		"ART001", "Writer", now,
	); err != nil {
		t.Fatalf("insert artist: %v", err)
	}
	assetDir, assetPath := config.AssetPath(config.AssetTypeMusic, "song.mp3")
	if err := os.MkdirAll(assetDir, 0755); err != nil {
		t.Fatalf("mkdir asset dir: %v", err)
	}
	if err := os.WriteFile(assetPath, []byte("placeholder"), 0644); err != nil {
		t.Fatalf("write asset: %v", err)
	}

	body, err := json.Marshal(map[string]any{
		"name":        "Instrumental",
		"lyricistIds": "ART001",
		"type":        int(store.MusicTypeInstrumental),
		"asset":       "song.mp3",
	})
	if err != nil {
		t.Fatalf("marshal body: %v", err)
	}
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/api/admin/music", bytes.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Set("authed_user", &store.User{ID: "USER01", Admin: 1})

	AdminCreateMusic(c)

	if code := responseCode(t, w); code != apperr.InstrumentalHasNoLyricist {
		t.Fatalf("expected %s, got %s body=%s", apperr.InstrumentalHasNoLyricist, code, w.Body.String())
	}
	var count int
	if err := store.DB().QueryRow(`SELECT COUNT(1) FROM music`).Scan(&count); err != nil {
		t.Fatalf("count music: %v", err)
	}
	if count != 0 {
		t.Fatalf("expected no music row, got %d", count)
	}
}

func TestAdminUpdateMusicNameLimit(t *testing.T) {
	gin.SetMode(gin.TestMode)
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

	now := time.Now().UnixMilli()
	if _, err := store.DB().Exec(
		`INSERT INTO user (id,username,password,nickname,joinTimestamp) VALUES (?,?,?,?,?)`,
		"USER01", "creator", store.DoubleMD5("password"), "Creator", now,
	); err != nil {
		t.Fatalf("insert user: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO music (id,type,name,asset,createTimestamp) VALUES (?,?,?,?,?)`,
		"MUS001", int(store.MusicTypeSong), "Song", "missing.mp3", now,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}

	call := func(name string) string {
		t.Helper()

		body, err := json.Marshal(map[string]any{
			"id":    "MUS001",
			"key":   "name",
			"value": name,
		})
		if err != nil {
			t.Fatalf("marshal body: %v", err)
		}

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest(http.MethodPut, "/api/admin/music", bytes.NewReader(body))
		c.Request.Header.Set("Content-Type", "application/json")
		c.Set("authed_user", &store.User{ID: "USER01", Admin: 1})

		AdminUpdateMusic(c)

		return responseCode(t, w)
	}

	validName := strings.Repeat("歌", musicNameMaxLength)
	if code := call(validName); code != "success" {
		t.Fatalf("expected success for valid name, got %s", code)
	}

	var storedName string
	if err := store.DB().QueryRow(`SELECT name FROM music WHERE id=?`, "MUS001").Scan(&storedName); err != nil {
		t.Fatalf("get stored name: %v", err)
	}
	if storedName != validName {
		t.Fatalf("expected stored name to be updated")
	}

	if code := call(strings.Repeat("歌", musicNameMaxLength+1)); code != apperr.WrongParameter {
		t.Fatalf("expected %s for overlong name, got %s", apperr.WrongParameter, code)
	}
}
