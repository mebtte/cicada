package handler

import (
	"bytes"
	"cicada/internal/config"
	"cicada/internal/store"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"regexp"
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
		`INSERT INTO singer (id,name,aliases,createUserId,createTimestamp) VALUES (?,?,?,?,?)`,
		"singer-1", "Creator Singer", joinAliases([]string{"Alias A", "Alias B"}), "user-1", now,
	); err != nil {
		t.Fatalf("insert singer-1: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO singer (id,name,aliases,createUserId,createTimestamp) VALUES (?,?,?,?,?)`,
		"singer-2", "Guest Singer", joinAliases([]string{"Guest Alias"}), "user-2", now,
	); err != nil {
		t.Fatalf("insert singer-2: %v", err)
	}
	// Two photos for singer-1 with explicit positions to verify ordering (and
	// that descriptions round-trip).
	if _, err := store.DB().Exec(
		`INSERT INTO singer_photo (id,singerId,asset,position,description,addUserId,addTimestamp) VALUES
			('photo-a','singer-1','a.jpg',1,'second',  'user-1',?),
			('photo-b','singer-1','b.jpg',0,'first one','user-1',?)`,
		now, now,
	); err != nil {
		t.Fatalf("insert photos: %v", err)
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

	type photoResp struct {
		ID          string `json:"id"`
		Asset       string `json:"asset"`
		Description string `json:"description"`
	}
	type response struct {
		Code string `json:"code"`
		Data struct {
			ID        string      `json:"id"`
			Name      string      `json:"name"`
			Aliases   []string    `json:"aliases"`
			Photos    []photoResp `json:"photos"`
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
				} `json:"singers"`
			} `json:"musicList"`
		} `json:"data"`
		RawData map[string]json.RawMessage `json:"-"`
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
		var raw struct {
			Data map[string]json.RawMessage `json:"data"`
		}
		if err := json.Unmarshal(w.Body.Bytes(), &raw); err != nil {
			t.Fatalf("decode raw response: %v", err)
		}
		resp.RawData = raw.Data
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
		if _, ok := resp.RawData["createUser"]; ok {
			t.Fatalf("singer detail should not include createUser: %s", resp.RawData["createUser"])
		}
		if _, ok := resp.RawData["createTimestamp"]; ok {
			t.Fatalf("singer detail should not include createTimestamp: %s", resp.RawData["createTimestamp"])
		}

		// Photos sorted by position; first one is the avatar.
		if len(resp.Data.Photos) != 2 {
			t.Fatalf("expected 2 photos, got %d", len(resp.Data.Photos))
		}
		if resp.Data.Photos[0].ID != "photo-b" || resp.Data.Photos[0].Description != "first one" {
			t.Fatalf("expected photo-b first: %+v", resp.Data.Photos[0])
		}
		if resp.Data.Photos[0].Asset != "/asset/singer_photo/b.jpg" {
			t.Fatalf("unexpected first photo asset url: %q", resp.Data.Photos[0].Asset)
		}
		if resp.Data.Photos[1].ID != "photo-a" || resp.Data.Photos[1].Description != "second" {
			t.Fatalf("expected photo-a second: %+v", resp.Data.Photos[1])
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
}

func TestSearchSingerReturnsPhotos(t *testing.T) {
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
		`INSERT INTO user (id,username,password,nickname,joinTimestamp) VALUES
			('user-1','creator_one',?, 'Creator One', ?)`,
		store.DoubleMD5("password"), now,
	); err != nil {
		t.Fatalf("insert user: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO singer (id,name,aliases,createUserId,createTimestamp) VALUES
			('singer-alpha','Alpha',?, 'user-1', ?),
			('singer-beta','Beta', ?, 'user-1', ?)`,
		joinAliases([]string{"First Alias"}), now-100,
		joinAliases([]string{"Second Alias"}), now,
	); err != nil {
		t.Fatalf("insert singers: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO singer_photo (id,singerId,asset,position,description,addUserId,addTimestamp) VALUES
			('photo-beta-2','singer-beta','beta-2.jpg',1,'second beta photo','user-1',?),
			('photo-beta-1','singer-beta','beta-1.jpg',0,'first beta photo','user-1',?)`,
		now, now,
	); err != nil {
		t.Fatalf("insert photos: %v", err)
	}

	type response struct {
		Code string `json:"code"`
		Data struct {
			Total      int `json:"total"`
			SingerList []struct {
				ID      string   `json:"id"`
				Name    string   `json:"name"`
				Aliases []string `json:"aliases"`
				Photos  []struct {
					ID          string `json:"id"`
					Asset       string `json:"asset"`
					Description string `json:"description"`
				} `json:"photos"`
			} `json:"singerList"`
		} `json:"data"`
	}

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/singer/search?keyword=Beta&page=1&pageSize=10", nil)
	c.Set("authed_user", &store.User{ID: "user-1", Admin: 0})

	SearchSinger(c)

	var resp response
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.Code != "success" {
		t.Fatalf("unexpected code: %s", resp.Code)
	}
	if resp.Data.Total != 1 || len(resp.Data.SingerList) != 1 {
		t.Fatalf("unexpected singer list: %+v", resp.Data)
	}
	singer := resp.Data.SingerList[0]
	if singer.ID != "singer-beta" || singer.Name != "Beta" {
		t.Fatalf("unexpected singer: %+v", singer)
	}
	if len(singer.Photos) != 2 {
		t.Fatalf("expected 2 photos, got %+v", singer.Photos)
	}
	if singer.Photos[0].ID != "photo-beta-1" || singer.Photos[0].Asset != "/asset/singer_photo/beta-1.jpg" {
		t.Fatalf("unexpected first photo: %+v", singer.Photos[0])
	}
	if singer.Photos[1].ID != "photo-beta-2" || singer.Photos[1].Description != "second beta photo" {
		t.Fatalf("unexpected second photo: %+v", singer.Photos[1])
	}
}

func TestAdminCreateSingerForceDuplicateName(t *testing.T) {
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
		`INSERT INTO singer (id,name,aliases,createUserId,createTimestamp) VALUES (?,?,?,?,?)`,
		"ABC123", "Same Name", "", "user-1", now,
	); err != nil {
		t.Fatalf("insert singer: %v", err)
	}

	type response struct {
		Code string `json:"code"`
		Data string `json:"data"`
	}
	call := func(body string) response {
		t.Helper()
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest(http.MethodPost, "/api/admin/singer", bytes.NewBufferString(body))
		c.Request.Header.Set("Content-Type", "application/json")
		c.Set("authed_user", &store.User{ID: "user-1", Admin: 1})

		AdminCreateSinger(c)

		var resp response
		if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
			t.Fatalf("decode response: %v", err)
		}
		return resp
	}

	duplicateResp := call(`{"name":"Same Name","force":false}`)
	if duplicateResp.Code != "singer_already_existed" {
		t.Fatalf("expected singer_already_existed, got %+v", duplicateResp)
	}

	forcedResp := call(`{"name":"Same Name","force":true}`)
	if forcedResp.Code != "success" {
		t.Fatalf("expected success, got %+v", forcedResp)
	}
	if matched := regexp.MustCompile(`^[0-9A-Za-z]{6}$`).MatchString(forcedResp.Data); !matched {
		t.Fatalf("expected short singer id, got %q", forcedResp.Data)
	}
	if forcedResp.Data == "ABC123" {
		t.Fatalf("forced create reused existing id")
	}
	var count int
	if err := store.DB().QueryRow(`SELECT COUNT(1) FROM singer WHERE name=?`, "Same Name").Scan(&count); err != nil {
		t.Fatalf("count singers: %v", err)
	}
	if count != 2 {
		t.Fatalf("expected 2 same-name singers after force create, got %d", count)
	}
}

