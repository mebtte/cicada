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

func TestUpdateMusicLyric(t *testing.T) {
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
		"user-1", "creator", store.DoubleMD5("password"), "Creator", now,
	); err != nil {
		t.Fatalf("insert user: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO music (id,type,name,asset,createTimestamp) VALUES (?,?,?,?,?)`,
		"music-1", int(store.MusicTypeSong), "Song", "missing.mp3", now,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO lyric (musicId,lrc,lrcContent) VALUES (?,?,?)`,
		"music-1", "[00:00.00]old", "old",
	); err != nil {
		t.Fatalf("insert old lyric: %v", err)
	}

	body := []byte(`{"id":"music-1","key":"lyric","value":[" [00:00.00]hello world ","[00:01.00]second line"]}`)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPut, "/api/admin/music", bytes.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Set("authed_user", &store.User{ID: "user-1", Admin: 1})

	AdminUpdateMusic(c)

	var resp struct {
		Code string `json:"code"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.Code != "success" {
		t.Fatalf("unexpected code: %s body=%s", resp.Code, w.Body.String())
	}

	lyrics, err := store.GetLyricsByMusicID("music-1")
	if err != nil {
		t.Fatalf("get lyrics: %v", err)
	}
	if len(lyrics) != 2 {
		t.Fatalf("expected 2 lyrics, got %+v", lyrics)
	}
	if lyrics[0].LRC != "[00:00.00]hello world" || lyrics[0].LRCContent != "hello world" {
		t.Fatalf("unexpected first lyric: %+v", lyrics[0])
	}
}

func TestUpdateMusicLyricRejectsInstrumental(t *testing.T) {
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
		"user-1", "creator", store.DoubleMD5("password"), "Creator", now,
	); err != nil {
		t.Fatalf("insert user: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO music (id,type,name,asset,createTimestamp) VALUES (?,?,?,?,?)`,
		"music-1", int(store.MusicTypeInstrumental), "Instrumental", "missing.mp3", now,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}

	body := []byte(`{"id":"music-1","key":"lyric","value":["[00:00.00]hello"]}`)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPut, "/api/admin/music", bytes.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Set("authed_user", &store.User{ID: "user-1", Admin: 1})

	AdminUpdateMusic(c)

	var resp struct {
		Code string `json:"code"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.Code != "instrumental_has_no_lyric" {
		t.Fatalf("unexpected code: %s body=%s", resp.Code, w.Body.String())
	}
}

func TestUpdateMusicForkFrom(t *testing.T) {
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
		"user-1", "creator", store.DoubleMD5("password"), "Creator", now,
	); err != nil {
		t.Fatalf("insert user: %v", err)
	}
	for _, musicID := range []string{"music-1", "source-1", "source-2", "old-source"} {
		if _, err := store.DB().Exec(
			`INSERT INTO music (id,type,name,asset,createTimestamp) VALUES (?,?,?,?,?)`,
			musicID, int(store.MusicTypeSong), musicID, "missing.mp3", now,
		); err != nil {
			t.Fatalf("insert music %s: %v", musicID, err)
		}
	}
	if _, err := store.DB().Exec(
		`INSERT INTO music_fork (musicId,forkFrom) VALUES (?,?)`,
		"music-1", "old-source",
	); err != nil {
		t.Fatalf("insert old fork: %v", err)
	}

	body := []byte(`{"id":"music-1","key":"forkFrom","value":["source-1","source-2"]}`)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPut, "/api/admin/music", bytes.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Set("authed_user", &store.User{ID: "user-1", Admin: 1})

	AdminUpdateMusic(c)

	var resp struct {
		Code string `json:"code"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.Code != "success" {
		t.Fatalf("unexpected code: %s body=%s", resp.Code, w.Body.String())
	}

	forkFroms, err := store.GetMusicForkFroms("music-1")
	if err != nil {
		t.Fatalf("get fork-froms: %v", err)
	}
	if len(forkFroms) != 2 {
		t.Fatalf("expected 2 fork-from rows, got %+v", forkFroms)
	}
	seen := map[string]bool{}
	for _, forkFrom := range forkFroms {
		seen[forkFrom.ForkFrom] = true
	}
	if !seen["source-1"] || !seen["source-2"] || seen["old-source"] {
		t.Fatalf("unexpected fork-from rows: %+v", forkFroms)
	}
}

func TestUpdateMusicCoverStoresThumbnail(t *testing.T) {
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
		"user-1", "creator", store.DoubleMD5("password"), "Creator", now,
	); err != nil {
		t.Fatalf("insert user: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO music (id,type,name,asset,createTimestamp) VALUES (?,?,?,?,?)`,
		"music-1", int(store.MusicTypeSong), "Song", "missing.mp3", now,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}
	coverDir, coverPath := config.AssetPath(config.AssetTypeMusicCover, "cover.jpg")
	if err := os.MkdirAll(coverDir, 0755); err != nil {
		t.Fatalf("mkdir cover dir: %v", err)
	}
	writeTestJPEG(t, coverPath)

	body := []byte(`{"id":"music-1","key":"cover","value":"cover.jpg"}`)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPut, "/api/admin/music", bytes.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Set("authed_user", &store.User{ID: "user-1", Admin: 1})

	AdminUpdateMusic(c)

	var resp struct {
		Code string `json:"code"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.Code != "success" {
		t.Fatalf("unexpected code: %s body=%s", resp.Code, w.Body.String())
	}

	m, err := store.GetMusicByID("music-1")
	if err != nil {
		t.Fatalf("get music: %v", err)
	}
	if m.Cover != "cover.jpg" {
		t.Fatalf("expected cover.jpg, got %q", m.Cover)
	}
	if !strings.HasPrefix(m.CoverThumbnail, "data:image/jpeg;base64,") {
		t.Fatalf("expected cover thumbnail data URL, got %q", m.CoverThumbnail)
	}
}

func TestUpdateMusicSearchKeywords(t *testing.T) {
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
		"user-1", "creator", store.DoubleMD5("password"), "Creator", now,
	); err != nil {
		t.Fatalf("insert user: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO music (id,type,name,asset,createTimestamp) VALUES (?,?,?,?,?)`,
		"music-1", int(store.MusicTypeSong), "Song", "missing.mp3", now,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}

	call := func(value string) string {
		t.Helper()

		body, err := json.Marshal(map[string]any{
			"id":    "music-1",
			"key":   "searchKeywords",
			"value": value,
		})
		if err != nil {
			t.Fatalf("marshal body: %v", err)
		}
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest(http.MethodPut, "/api/admin/music", bytes.NewReader(body))
		c.Request.Header.Set("Content-Type", "application/json")
		c.Set("authed_user", &store.User{ID: "user-1", Admin: 1})

		AdminUpdateMusic(c)

		var resp struct {
			Code string `json:"code"`
		}
		if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
			t.Fatalf("decode response: %v", err)
		}
		return resp.Code
	}

	if code := call("  hidden token\nzjl  "); code != "success" {
		t.Fatalf("expected success, got %s", code)
	}
	var stored string
	if err := store.DB().QueryRow(`SELECT searchKeywords FROM music WHERE id=?`, "music-1").Scan(&stored); err != nil {
		t.Fatalf("read searchKeywords: %v", err)
	}
	if stored != "hidden token\nzjl" {
		t.Fatalf("unexpected stored searchKeywords: %q", stored)
	}

	if code := call(strings.Repeat("歌", searchKeywordsMaxLength+1)); code != "wrong_parameter" {
		t.Fatalf("expected wrong_parameter for overlong searchKeywords, got %s", code)
	}
}
