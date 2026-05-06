package handler

import (
	"cicada/internal/config"
	"cicada/internal/store"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

func TestGetLyricList(t *testing.T) {
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
		`INSERT INTO user (id,username,password,nickname,joinTimestamp) VALUES (?,?,?,?,?)`,
		"1", "tester", store.DoubleMD5("password"), "Tester", now,
	); err != nil {
		t.Fatalf("insert user: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO music (id,type,name,asset,createUserId,createTimestamp) VALUES (?,?,?,?,?,?)`,
		"song-1", int(store.MusicTypeSong), "Song", "song.mp3", "1", now,
	); err != nil {
		t.Fatalf("insert song: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO lyric (musicId,lrc,lrcContent) VALUES (?,?,?)`,
		"song-1", "[00:00.00]hello", "hello",
	); err != nil {
		t.Fatalf("insert lyric: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO music (id,type,name,asset,createUserId,createTimestamp) VALUES (?,?,?,?,?,?)`,
		"song-empty", int(store.MusicTypeSong), "Song Empty", "song-empty.mp3", "1", now,
	); err != nil {
		t.Fatalf("insert song without lyric: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO music (id,type,name,asset,createUserId,createTimestamp) VALUES (?,?,?,?,?,?)`,
		"inst-1", int(store.MusicTypeInstrumental), "Instrumental", "inst.mp3", "1", now,
	); err != nil {
		t.Fatalf("insert instrumental: %v", err)
	}

	t.Run("song returns stored lyrics", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest(http.MethodGet, "/api/lyric_list?musicId=song-1", nil)

		GetLyricList(c)

		var resp struct {
			Code string `json:"code"`
			Data []struct {
				ID  int64  `json:"id"`
				LRC string `json:"lrc"`
			} `json:"data"`
		}
		if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
			t.Fatalf("decode response: %v", err)
		}
		if resp.Code != "success" {
			t.Fatalf("unexpected code: %s", resp.Code)
		}
		if len(resp.Data) != 1 || resp.Data[0].LRC != "[00:00.00]hello" {
			t.Fatalf("unexpected lyric payload: %+v", resp.Data)
		}
	})

	t.Run("song without lyrics returns empty list", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest(http.MethodGet, "/api/lyric_list?musicId=song-empty", nil)

		GetLyricList(c)

		var resp struct {
			Code string `json:"code"`
			Data []struct {
				ID  int64  `json:"id"`
				LRC string `json:"lrc"`
			} `json:"data"`
		}
		if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
			t.Fatalf("decode response: %v", err)
		}
		if resp.Code != "success" {
			t.Fatalf("unexpected code: %s", resp.Code)
		}
		if len(resp.Data) != 0 {
			t.Fatalf("expected empty lyric list, got %+v", resp.Data)
		}
	})

	t.Run("instrumental returns no lyric error", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest(http.MethodGet, "/api/lyric_list?musicId=inst-1", nil)

		GetLyricList(c)

		var resp struct {
			Code string `json:"code"`
		}
		if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
			t.Fatalf("decode response: %v", err)
		}
		if resp.Code != "instrumental_has_no_lyric" {
			t.Fatalf("unexpected code: %s", resp.Code)
		}
	})
}

func TestSearchMusicByLyricIncludesLyrics(t *testing.T) {
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
		"1", "tester", store.DoubleMD5("password"), "Tester", now,
	); err != nil {
		t.Fatalf("insert user: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO music (id,type,name,asset,createUserId,createTimestamp) VALUES (?,?,?,?,?,?)`,
		"song-1", int(store.MusicTypeSong), "Song", "song.mp3", "1", now,
	); err != nil {
		t.Fatalf("insert song: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO lyric (musicId,lrc,lrcContent) VALUES (?,?,?)`,
		"song-1", "[00:00.00]hello world", "hello world",
	); err != nil {
		t.Fatalf("insert lyric: %v", err)
	}

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/music/search_by_lyric?keyword=hello&page=1&pageSize=10", nil)

	SearchMusicByLyric(c)

	var resp struct {
		Code string `json:"code"`
		Data struct {
			Total     int `json:"total"`
			MusicList []struct {
				ID     string `json:"id"`
				Lyrics []struct {
					ID  int64  `json:"id"`
					LRC string `json:"lrc"`
				} `json:"lyrics"`
			} `json:"musicList"`
		} `json:"data"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.Code != "success" {
		t.Fatalf("unexpected code: %s", resp.Code)
	}
	if resp.Data.Total != 1 || len(resp.Data.MusicList) != 1 {
		t.Fatalf("unexpected music list: %+v", resp.Data)
	}
	if resp.Data.MusicList[0].ID != "song-1" {
		t.Fatalf("unexpected music item: %+v", resp.Data.MusicList[0])
	}
	if len(resp.Data.MusicList[0].Lyrics) != 1 || resp.Data.MusicList[0].Lyrics[0].LRC != "[00:00.00]hello world" {
		t.Fatalf("unexpected lyrics: %+v", resp.Data.MusicList[0].Lyrics)
	}
}