func TestAdminGetSingerList(t *testing.T) {
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
		`INSERT INTO user (id,username,password,nickname,joinTimestamp) VALUES
			('user-1','creator_one',?, 'Creator One', ?),
			('user-2','creator_two',?, 'Creator Two', ?)`,
		store.DoubleMD5("password"), now, store.DoubleMD5("password"), now,
	); err != nil {
		t.Fatalf("insert users: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO singer (id,name,aliases,createUserId,createTimestamp) VALUES
			('singer-alpha','Alpha',?, 'user-1', ?),
			('singer-beta','Beta', ?, 'user-2', ?),
			('singer-gamma','Gamma',?, 'user-1', ?)`,
		joinAliases([]string{"First Alias", "Shared Key"}), now-300,
		joinAliases([]string{"Second Alias"}), now-100,
		joinAliases([]string{"Third Alias"}), now-200,
	); err != nil {
		t.Fatalf("insert singers: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO singer_photo (id,singerId,asset,position,description,addUserId,addTimestamp) VALUES
			('photo-beta-2','singer-beta','beta-2.jpg',1,'second beta photo','user-2',?),
			('photo-beta-1','singer-beta','beta-1.jpg',0,'first beta photo','user-2',?),
			('photo-alpha-1','singer-alpha','alpha-1.jpg',0,'first alpha photo','user-1',?)`,
		now, now, now,
	); err != nil {
		t.Fatalf("insert photos: %v", err)
	}

	type singerItem struct {
		ID      string   `json:"id"`
		Name    string   `json:"name"`
		Aliases []string `json:"aliases"`
		Photos  []struct {
			ID          string `json:"id"`
			Asset       string `json:"asset"`
			Description string `json:"description"`
		} `json:"photos"`
		CreateUser struct {
			ID       string `json:"id"`
			Username string `json:"username"`
			Nickname string `json:"nickname"`
		} `json:"createUser"`
		CreateTimestamp int64 `json:"createTimestamp"`
	}
	type response struct {
		Code string `json:"code"`
		Data struct {
			Total      int          `json:"total"`
			SingerList []singerItem `json:"singerList"`
		} `json:"data"`
	}

	call := func(rawQuery string) response {
		t.Helper()

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest(http.MethodGet, "/api/admin/singer_list?"+rawQuery, nil)
		c.Set("authed_user", &store.User{ID: "user-1", Admin: 1})

		AdminGetSingerList(c)

		var resp response
		if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
			t.Fatalf("decode response: %v", err)
		}
		return resp
	}

	t.Run("returns paged singers ordered by create time desc", func(t *testing.T) {
		resp := call("page=1&pageSize=2")
		if resp.Code != "success" {
			t.Fatalf("unexpected code: %s", resp.Code)
		}
		if resp.Data.Total != 3 {
			t.Fatalf("expected total 3, got %d", resp.Data.Total)
		}
		if len(resp.Data.SingerList) != 2 {
			t.Fatalf("expected 2 singers, got %d", len(resp.Data.SingerList))
		}
		if resp.Data.SingerList[0].ID != "singer-beta" || resp.Data.SingerList[1].ID != "singer-gamma" {
			t.Fatalf("unexpected order: %+v", resp.Data.SingerList)
		}
		if resp.Data.SingerList[0].CreateUser.Username != "creator_two" {
			t.Fatalf("unexpected create user: %+v", resp.Data.SingerList[0].CreateUser)
		}
		if len(resp.Data.SingerList[0].Aliases) != 1 || resp.Data.SingerList[0].Aliases[0] != "Second Alias" {
			t.Fatalf("unexpected aliases: %+v", resp.Data.SingerList[0].Aliases)
		}
		photos := resp.Data.SingerList[0].Photos
		if len(photos) != 2 {
			t.Fatalf("expected 2 photos, got %+v", photos)
		}
		if photos[0].ID != "photo-beta-1" || photos[0].Asset != "/asset/singer_photo/beta-1.jpg" {
			t.Fatalf("unexpected first photo: %+v", photos[0])
		}
		if photos[1].ID != "photo-beta-2" || photos[1].Description != "second beta photo" {
			t.Fatalf("unexpected second photo: %+v", photos[1])
		}
	})

	t.Run("filters by id name alias and all", func(t *testing.T) {
		cases := []struct {
			query string
			want  string
		}{
			{"page=1&pageSize=10&filterKey=id&keyword=alpha", "singer-alpha"},
			{"page=1&pageSize=10&filterKey=name&keyword=Beta", "singer-beta"},
			{"page=1&pageSize=10&filterKey=alias&keyword=Third", "singer-gamma"},
			{"page=1&pageSize=10&filterKey=all&keyword=Shared", "singer-alpha"},
		}
		for _, tc := range cases {
			resp := call(tc.query)
			if resp.Code != "success" || resp.Data.Total != 1 {
				t.Fatalf("query %q unexpected response: %+v", tc.query, resp)
			}
			if resp.Data.SingerList[0].ID != tc.want {
				t.Fatalf("query %q expected %s, got %+v", tc.query, tc.want, resp.Data.SingerList[0])
			}
		}
	})
}

