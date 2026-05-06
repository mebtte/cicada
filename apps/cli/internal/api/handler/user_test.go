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

	t.Run("requires uid", func(t *testing.T) {
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
		c.Request = httptest.NewRequest(http.MethodGet, "/api/user?uid=user-1", nil)
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
				MusicList []struct {
					ID      string   `json:"id"`
					Type    int      `json:"type"`
					Name    string   `json:"name"`
					Aliases []string `json:"aliases"`
					Cover   string   `json:"cover"`
					Asset   string   `json:"asset"`
					Singers []struct {
						ID      string   `json:"id"`
						Name    string   `json:"name"`
						Aliases []string `json:"aliases"`
					} `json:"singers"`
				} `json:"musicList"`
			} `json:"data"`
		}
		if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
			t.Fatalf("decode response: %v", err)
		}

		if resp.Code != "success" {
			t.Fatalf("unexpected code: %s", resp.Code)
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
		if len(resp.Data.MusicList) != 1 || resp.Data.MusicList[0].ID != "music-1" {
			t.Fatalf("unexpected music list: %+v", resp.Data.MusicList)
		}
		if resp.Data.MusicList[0].Cover != "/asset/music_cover/cover.jpg" ||
			resp.Data.MusicList[0].Asset != "/asset/music/song.mp3" {
			t.Fatalf("unexpected music assets: %+v", resp.Data.MusicList[0])
		}
		if len(resp.Data.MusicList[0].Aliases) != 1 || resp.Data.MusicList[0].Aliases[0] != "Song Alias" {
			t.Fatalf("unexpected music aliases: %+v", resp.Data.MusicList[0].Aliases)
		}
		if len(resp.Data.MusicList[0].Singers) != 1 ||
			resp.Data.MusicList[0].Singers[0].Aliases[0] != "Singer Alias" {
			t.Fatalf("unexpected singers: %+v", resp.Data.MusicList[0].Singers)
		}
	})
}
