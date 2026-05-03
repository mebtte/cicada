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

// setupSingerPhotoTest initialises the store, seeds an admin user and one
// singer. It also creates a real asset file under the singer_photo dir so
// handler-side asset existence checks pass. Authorization is enforced by the
// admin middleware, which is not exercised at this level — these tests only
// cover the handler logic itself.
func setupSingerPhotoTest(t *testing.T) (admin *store.User, singerID string) {
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
	if _, err := store.DB().Exec(
		`INSERT INTO user (id,username,password,nickname,joinTimestamp,admin) VALUES (?,?,?,?,?,?)`,
		"user-admin", "admin", store.DoubleMD5("password"), "Admin", now, 1,
	); err != nil {
		t.Fatalf("insert admin user: %v", err)
	}

	if _, err := store.DB().Exec(
		`INSERT INTO singer (id,name,aliases,createUserId,createTimestamp) VALUES (?,?,?,?,?)`,
		"singer-1", "Aurora", "", "user-admin", now,
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

	return &store.User{ID: "user-admin", Admin: 1}, "singer-1"
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

func TestAdminCreateSingerPhoto(t *testing.T) {
	admin, singerID := setupSingerPhotoTest(t)

	t.Run("admin can add a photo with description", func(t *testing.T) {
		code, _, data := callPhoto(t, AdminCreateSingerPhoto, http.MethodPost, "/api/admin/singer/photo",
			map[string]any{"singerId": singerID, "asset": "pic.jpg", "description": "Live"},
			admin,
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
		code, _, _ := callPhoto(t, AdminCreateSingerPhoto, http.MethodPost, "/api/admin/singer/photo",
			map[string]any{"singerId": singerID, "asset": "pic.jpg"},
			admin,
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
		code, _, _ := callPhoto(t, AdminCreateSingerPhoto, http.MethodPost, "/api/admin/singer/photo",
			map[string]any{"singerId": singerID, "asset": "ghost.jpg"},
			admin,
		)
		if code != "asset_not_existed" {
			t.Fatalf("expected asset_not_existed, got %s", code)
		}
	})

	t.Run("rejects when singer is missing", func(t *testing.T) {
		code, _, _ := callPhoto(t, AdminCreateSingerPhoto, http.MethodPost, "/api/admin/singer/photo",
			map[string]any{"singerId": "nope", "asset": "pic.jpg"},
			admin,
		)
		if code != "singer_not_existed" {
			t.Fatalf("expected singer_not_existed, got %s", code)
		}
	})

	t.Run("rejects when description is too long", func(t *testing.T) {
		long := strings.Repeat("x", singerPhotoDescriptionMaxLen+1)
		code, _, _ := callPhoto(t, AdminCreateSingerPhoto, http.MethodPost, "/api/admin/singer/photo",
			map[string]any{"singerId": singerID, "asset": "pic.jpg", "description": long},
			admin,
		)
		if code != "wrong_parameter" {
			t.Fatalf("expected wrong_parameter, got %s", code)
		}
	})
}

func TestAdminUpdateSingerPhoto(t *testing.T) {
	admin, singerID := setupSingerPhotoTest(t)
	id, err := store.CreateSingerPhoto(singerID, "pic.jpg", "old", admin.ID)
	if err != nil {
		t.Fatalf("seed photo: %v", err)
	}

	t.Run("admin updates description", func(t *testing.T) {
		code, _, _ := callPhoto(t, AdminUpdateSingerPhoto, http.MethodPut, "/api/admin/singer/photo",
			map[string]any{"id": id, "description": "new"}, admin,
		)
		if code != "success" {
			t.Fatalf("expected success, got %s", code)
		}
		p, _ := store.GetSingerPhoto(id)
		if p.Description != "new" {
			t.Fatalf("expected description=new, got %q", p.Description)
		}
	})

	t.Run("description over max rejected", func(t *testing.T) {
		long := strings.Repeat("y", singerPhotoDescriptionMaxLen+1)
		code, _, _ := callPhoto(t, AdminUpdateSingerPhoto, http.MethodPut, "/api/admin/singer/photo",
			map[string]any{"id": id, "description": long}, admin,
		)
		if code != "wrong_parameter" {
			t.Fatalf("expected wrong_parameter, got %s", code)
		}
	})

	t.Run("missing photo id rejected", func(t *testing.T) {
		code, _, _ := callPhoto(t, AdminUpdateSingerPhoto, http.MethodPut, "/api/admin/singer/photo",
			map[string]any{"id": "ghost", "description": "x"}, admin,
		)
		if code != "wrong_parameter" {
			t.Fatalf("expected wrong_parameter, got %s", code)
		}
	})
}

func TestAdminDeleteSingerPhoto(t *testing.T) {
	admin, singerID := setupSingerPhotoTest(t)
	id1, _ := store.CreateSingerPhoto(singerID, "pic.jpg", "", admin.ID)
	id2, _ := store.CreateSingerPhoto(singerID, "pic.jpg", "", admin.ID)
	id3, _ := store.CreateSingerPhoto(singerID, "pic.jpg", "", admin.ID)

	t.Run("admin deletes middle photo, gap remains", func(t *testing.T) {
		code, _, _ := callPhoto(t, AdminDeleteSingerPhoto, http.MethodDelete, "/api/admin/singer/photo",
			map[string]any{"id": id2}, admin,
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

func TestAdminReorderSingerPhotos(t *testing.T) {
	admin, singerID := setupSingerPhotoTest(t)
	id1, _ := store.CreateSingerPhoto(singerID, "pic.jpg", "", admin.ID)
	id2, _ := store.CreateSingerPhoto(singerID, "pic.jpg", "", admin.ID)
	id3, _ := store.CreateSingerPhoto(singerID, "pic.jpg", "", admin.ID)

	t.Run("admin can reorder, first becomes avatar", func(t *testing.T) {
		code, _, _ := callPhoto(t, AdminReorderSingerPhotos, http.MethodPut, "/api/admin/singer/photo/order",
			map[string]any{"singerId": singerID, "ids": []string{id3, id1, id2}}, admin,
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
		code, _, _ := callPhoto(t, AdminReorderSingerPhotos, http.MethodPut, "/api/admin/singer/photo/order",
			map[string]any{"singerId": singerID, "ids": []string{id3, id1}}, admin,
		)
		if code != "wrong_parameter" {
			t.Fatalf("expected wrong_parameter, got %s", code)
		}
	})

	t.Run("rejects duplicate ids", func(t *testing.T) {
		code, _, _ := callPhoto(t, AdminReorderSingerPhotos, http.MethodPut, "/api/admin/singer/photo/order",
			map[string]any{"singerId": singerID, "ids": []string{id1, id1, id2}}, admin,
		)
		if code != "wrong_parameter" {
			t.Fatalf("expected wrong_parameter, got %s", code)
		}
	})
}