func TestAdminGetSinger(t *testing.T) {
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
		`INSERT INTO user (id,username,password,nickname,joinTimestamp) VALUES
			('user-1','creator_one',?, 'Creator One', ?)`,
		store.DoubleMD5("password"), now,
	); err != nil {
		t.Fatalf("insert user: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO singer (id,name,aliases,createUserId,createTimestamp) VALUES
			('singer-alpha','Alpha',?, 'user-1', ?)`,
		joinAliases([]string{"First Alias", "Second Alias"}), now-100,
	); err != nil {
		t.Fatalf("insert singer: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO singer_photo (id,singerId,asset,position,description,addUserId,addTimestamp) VALUES
			('photo-alpha-2','singer-alpha','alpha-2.jpg',1,'second photo','user-1',?),
			('photo-alpha-1','singer-alpha','alpha-1.jpg',0,'first photo','user-1',?)`,
		now, now,
	); err != nil {
		t.Fatalf("insert photos: %v", err)
	}

	type response struct {
		Code string `json:"code"`
		Data struct {
			ID      string   `json:"id"`
			Name    string   `json:"name"`
			Aliases []string `json:"aliases"`
			Photos  []struct {
				ID          string `json:"id"`
				Asset       string `json:"asset"`
				Description string `json:"description"`
			} `json:"photos"`
			CreateUser struct {
				ID       string `json:"id"`
				Username string `json:"username"`
				Nickname string `json:"nickname"`
			} `json:"createUser"`
			CreateTimestamp int64 `json:"createTimestamp"`
			MusicList       []any `json:"musicList"`
		} `json:"data"`
	}

	call := func(rawQuery string) response {
		t.Helper()

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest(http.MethodGet, "/api/admin/singer?"+rawQuery, nil)
		c.Set("authed_user", &store.User{ID: "user-1", Admin: 1})

		AdminGetSinger(c)

		var resp response
		if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
			t.Fatalf("decode response: %v", err)
		}
		return resp
	}

	t.Run("returns admin singer detail payload", func(t *testing.T) {
		resp := call("id=singer-alpha")
		if resp.Code != "success" {
			t.Fatalf("unexpected code: %s", resp.Code)
		}
		if resp.Data.ID != "singer-alpha" || resp.Data.Name != "Alpha" {
			t.Fatalf("unexpected singer payload: %+v", resp.Data)
		}
		if len(resp.Data.Aliases) != 2 || resp.Data.Aliases[0] != "First Alias" {
			t.Fatalf("unexpected aliases: %+v", resp.Data.Aliases)
		}
		if resp.Data.CreateUser.Username != "creator_one" || resp.Data.CreateUser.Nickname != "Creator One" {
			t.Fatalf("unexpected create user: %+v", resp.Data.CreateUser)
		}
		if resp.Data.CreateTimestamp != now-100 {
			t.Fatalf("unexpected create timestamp: %d", resp.Data.CreateTimestamp)
		}
		if len(resp.Data.Photos) != 2 {
			t.Fatalf("expected 2 photos, got %+v", resp.Data.Photos)
		}
		if resp.Data.Photos[0].ID != "photo-alpha-1" || resp.Data.Photos[0].Asset != "/asset/singer_photo/alpha-1.jpg" {
			t.Fatalf("unexpected first photo: %+v", resp.Data.Photos[0])
		}
		if resp.Data.MusicList != nil {
			t.Fatalf("admin singer detail should not include musicList: %+v", resp.Data.MusicList)
		}
	})

	t.Run("validates id", func(t *testing.T) {
		resp := call("")
		if resp.Code != "wrong_parameter" {
			t.Fatalf("expected wrong_parameter, got %+v", resp)
		}

		resp = call("id=missing")
		if resp.Code != "singer_not_existed" {
			t.Fatalf("expected singer_not_existed, got %+v", resp)
		}
	})
}
