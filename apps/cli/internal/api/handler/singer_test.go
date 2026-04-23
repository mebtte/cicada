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

func TestGetSinger(t *testing.T) {
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
	insertUser := func(id, username, nickname string) {
		t.Helper()
		if _, err := store.DB().Exec(
			`INSERT INTO user (id,username,password,nickname,joinTimestamp) VALUES (?,?,?,?,?)`,
			id, username, store.DoubleMD5("password"), nickname, now,
		); err != nil {
			t.Fatalf("insert user %s: %v", id, err)
		}
	}
	insertUser("user-1", "creator", "Creator")
	insertUser("user-2", "viewer", "Viewer")

	if _, err := store.DB().Exec(
		`INSERT INTO singer (id,avatar,name,aliases,createUserId,createTimestamp) VALUES (?,?,?,?,?,?)`,
		"singer-1", "creator.jpg", "Creator Singer", joinAliases([]string{"Alias A", "Alias B"}), "user-1", now,
	); err != nil {
		t.Fatalf("insert singer-1: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO singer (id,avatar,name,aliases,createUserId,createTimestamp) VALUES (?,?,?,?,?,?)`,
		"singer-2", "guest.jpg", "Guest Singer", joinAliases([]string{"Guest Alias"}), "user-2", now,
	); err != nil {
		t.Fatalf("insert singer-2: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO music (id,type,name,aliases,cover,asset,createUserId,createTimestamp) VALUES (?,?,?,?,?,?,?,?)`,
		"music-1", int(store.MusicTypeSong), "Song 1", joinAliases([]string{"Song Alias"}), "cover.jpg", "song.mp3", "user-1", now,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}
	if err := store.LinkMusicSingers("music-1", []string{"singer-1", "singer-2"}); err != nil {
		t.Fatalf("link music singers: %v", err)
	}

	type response struct {
		Code string `json:"code"`
		Data struct {
			ID         string   `json:"id"`
			Name       string   `json:"name"`
			Aliases    []string `json:"aliases"`
			Avatar     string   `json:"avatar"`
			Editable   bool     `json:"editable"`
			CreateUser struct {
				ID       string `json:"id"`
				Nickname string `json:"nickname"`
			} `json:"createUser"`
			MusicList []struct {
				ID      string   `json:"id"`
				Name    string   `json:"name"`
				Aliases []string `json:"aliases"`
				Cover   string   `json:"cover"`
				Asset   string   `json:"asset"`
				Singers []struct {
					ID      string   `json:"id"`
					Name    string   `json:"name"`
					Aliases []string `json:"aliases"`
					Avatar  string   `json:"avatar"`
				} `json:"singers"`
			} `json:"musicList"`
		} `json:"data"`
	}

	getSinger := func(userID string, admin int) response {
		t.Helper()

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest(http.MethodGet, "/api/singer?id=singer-1", nil)
		c.Set("authed_user", &store.User{ID: userID, Admin: admin})

		GetSinger(c)

		var resp response
		if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
			t.Fatalf("decode response: %v", err)
		}
		return resp
	}

	t.Run("returns the full singer detail payload", func(t *testing.T) {
		resp := getSinger("user-1", 0)
		if resp.Code != "success" {
			t.Fatalf("unexpected code: %s", resp.Code)
		}
		if resp.Data.ID != "singer-1" || resp.Data.Name != "Creator Singer" {
			t.Fatalf("unexpected singer payload: %+v", resp.Data)
		}
		if len(resp.Data.Aliases) != 2 || resp.Data.Aliases[0] != "Alias A" {
			t.Fatalf("unexpected aliases: %+v", resp.Data.Aliases)
		}
		if resp.Data.CreateUser.ID != "user-1" || resp.Data.CreateUser.Nickname != "Creator" {
			t.Fatalf("unexpected createUser: %+v", resp.Data.CreateUser)
		}
		if !resp.Data.Editable {
			t.Fatalf("expected editable for creator")
		}
		if len(resp.Data.MusicList) != 1 {
			t.Fatalf("unexpected musicList: %+v", resp.Data.MusicList)
		}
		music := resp.Data.MusicList[0]
		if music.ID != "music-1" || music.Name != "Song 1" {
			t.Fatalf("unexpected music item: %+v", music)
		}
		if len(music.Aliases) != 1 || music.Aliases[0] != "Song Alias" {
			t.Fatalf("unexpected music aliases: %+v", music.Aliases)
		}
		if len(music.Singers) != 2 {
			t.Fatalf("unexpected nested singers: %+v", music.Singers)
		}
		guestFound := false
		for _, singer := range music.Singers {
			if singer.ID == "singer-2" {
				guestFound = true
				if singer.Name != "Guest Singer" {
					t.Fatalf("unexpected guest singer: %+v", singer)
				}
				if len(singer.Aliases) != 1 || singer.Aliases[0] != "Guest Alias" {
					t.Fatalf("unexpected guest singer aliases: %+v", singer.Aliases)
				}
			}
		}
		if !guestFound {
			t.Fatalf("guest singer not found in nested singer list: %+v", music.Singers)
		}
	})

	t.Run("marks non-owner as not editable", func(t *testing.T) {
		resp := getSinger("user-2", 0)
		if resp.Code != "success" {
			t.Fatalf("unexpected code: %s", resp.Code)
		}
		if resp.Data.Editable {
			t.Fatalf("expected non-owner to be non-editable")
		}
	})
}
