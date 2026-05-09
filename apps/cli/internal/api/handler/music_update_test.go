package handler

import (
	"bytes"
	"cicada/internal/config"
	"cicada/internal/store"
	"encoding/json"
	"net/http"
	"net/http/httptest"
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
		Mode:      config.ModeProduction,
		Data:      t.TempDir(),
		Port:      8000,
		JWTExpiry: int64(180 * 24 * 60 * 60 * 1000),
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
		`INSERT INTO music (id,type,name,asset,createUserId,createTimestamp) VALUES (?,?,?,?,?,?)`,
		"music-1", int(store.MusicTypeSong), "Song", "missing.mp3", "user-1", now,
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
	c.Request = httptest.NewRequest(http.MethodPut, "/api/music", bytes.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Set("authed_user", &store.User{ID: "user-1"})

	UpdateMusic(c)

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
		Mode:      config.ModeProduction,
		Data:      t.TempDir(),
		Port:      8000,
		JWTExpiry: int64(180 * 24 * 60 * 60 * 1000),
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
		`INSERT INTO music (id,type,name,asset,createUserId,createTimestamp) VALUES (?,?,?,?,?,?)`,
		"music-1", int(store.MusicTypeInstrumental), "Instrumental", "missing.mp3", "user-1", now,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}

	body := []byte(`{"id":"music-1","key":"lyric","value":["[00:00.00]hello"]}`)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPut, "/api/music", bytes.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Set("authed_user", &store.User{ID: "user-1"})

	UpdateMusic(c)

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
