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

func TestGetUser(t *testing.T) {
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
		`INSERT INTO user (id,username,password,nickname,avatar,joinTimestamp) VALUES (?,?,?,?,?,?)`,
		"user-1", "creator", store.DoubleMD5("password"), "Creator", "avatar.jpg", now,
	); err != nil {
		t.Fatalf("insert user-1: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO user (id,username,password,nickname,joinTimestamp) VALUES (?,?,?,?,?)`,
		"viewer", "viewer", store.DoubleMD5("password"), "Viewer", now,
	); err != nil {
		t.Fatalf("insert viewer: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO singer (id,name,aliases,createUserId,createTimestamp) VALUES (?,?,?,?,?)`,
		"singer-1", "Singer", joinAliases([]string{"Singer Alias"}), "user-1", now,
	); err != nil {
		t.Fatalf("insert singer: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO music (id,type,name,aliases,cover,asset,createUserId,createTimestamp) VALUES (?,?,?,?,?,?,?,?)`,
		"music-1", int(store.MusicTypeSong), "Song", joinAliases([]string{"Song Alias"}), "cover.jpg", "song.mp3", "user-1", now,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}
	if err := store.LinkMusicSingers("music-1", []string{"singer-1"}); err != nil {
		t.Fatalf("link music singers: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO musicbill (id,userId,cover,name,public,createTimestamp) VALUES
			('public-mb','user-1','public.jpg','Public',1,?),
			('private-mb','user-1','private.jpg','Private',0,?)`,
		now, now,
	); err != nil {
		t.Fatalf("insert musicbills: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO musicbill_music (musicbillId,musicId,addTimestamp) VALUES (?,?,?)`,
		"public-mb", "music-1", now,
	); err != nil {
		t.Fatalf("insert musicbill music: %v", err)
	}

	t.Run("requires userId", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest(http.MethodGet, "/api/user", nil)
		c.Set("authed_user", &store.User{ID: "viewer"})

		GetUser(c)

		var resp struct {
			Code string `json:"code"`
		}
		if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
			t.Fatalf("decode response: %v", err)
		}
		if resp.Code != "wrong_parameter" {
			t.Fatalf("expected wrong_parameter, got %s", resp.Code)
		}
	})

	t.Run("returns public profile drawer payload", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest(http.MethodGet, "/api/user?userId=user-1", nil)
		c.Set("authed_user", &store.User{ID: "viewer"})

		GetUser(c)

		var resp struct {
			Code string `json:"code"`
			Data struct {
				ID            string `json:"id"`
				Username      string `json:"username"`
				Nickname      string `json:"nickname"`
				Avatar        string `json:"avatar"`
				JoinTimestamp int64  `json:"joinTimestamp"`
				MusicbillList []struct {
					ID         string `json:"id"`
					Cover      string `json:"cover"`
					Name       string `json:"name"`
					MusicCount int    `json:"musicCount"`
				} `json:"musicbillList"`
			} `json:"data"`
		}
		if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
			t.Fatalf("decode response: %v", err)
		}
		var rawResp struct {
			Data map[string]json.RawMessage `json:"data"`
		}
		if err := json.Unmarshal(w.Body.Bytes(), &rawResp); err != nil {
			t.Fatalf("decode raw response: %v", err)
		}

		if resp.Code != "success" {
			t.Fatalf("unexpected code: %s", resp.Code)
		}
		if _, ok := rawResp.Data["musicList"]; ok {
			t.Fatalf("user payload should not include musicList: %s", string(rawResp.Data["musicList"]))
		}
		if resp.Data.ID != "user-1" || resp.Data.Username != "creator" || resp.Data.Nickname != "Creator" {
			t.Fatalf("unexpected user payload: %+v", resp.Data)
		}
		if resp.Data.Avatar != "/asset/user_avatar/avatar.jpg" {
			t.Fatalf("unexpected avatar: %s", resp.Data.Avatar)
		}
		if resp.Data.JoinTimestamp != now {
			t.Fatalf("unexpected join timestamp: %d", resp.Data.JoinTimestamp)
		}
		if len(resp.Data.MusicbillList) != 1 || resp.Data.MusicbillList[0].ID != "public-mb" {
			t.Fatalf("unexpected musicbill list: %+v", resp.Data.MusicbillList)
		}
		if resp.Data.MusicbillList[0].MusicCount != 1 {
			t.Fatalf("unexpected music count: %d", resp.Data.MusicbillList[0].MusicCount)
		}
	})
}
