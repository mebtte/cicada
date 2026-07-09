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

func TestUpdateMusicbillCoverStoresThumbnail(t *testing.T) {
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
		`INSERT INTO musicbill (id,userId,name,createTimestamp) VALUES (?,?,?,?)`,
		"BILL01", "USER01", "Bill", now,
	); err != nil {
		t.Fatalf("insert musicbill: %v", err)
	}
	coverDir, coverPath := config.AssetPath(config.AssetTypeMusicbillCover, "cover.jpg")
	if err := os.MkdirAll(coverDir, 0755); err != nil {
		t.Fatalf("mkdir cover dir: %v", err)
	}
	writeTestJPEG(t, coverPath)

	body := []byte(`{"id":"BILL01","key":"cover","value":"cover.jpg"}`)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPut, "/api/common/musicbill", bytes.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Set("authed_user", &store.User{ID: "USER01"})

	UpdateMusicbill(c)

	var resp struct {
		Code string `json:"code"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.Code != "success" {
		t.Fatalf("unexpected code: %s body=%s", resp.Code, w.Body.String())
	}

	mb, err := store.GetMusicbillByID("BILL01")
	if err != nil {
		t.Fatalf("get musicbill: %v", err)
	}
	if mb.Cover != "cover.jpg" {
		t.Fatalf("expected cover.jpg, got %q", mb.Cover)
	}
	if !strings.HasPrefix(mb.CoverThumbnail, "data:image/jpeg;base64,") {
		t.Fatalf("expected cover thumbnail data URL, got %q", mb.CoverThumbnail)
	}
}
