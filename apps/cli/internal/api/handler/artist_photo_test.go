package handler

import (
	"bytes"
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

// setupArtistPhotoTest initialises the store, seeds an admin user and one
// artist. It also creates a real asset file under the artist_photo dir so
// handler-side asset existence checks pass. Authorization is enforced by the
// admin middleware, which is not exercised at this level — these tests only
// cover the handler logic itself.
func setupArtistPhotoTest(t *testing.T) (admin *store.User, artistID string) {
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
		Mode: config.ModeProduction,
		Data: dataDir,
		Port: 8000,
	})
	if err := store.Initialize(); err != nil {
		t.Fatalf("initialize store: %v", err)
	}

	now := time.Now().UnixMilli()
	if _, err := store.DB().Exec(
		`INSERT INTO user (id,username,password,nickname,joinTimestamp,admin) VALUES (?,?,?,?,?,?)`,
		"ADMIN1", "admin", store.DoubleMD5("password"), "Admin", now, 1,
	); err != nil {
		t.Fatalf("insert admin user: %v", err)
	}

	if _, err := store.DB().Exec(
		`INSERT INTO artist (id,name,aliases,createTimestamp) VALUES (?,?,?,?)`,
		"ART001", "Aurora", "", now,
	); err != nil {
		t.Fatalf("insert artist: %v", err)
	}

	// A real asset file the handlers can stat and thumbnail.
	assetDir, assetPath := config.AssetPath(config.AssetTypeArtistPhoto, "pic.jpg")
	if err := os.MkdirAll(assetDir, 0755); err != nil {
		t.Fatalf("mkdir artist photo dir: %v", err)
	}
	writeTestJPEG(t, assetPath)

	return &store.User{ID: "ADMIN1", Admin: 1}, "ART001"
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

func TestAdminCreateArtistPhoto(t *testing.T) {
	admin, artistID := setupArtistPhotoTest(t)

	t.Run("admin can add a photo with description", func(t *testing.T) {
		code, _, data := callPhoto(t, AdminCreateArtistPhoto, http.MethodPost, "/api/admin/artist/photo",
			map[string]any{"artistId": artistID, "asset": "pic.jpg", "description": "Live"},
			admin,
		)
		if code != "success" {
			t.Fatalf("expected success, got %s", code)
		}
		id, _ := data["id"].(string)
		if id == "" {
			t.Fatalf("expected id in response, got %+v", data)
		}
		photos, _ := store.ListArtistPhotos(artistID)
		if len(photos) != 1 {
			t.Fatalf("expected 1 photo, got %d", len(photos))
		}
		if photos[0].Position != 0 || photos[0].Description != "Live" || photos[0].Asset != "pic.jpg" {
			t.Fatalf("unexpected photo row: %+v", photos[0])
		}
		if !strings.HasPrefix(photos[0].Thumbnail, "data:image/jpeg;base64,") {
			t.Fatalf("expected thumbnail data URL, got %q", photos[0].Thumbnail)
		}
	})

	t.Run("next photo is prepended to the front", func(t *testing.T) {
		// asset file is reused — the handler only verifies existence, not uniqueness.
		code, _, _ := callPhoto(t, AdminCreateArtistPhoto, http.MethodPost, "/api/admin/artist/photo",
			map[string]any{"artistId": artistID, "asset": "pic.jpg"},
			admin,
		)
		if code != "success" {
			t.Fatalf("expected success, got %s", code)
		}
		photos, _ := store.ListArtistPhotos(artistID)
		if len(photos) != 2 {
			t.Fatalf("expected 2 photos, got %d", len(photos))
		}
		// 新增写真应排在最前 (position 比现有最小值还要小)
		if photos[0].Position != -1 || photos[0].Description != "" {
			t.Fatalf("expected pos=-1 desc='' for new first photo: %+v", photos[0])
		}
		if photos[1].Position != 0 || photos[1].Description != "Live" {
			t.Fatalf("expected pos=0 desc='Live' for previously-added photo: %+v", photos[1])
		}
	})

	t.Run("rejects when asset is missing", func(t *testing.T) {
		code, _, _ := callPhoto(t, AdminCreateArtistPhoto, http.MethodPost, "/api/admin/artist/photo",
			map[string]any{"artistId": artistID, "asset": "ghost.jpg"},
			admin,
		)
		if code != "asset_not_existed" {
			t.Fatalf("expected asset_not_existed, got %s", code)
		}
	})

	t.Run("rejects when artist is missing", func(t *testing.T) {
		code, _, _ := callPhoto(t, AdminCreateArtistPhoto, http.MethodPost, "/api/admin/artist/photo",
			map[string]any{"artistId": "nope", "asset": "pic.jpg"},
			admin,
		)
		if code != "artist_not_existed" {
			t.Fatalf("expected artist_not_existed, got %s", code)
		}
	})

	t.Run("rejects when description is too long", func(t *testing.T) {
		long := strings.Repeat("x", artistPhotoDescriptionMaxLen+1)
		code, _, _ := callPhoto(t, AdminCreateArtistPhoto, http.MethodPost, "/api/admin/artist/photo",
			map[string]any{"artistId": artistID, "asset": "pic.jpg", "description": long},
			admin,
		)
		if code != "wrong_parameter" {
			t.Fatalf("expected wrong_parameter, got %s", code)
		}
	})
}

