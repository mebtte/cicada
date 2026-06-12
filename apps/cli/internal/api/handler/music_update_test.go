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
	if _, err := store.DB().Exec(
		`INSERT INTO lyric (musicId,lrc,lrcContent) VALUES (?,?,?)`,
		"MUS001", "[00:00.00]old", "old",
	); err != nil {
		t.Fatalf("insert old lyric: %v", err)
	}

	body := []byte(`{"id":"MUS001","key":"lyric","value":[" [00:00.00]hello world ","[00:01.00]second line"]}`)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPut, "/api/admin/music", bytes.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Set("authed_user", &store.User{ID: "USER01", Admin: 1})

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

	lyrics, err := store.GetLyricsByMusicID("MUS001")
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
		"USER01", "creator", store.DoubleMD5("password"), "Creator", now,
	); err != nil {
		t.Fatalf("insert user: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO music (id,type,name,asset,createTimestamp) VALUES (?,?,?,?,?)`,
		"MUS001", int(store.MusicTypeInstrumental), "Instrumental", "missing.mp3", now,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}

	body := []byte(`{"id":"MUS001","key":"lyric","value":["[00:00.00]hello"]}`)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPut, "/api/admin/music", bytes.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Set("authed_user", &store.User{ID: "USER01", Admin: 1})

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

func TestUpdateMusicLyricistsRejectsInstrumentalAndAllowsClear(t *testing.T) {
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
		`INSERT INTO artist (id,name,createTimestamp) VALUES (?,?,?)`,
		"ART001", "Writer", now,
	); err != nil {
		t.Fatalf("insert artist: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO music (id,type,name,asset,createTimestamp) VALUES (?,?,?,?,?)`,
		"MUS001", int(store.MusicTypeInstrumental), "Instrumental", "missing.mp3", now,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}

	call := func(value []string) string {
		t.Helper()

		body, err := json.Marshal(map[string]any{
			"id":    "MUS001",
			"key":   "lyricists",
			"value": value,
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

		var resp struct {
			Code string `json:"code"`
		}
		if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
			t.Fatalf("decode response: %v", err)
		}
		return resp.Code
	}

	if code := call([]string{"ART001"}); code != apperr.InstrumentalHasNoLyricist {
		t.Fatalf("expected %s, got %s", apperr.InstrumentalHasNoLyricist, code)
	}
	if err := store.ReplaceMusicArtistsByRole("MUS001", store.MusicArtistRoleLyricist, []string{"ART001"}); err != nil {
		t.Fatalf("link legacy lyricist: %v", err)
	}
	if code := call([]string{}); code != apperr.Success {
		t.Fatalf("expected %s while clearing, got %s", apperr.Success, code)
	}
	var count int
	if err := store.DB().QueryRow(`SELECT COUNT(1) FROM music_artist_relation WHERE musicId=? AND role='lyricist'`, "MUS001").Scan(&count); err != nil {
		t.Fatalf("count lyricists: %v", err)
	}
	if count != 0 {
		t.Fatalf("expected lyricists cleared, got %d", count)
	}
}

func TestUpdateMusicTypeToInstrumentalClearsLyricsAndLyricists(t *testing.T) {
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
		`INSERT INTO artist (id,name,createTimestamp) VALUES (?,?,?)`,
		"ART001", "Writer", now,
	); err != nil {
		t.Fatalf("insert artist: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO music (id,type,name,asset,createTimestamp) VALUES (?,?,?,?,?)`,
		"MUS001", int(store.MusicTypeSong), "Song", "missing.mp3", now,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO lyric (musicId,lrc,lrcContent) VALUES (?,?,?)`,
		"MUS001", "[00:00.00]old", "old",
	); err != nil {
		t.Fatalf("insert lyric: %v", err)
	}
	if err := store.ReplaceMusicArtistsByRole("MUS001", store.MusicArtistRoleLyricist, []string{"ART001"}); err != nil {
		t.Fatalf("link lyricist: %v", err)
	}

	body, err := json.Marshal(map[string]any{
		"id":    "MUS001",
		"key":   "type",
		"value": int(store.MusicTypeInstrumental),
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

	var resp struct {
		Code string `json:"code"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.Code != apperr.Success {
		t.Fatalf("unexpected code: %s body=%s", resp.Code, w.Body.String())
	}
	m, err := store.GetMusicByID("MUS001")
	if err != nil {
		t.Fatalf("get music: %v", err)
	}
	if m.Type != store.MusicTypeInstrumental {
		t.Fatalf("expected instrumental type, got %d", m.Type)
	}
	lyrics, err := store.GetLyricsByMusicID("MUS001")
	if err != nil {
		t.Fatalf("get lyrics: %v", err)
	}
	if len(lyrics) != 0 {
		t.Fatalf("expected lyrics cleared, got %+v", lyrics)
	}
	var lyricistCount int
	if err := store.DB().QueryRow(`SELECT COUNT(1) FROM music_artist_relation WHERE musicId=? AND role='lyricist'`, "MUS001").Scan(&lyricistCount); err != nil {
		t.Fatalf("count lyricists: %v", err)
	}
	if lyricistCount != 0 {
		t.Fatalf("expected lyricists cleared, got %d", lyricistCount)
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
		"USER01", "creator", store.DoubleMD5("password"), "Creator", now,
	); err != nil {
		t.Fatalf("insert user: %v", err)
	}
	for _, musicID := range []string{"MUS001", "SRC001", "SRC002", "SRCOLD"} {
		if _, err := store.DB().Exec(
			`INSERT INTO music (id,type,name,asset,createTimestamp) VALUES (?,?,?,?,?)`,
			musicID, int(store.MusicTypeSong), musicID, "missing.mp3", now,
		); err != nil {
			t.Fatalf("insert music %s: %v", musicID, err)
		}
	}
	if _, err := store.DB().Exec(
		`INSERT INTO music_fork (musicId,forkFrom) VALUES (?,?)`,
		"MUS001", "SRCOLD",
	); err != nil {
		t.Fatalf("insert old fork: %v", err)
	}

	body := []byte(`{"id":"MUS001","key":"forkFrom","value":["SRC001","SRC002"]}`)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPut, "/api/admin/music", bytes.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Set("authed_user", &store.User{ID: "USER01", Admin: 1})

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

	forkFroms, err := store.GetMusicForkFroms("MUS001")
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
	if !seen["SRC001"] || !seen["SRC002"] || seen["SRCOLD"] {
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
	coverDir, coverPath := config.AssetPath(config.AssetTypeMusicCover, "cover.jpg")
	if err := os.MkdirAll(coverDir, 0755); err != nil {
		t.Fatalf("mkdir cover dir: %v", err)
	}
	writeTestJPEG(t, coverPath)

	body := []byte(`{"id":"MUS001","key":"cover","value":"cover.jpg"}`)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPut, "/api/admin/music", bytes.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Set("authed_user", &store.User{ID: "USER01", Admin: 1})

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

	m, err := store.GetMusicByID("MUS001")
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

	call := func(value string) string {
		t.Helper()

		body, err := json.Marshal(map[string]any{
			"id":    "MUS001",
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
		c.Set("authed_user", &store.User{ID: "USER01", Admin: 1})

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
	if err := store.DB().QueryRow(`SELECT searchKeywords FROM music WHERE id=?`, "MUS001").Scan(&stored); err != nil {
		t.Fatalf("read searchKeywords: %v", err)
	}
	if stored != "hidden token\nzjl" {
		t.Fatalf("unexpected stored searchKeywords: %q", stored)
	}

	if code := call(strings.Repeat("歌", searchKeywordsMaxLength+1)); code != "wrong_parameter" {
		t.Fatalf("expected wrong_parameter for overlong searchKeywords, got %s", code)
	}
}

func TestUpdateMusicComposers(t *testing.T) {
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
		`INSERT INTO artist (id,name,createTimestamp) VALUES
			('ART001','Mozart',?),
			('ART002','Bach',?)`,
		now, now,
	); err != nil {
		t.Fatalf("insert artists: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO music (id,type,name,asset,createTimestamp) VALUES (?,?,?,?,?)`,
		"MUS001", int(store.MusicTypeSong), "Song", "missing.mp3", now,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}
	// Seed an existing composer link to verify the handler replaces it.
	if err := store.ReplaceMusicArtistsByRole("MUS001", store.MusicArtistRoleComposer, []string{"ART001"}); err != nil {
		t.Fatalf("seed composer: %v", err)
	}

	body := []byte(`{"id":"MUS001","key":"composers","value":["ART002"]}`)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPut, "/api/admin/music", bytes.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Set("authed_user", &store.User{ID: "USER01", Admin: 1})

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

	composers, err := store.GetArtistsInMusicIDsByRole([]string{"MUS001"}, store.MusicArtistRoleComposer)
	if err != nil {
		t.Fatalf("get composers: %v", err)
	}
	if len(composers) != 1 || composers[0].ID != "ART002" {
		t.Fatalf("expected only ART002 linked as composer, got %+v", composers)
	}

	// Unknown artist id should fail validation.
	body = []byte(`{"id":"MUS001","key":"composers","value":["ghost"]}`)
	w = httptest.NewRecorder()
	c, _ = gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPut, "/api/admin/music", bytes.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Set("authed_user", &store.User{ID: "USER01", Admin: 1})

	AdminUpdateMusic(c)
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.Code != "artist_not_existed" {
		t.Fatalf("expected artist_not_existed for unknown artist, got %s", resp.Code)
	}
}
