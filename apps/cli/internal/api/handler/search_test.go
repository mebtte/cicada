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

func TestSearchHandlersRequireKeyword(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name    string
		path    string
		handler func(*gin.Context)
	}{
		{
			name:    "music",
			path:    "/api/music/search?page=1&pageSize=10",
			handler: SearchMusic,
		},
		{
			name:    "singer",
			path:    "/api/singer/search?keyword=%20%20%20&page=1&pageSize=10",
			handler: SearchSinger,
		},
		{
			name:    "public_musicbill",
			path:    "/api/public_musicbill/search?page=1&pageSize=10",
			handler: SearchPublicMusicbill,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = httptest.NewRequest(http.MethodGet, tt.path, nil)

			tt.handler(c)

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
	}
}

func TestSearchHandlersMatchSearchKeywordsWithoutReturningThem(t *testing.T) {
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
		`INSERT INTO singer (id,name,aliases,searchKeywords,createUserId,createTimestamp) VALUES
			('singer-1','Visible Singer','', 'hidden singer token', 'user-1', ?)`,
		now,
	); err != nil {
		t.Fatalf("insert singer: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO music (id,type,name,aliases,searchKeywords,asset,createUserId,createTimestamp) VALUES
			('music-1',1,'Visible Song','', 'hidden music token', 'song.mp3', 'user-1', ?)`,
		now,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}
	if err := store.LinkMusicSingers("music-1", []string{"singer-1"}); err != nil {
		t.Fatalf("link music singer: %v", err)
	}

	t.Run("music", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest(http.MethodGet, "/api/music/search?keyword=hidden+music&page=1&pageSize=10", nil)

		SearchMusic(c)

		var resp struct {
			Code string `json:"code"`
			Data struct {
				Total     int              `json:"total"`
				MusicList []map[string]any `json:"musicList"`
			} `json:"data"`
		}
		if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
			t.Fatalf("decode response: %v", err)
		}
		if resp.Code != "success" || resp.Data.Total != 1 || len(resp.Data.MusicList) != 1 {
			t.Fatalf("unexpected music search response: %+v body=%s", resp, w.Body.String())
		}
		if _, ok := resp.Data.MusicList[0]["searchKeywords"]; ok {
			t.Fatalf("music search leaked searchKeywords: %+v", resp.Data.MusicList[0])
		}
	})

	t.Run("singer", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest(http.MethodGet, "/api/singer/search?keyword=hidden+singer&page=1&pageSize=10", nil)

		SearchSinger(c)

		var resp struct {
			Code string `json:"code"`
			Data struct {
				Total      int              `json:"total"`
				SingerList []map[string]any `json:"singerList"`
			} `json:"data"`
		}
		if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
			t.Fatalf("decode response: %v", err)
		}
		if resp.Code != "success" || resp.Data.Total != 1 || len(resp.Data.SingerList) != 1 {
			t.Fatalf("unexpected singer search response: %+v body=%s", resp, w.Body.String())
		}
		if _, ok := resp.Data.SingerList[0]["searchKeywords"]; ok {
			t.Fatalf("singer search leaked searchKeywords: %+v", resp.Data.SingerList[0])
		}
	})
}