func TestAdminUpdateArtistPhoto(t *testing.T) {
	admin, artistID := setupArtistPhotoTest(t)
	id, err := store.CreateArtistPhoto(artistID, "pic.jpg", "old")
	if err != nil {
		t.Fatalf("seed photo: %v", err)
	}

	t.Run("admin updates description", func(t *testing.T) {
		code, _, _ := callPhoto(t, AdminUpdateArtistPhoto, http.MethodPut, "/api/admin/artist/photo",
			map[string]any{"id": id, "description": "new"}, admin,
		)
		if code != "success" {
			t.Fatalf("expected success, got %s", code)
		}
		p, _ := store.GetArtistPhoto(id)
		if p.Description != "new" {
			t.Fatalf("expected description=new, got %q", p.Description)
		}
	})

	t.Run("description over max rejected", func(t *testing.T) {
		long := strings.Repeat("y", artistPhotoDescriptionMaxLen+1)
		code, _, _ := callPhoto(t, AdminUpdateArtistPhoto, http.MethodPut, "/api/admin/artist/photo",
			map[string]any{"id": id, "description": long}, admin,
		)
		if code != "wrong_parameter" {
			t.Fatalf("expected wrong_parameter, got %s", code)
		}
	})

	t.Run("missing photo id rejected", func(t *testing.T) {
		code, _, _ := callPhoto(t, AdminUpdateArtistPhoto, http.MethodPut, "/api/admin/artist/photo",
			map[string]any{"id": "ghost", "description": "x"}, admin,
		)
		if code != "wrong_parameter" {
			t.Fatalf("expected wrong_parameter, got %s", code)
		}
	})
}

func TestAdminDeleteArtistPhoto(t *testing.T) {
	admin, artistID := setupArtistPhotoTest(t)
	id1, _ := store.CreateArtistPhoto(artistID, "pic.jpg", "")
	id2, _ := store.CreateArtistPhoto(artistID, "pic.jpg", "")
	id3, _ := store.CreateArtistPhoto(artistID, "pic.jpg", "")

	t.Run("admin deletes middle photo, gap remains", func(t *testing.T) {
		code, _, _ := callPhoto(t, AdminDeleteArtistPhoto, http.MethodDelete, "/api/admin/artist/photo",
			map[string]any{"id": id2}, admin,
		)
		if code != "success" {
			t.Fatalf("expected success, got %s", code)
		}
		photos, _ := store.ListArtistPhotos(artistID)
		if len(photos) != 2 {
			t.Fatalf("expected 2 photos, got %d", len(photos))
		}
		// 写真按 position 升序返回. 由于 Create 使用 min-1 前置, 三张写真依次得到 0/-1/-2;
		// 删除中间的 id2 (position=-1) 后, 剩余位置 -2 和 0 之间的间隙保留.
		if photos[0].ID != id3 || photos[0].Position != -2 {
			t.Fatalf("unexpected first photo: %+v", photos[0])
		}
		if photos[1].ID != id1 || photos[1].Position != 0 {
			t.Fatalf("unexpected second photo: %+v", photos[1])
		}
	})
}

func TestAdminReorderArtistPhotos(t *testing.T) {
	admin, artistID := setupArtistPhotoTest(t)
	id1, _ := store.CreateArtistPhoto(artistID, "pic.jpg", "")
	id2, _ := store.CreateArtistPhoto(artistID, "pic.jpg", "")
	id3, _ := store.CreateArtistPhoto(artistID, "pic.jpg", "")

	t.Run("admin can reorder, first becomes avatar", func(t *testing.T) {
		code, _, _ := callPhoto(t, AdminReorderArtistPhotos, http.MethodPut, "/api/admin/artist/photo/order",
			map[string]any{"artistId": artistID, "ids": []string{id3, id1, id2}}, admin,
		)
		if code != "success" {
			t.Fatalf("expected success, got %s", code)
		}
		photos, _ := store.ListArtistPhotos(artistID)
		if len(photos) != 3 ||
			photos[0].ID != id3 ||
			photos[1].ID != id1 ||
			photos[2].ID != id2 {
			t.Fatalf("unexpected order: %+v", photos)
		}
	})

	t.Run("rejects when ids set mismatches", func(t *testing.T) {
		code, _, _ := callPhoto(t, AdminReorderArtistPhotos, http.MethodPut, "/api/admin/artist/photo/order",
			map[string]any{"artistId": artistID, "ids": []string{id3, id1}}, admin,
		)
		if code != "wrong_parameter" {
			t.Fatalf("expected wrong_parameter, got %s", code)
		}
	})

	t.Run("rejects duplicate ids", func(t *testing.T) {
		code, _, _ := callPhoto(t, AdminReorderArtistPhotos, http.MethodPut, "/api/admin/artist/photo/order",
			map[string]any{"artistId": artistID, "ids": []string{id1, id1, id2}}, admin,
		)
		if code != "wrong_parameter" {
			t.Fatalf("expected wrong_parameter, got %s", code)
		}
	})
}
