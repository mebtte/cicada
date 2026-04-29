package handler

import (
	"bytes"
	"cicada/internal/config"
	"cicada/internal/store"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

// setupSingerPhotoTest initialises the store, seeds two users (creator,
// stranger) and one singer owned by user-1. It also creates a real asset file
// for the new singer_photo dir so handler-side asset existence checks pass.
func setupSingerPhotoTest(t *testing.T) (creator *store.User, stranger *store.User, admin *store.User, singerID string) {
	t.Helper()
	gin.SetMode(gin.TestMode)
	if err := store.ResetForTests(); err != nil {
		t.Fatalf("reset store: %v", err)
	}
	t.Cleanup(func() {
		if err := store.ResetForTests(); err != nil {
			t.Fatalf("cleanup store: %v", err)
		}
	})

	dataDir := t.TempDir()
	config.Set(config.Config{
		Mode:      config.ModeProduction,
		Data:      dataDir,
		Port:      8000,
		JWTExpiry: int64(180 * 24 * 60 * 60 * 1000),
	})
	if err := store.Initialize(); err != nil {
		t.Fatalf("initialize store: %v", err)
	}

	now := time.Now().UnixMilli()
	insertUser := func(id, username, nickname string, isAdmin int) {
		t.Helper()
		if _, err := store.DB().Exec(
			`INSERT INTO user (id,username,password,nickname,joinTimestamp,admin) VALUES (?,?,?,?,?,?)`,
			id, username, store.DoubleMD5("password"), nickname, now, isAdmin,
		); err != nil {
			t.Fatalf("insert user %s: %v", id, err)
		}
	}
	insertUser("user-1", "creator", "Creator", 0)
	insertUser("user-2", "stranger", "Stranger", 0)
	insertUser("user-admin", "admin", "Admin", 1)

	if _, err := store.DB().Exec(
		`INSERT INTO singer (id,name,aliases,createUserId,createTimestamp) VALUES (?,?,?,?,?)`,
		"singer-1", "Aurora", "", "user-1", now,
	); err != nil {
		t.Fatalf("insert singer: %v", err)
	}

	// A real asset file the handlers can stat.
	if err := os.WriteFile(
		filepath.Join(config.AssetDir(config.AssetTypeSingerPhoto), "pic.jpg"),
		[]byte("fake-jpeg"), 0644,
	); err != nil {
		t.Fatalf("seed asset: %v", err)
	}

	return &store.User{ID: "user-1"},
		&store.User{ID: "user-2"},
		&store.User{ID: "user-admin", Admin: 1},
		"singer-1"
}

// callPhoto invokes a handler with a JSON body and a logged-in user. Returns
// the parsed response code and the raw recorder.
func callPhoto(t *testing.T, h gin.HandlerFunc, method, url string, body any, u *store.User) (string, *httptest.ResponseRecorder, map[string]any) {
	t.Helper()
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	var rdr *bytes.Reader
	if body == nil {
		rdr = bytes.NewReader(nil)
	} else {
		buf, err := json.Marshal(body)
		if err != nil {
			t.Fatalf("marshal body: %v", err)
		}
		rdr = bytes.NewReader(buf)
	}
	req := httptest.NewRequest(method, url, rdr)
	req.Header.Set("Content-Type", "application/json")
	c.Request = req
	c.Set("authed_user", u)
	h(c)

	var parsed struct {
		Code string         `json:"code"`
		Data map[string]any `json:"data"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &parsed); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	return parsed.Code, w, parsed.Data
}

func TestCreateSingerPhoto(t *testing.T) {
	creator, stranger, _, singerID := setupSingerPhotoTest(t)

	t.Run("creator can add a photo with description", func(t *testing.T) {
		code, _, data := callPhoto(t, CreateSingerPhoto, http.MethodPost, "/api/singer/photo",
			map[string]any{"singerId": singerID, "asset": "pic.jpg", "description": "Live"},
			creator,
		)
		if code != "success" {
			t.Fatalf("expected success, got %s", code)
		}
		id, _ := data["id"].(string)
		if id == "" {
			t.Fatalf("expected id in response, got %+v", data)
		}
		photos, _ := store.ListSingerPhotos(singerID)
		if len(photos) != 1 {
			t.Fatalf("expected 1 photo, got %d", len(photos))
		}
		if photos[0].Position != 0 || photos[0].Description != "Live" || photos[0].Asset != "pic.jpg" {
			t.Fatalf("unexpected photo row: %+v", photos[0])
		}
	})

	t.Run("position increments for the next photo", func(t *testing.T) {
		// asset file is reused — the handler only verifies existence, not uniqueness.
		code, _, _ := callPhoto(t, CreateSingerPhoto, http.MethodPost, "/api/singer/photo",
			map[string]any{"singerId": singerID, "asset": "pic.jpg"},
			creator,
		)
		if code != "success" {
			t.Fatalf("expected success, got %s", code)
		}
		photos, _ := store.ListSingerPhotos(singerID)
		if len(photos) != 2 {
			t.Fatalf("expected 2 photos, got %d", len(photos))
		}
		if photos[1].Position != 1 || photos[1].Description != "" {
			t.Fatalf("expected pos=1 desc='' for second photo: %+v", photos[1])
		}
	})

	t.Run("rejects when asset is missing", func(t *testing.T) {
		code, _, _ := callPhoto(t, CreateSingerPhoto, http.MethodPost, "/api/singer/photo",
			map[string]any{"singerId": singerID, "asset": "ghost.jpg"},
			creator,
		)
		if code != "asset_not_existed" {
			t.Fatalf("expected asset_not_existed, got %s", code)
		}
	})

	t.Run("rejects when singer is missing", func(t *testing.T) {
		code, _, _ := callPhoto(t, CreateSingerPhoto, http.MethodPost, "/api/singer/photo",
			map[string]any{"singerId": "nope", "asset": "pic.jpg"},
			creator,
		)
		if code != "singer_not_existed" {
			t.Fatalf("expected singer_not_existed, got %s", code)
		}
	})

	t.Run("rejects when description is too long", func(t *testing.T) {
		long := strings.Repeat("x", singerPhotoDescriptionMaxLen+1)
		code, _, _ := callPhoto(t, CreateSingerPhoto, http.MethodPost, "/api/singer/photo",
			map[string]any{"singerId": singerID, "asset": "pic.jpg", "description": long},
			creator,
		)
		if code != "wrong_parameter" {
			t.Fatalf("expected wrong_parameter, got %s", code)
		}
	})

	t.Run("non-owner non-admin is rejected", func(t *testing.T) {
		code, _, _ := callPhoto(t, CreateSingerPhoto, http.MethodPost, "/api/singer/photo",
			map[string]any{"singerId": singerID, "asset": "pic.jpg"},
			stranger,
		)
		if code != "not_authorized" {
			t.Fatalf("expected not_authorized, got %s", code)
		}
	})
}

func TestUpdateSingerPhoto(t *testing.T) {
	creator, stranger, admin, singerID := setupSingerPhotoTest(t)
	id, err := store.CreateSingerPhoto(singerID, "pic.jpg", "old", creator.ID)
	if err != nil {
		t.Fatalf("seed photo: %v", err)
	}

	t.Run("creator updates description", func(t *testing.T) {
		code, _, _ := callPhoto(t, UpdateSingerPhoto, http.MethodPut, "/api/singer/photo",
			map[string]any{"id": id, "description": "new"}, creator,
		)
		if code != "success" {
			t.Fatalf("expected success, got %s", code)
		}
		p, _ := store.GetSingerPhoto(id)
		if p.Description != "new" {
			t.Fatalf("expected description=new, got %q", p.Description)
		}
	})

	t.Run("admin can update", func(t *testing.T) {
		code, _, _ := callPhoto(t, UpdateSingerPhoto, http.MethodPut, "/api/singer/photo",
			map[string]any{"id": id, "description": "by admin"}, admin,
		)
		if code != "success" {
			t.Fatalf("expected success, got %s", code)
		}
	})

	t.Run("stranger rejected", func(t *testing.T) {
		code, _, _ := callPhoto(t, UpdateSingerPhoto, http.MethodPut, "/api/singer/photo",
			map[string]any{"id": id, "description": "hacked"}, stranger,
		)
		if code != "not_authorized" {
			t.Fatalf("expected not_authorized, got %s", code)
		}
	})

	t.Run("description over max rejected", func(t *testing.T) {
		long := strings.Repeat("y", singerPhotoDescriptionMaxLen+1)
		code, _, _ := callPhoto(t, UpdateSingerPhoto, http.MethodPut, "/api/singer/photo",
			map[string]any{"id": id, "description": long}, creator,
		)
		if code != "wrong_parameter" {
			t.Fatalf("expected wrong_parameter, got %s", code)
		}
	})

	t.Run("missing photo id rejected", func(t *testing.T) {
		code, _, _ := callPhoto(t, UpdateSingerPhoto, http.MethodPut, "/api/singer/photo",
			map[string]any{"id": "ghost", "description": "x"}, creator,
		)
		if code != "wrong_parameter" {
			t.Fatalf("expected wrong_parameter, got %s", code)
		}
	})
}

func TestDeleteSingerPhoto(t *testing.T) {
	creator, stranger, _, singerID := setupSingerPhotoTest(t)
	id1, _ := store.CreateSingerPhoto(singerID, "pic.jpg", "", creator.ID)
	id2, _ := store.CreateSingerPhoto(singerID, "pic.jpg", "", creator.ID)
	id3, _ := store.CreateSingerPhoto(singerID, "pic.jpg", "", creator.ID)

	t.Run("stranger rejected", func(t *testing.T) {
		code, _, _ := callPhoto(t, DeleteSingerPhoto, http.MethodDelete, "/api/singer/photo",
			map[string]any{"id": id2}, stranger,
		)
		if code != "not_authorized" {
			t.Fatalf("expected not_authorized, got %s", code)
		}
	})

	t.Run("creator deletes middle photo, gap remains", func(t *testing.T) {
		code, _, _ := callPhoto(t, DeleteSingerPhoto, http.MethodDelete, "/api/singer/photo",
			map[string]any{"id": id2}, creator,
		)
		if code != "success" {
			t.Fatalf("expected success, got %s", code)
		}
		photos, _ := store.ListSingerPhotos(singerID)
		if len(photos) != 2 {
			t.Fatalf("expected 2 photos, got %d", len(photos))
		}
		// Positions 0 and 2 remain — gap at 1 is intentional.
		if photos[0].ID != id1 || photos[0].Position != 0 {
			t.Fatalf("unexpected first photo: %+v", photos[0])
		}
		if photos[1].ID != id3 || photos[1].Position != 2 {
			t.Fatalf("unexpected second photo: %+v", photos[1])
		}
	})
}

func TestReorderSingerPhotos(t *testing.T) {
	creator, stranger, _, singerID := setupSingerPhotoTest(t)
	id1, _ := store.CreateSingerPhoto(singerID, "pic.jpg", "", creator.ID)
	id2, _ := store.CreateSingerPhoto(singerID, "pic.jpg", "", creator.ID)
	id3, _ := store.CreateSingerPhoto(singerID, "pic.jpg", "", creator.ID)

	t.Run("creator can reorder, first becomes avatar", func(t *testing.T) {
		code, _, _ := callPhoto(t, ReorderSingerPhotos, http.MethodPut, "/api/singer/photo/order",
			map[string]any{"singerId": singerID, "ids": []string{id3, id1, id2}}, creator,
		)
		if code != "success" {
			t.Fatalf("expected success, got %s", code)
		}
		photos, _ := store.ListSingerPhotos(singerID)
		if len(photos) != 3 ||
			photos[0].ID != id3 ||
			photos[1].ID != id1 ||
			photos[2].ID != id2 {
			t.Fatalf("unexpected order: %+v", photos)
		}
	})

	t.Run("rejects when ids set mismatches", func(t *testing.T) {
		code, _, _ := callPhoto(t, ReorderSingerPhotos, http.MethodPut, "/api/singer/photo/order",
			map[string]any{"singerId": singerID, "ids": []string{id3, id1}}, creator,
		)
		if code != "wrong_parameter" {
			t.Fatalf("expected wrong_parameter, got %s", code)
		}
	})

	t.Run("rejects duplicate ids", func(t *testing.T) {
		code, _, _ := callPhoto(t, ReorderSingerPhotos, http.MethodPut, "/api/singer/photo/order",
			map[string]any{"singerId": singerID, "ids": []string{id1, id1, id2}}, creator,
		)
		if code != "wrong_parameter" {
			t.Fatalf("expected wrong_parameter, got %s", code)
		}
	})

	t.Run("stranger rejected", func(t *testing.T) {
		code, _, _ := callPhoto(t, ReorderSingerPhotos, http.MethodPut, "/api/singer/photo/order",
			map[string]any{"singerId": singerID, "ids": []string{id1, id2, id3}}, stranger,
		)
		if code != "not_authorized" {
			t.Fatalf("expected not_authorized, got %s", code)
		}
	})
}
