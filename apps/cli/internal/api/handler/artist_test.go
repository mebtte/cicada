package handler

import (
	"bytes"
	"cicada/internal/config"
	"cicada/internal/store"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"regexp"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

func TestGetArtist(t *testing.T) {
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
		`INSERT INTO artist (id,name,aliases,createUserId,createTimestamp) VALUES (?,?,?,?,?)`,
		"artist-1", "Creator Singer", joinAliases([]string{"Alias A", "Alias B"}), "user-1", now,
	); err != nil {
		t.Fatalf("insert artist-1: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO artist (id,name,aliases,createUserId,createTimestamp) VALUES (?,?,?,?,?)`,
		"artist-2", "Guest Singer", joinAliases([]string{"Guest Alias"}), "user-2", now,
	); err != nil {
		t.Fatalf("insert artist-2: %v", err)
	}
	// Two photos for artist-1 with explicit positions to verify ordering (and
	// that descriptions round-trip).
	if _, err := store.DB().Exec(
		`INSERT INTO artist_photo (id,artistId,asset,position,description,addUserId,addTimestamp) VALUES
			('photo-a','artist-1','a.jpg',1,'second',  'user-1',?),
			('photo-b','artist-1','b.jpg',0,'first one','user-1',?)`,
		now, now,
	); err != nil {
		t.Fatalf("insert photos: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO music (id,type,name,aliases,cover,asset,heat,createUserId,createTimestamp) VALUES
			('music-1', ?, 'Song 1', ?, 'cover.jpg', 'song.mp3', 20, 'user-1', ?),
			('music-2', ?, 'Song 2', '', '', 'song-2.mp3', 20, 'user-1', ?),
			('music-3', ?, 'Song 3', '', '', 'song-3.mp3', 10, 'user-1', ?),
			('music-4', ?, 'Song 4', '', '', 'song-4.mp3', 1,  'user-1', ?)`,
		int(store.MusicTypeSong), joinAliases([]string{"Song Alias"}), now+2000,
		int(store.MusicTypeSong), now+1000,
		int(store.MusicTypeSong), now+4000,
		int(store.MusicTypeSong), now+3000,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}
	if err := store.LinkMusicSingers("music-1", []string{"artist-1", "artist-2"}); err != nil {
		t.Fatalf("link music singers: %v", err)
	}
	for _, musicID := range []string{"music-2", "music-3", "music-4"} {
		if err := store.LinkMusicSingers(musicID, []string{"artist-1"}); err != nil {
			t.Fatalf("link %s singers: %v", musicID, err)
		}
	}

	type photoResp struct {
		ID          string `json:"id"`
		Asset       string `json:"asset"`
		Description string `json:"description"`
	}
	type response struct {
		Code string `json:"code"`
		Data struct {
			ID              string      `json:"id"`
			Name            string      `json:"name"`
			Aliases         []string    `json:"aliases"`
			Photos          []photoResp `json:"photos"`
			SingerMusicList []struct {
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
			} `json:"singerMusicList"`
			LyricistMusicList []struct {
				ID string `json:"id"`
			} `json:"lyricistMusicList"`
		} `json:"data"`
		RawData map[string]json.RawMessage `json:"-"`
	}

	getSinger := func(userID string, admin int) response {
		t.Helper()

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest(http.MethodGet, "/api/artist?id=artist-1", nil)
		c.Set("authed_user", &store.User{ID: userID, Admin: admin})

		GetArtist(c)

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

	t.Run("returns the full artist detail payload", func(t *testing.T) {
		resp := getSinger("user-1", 0)
		if resp.Code != "success" {
			t.Fatalf("unexpected code: %s", resp.Code)
		}
		if resp.Data.ID != "artist-1" || resp.Data.Name != "Creator Singer" {
			t.Fatalf("unexpected artist payload: %+v", resp.Data)
		}
		if len(resp.Data.Aliases) != 2 || resp.Data.Aliases[0] != "Alias A" {
			t.Fatalf("unexpected aliases: %+v", resp.Data.Aliases)
		}
		if _, ok := resp.RawData["createUser"]; ok {
			t.Fatalf("artist detail should not include createUser: %s", resp.RawData["createUser"])
		}
		if _, ok := resp.RawData["createTimestamp"]; ok {
			t.Fatalf("artist detail should not include createTimestamp: %s", resp.RawData["createTimestamp"])
		}

		// Photos sorted by position; first one is the avatar.
		if len(resp.Data.Photos) != 2 {
			t.Fatalf("expected 2 photos, got %d", len(resp.Data.Photos))
		}
		if resp.Data.Photos[0].ID != "photo-b" || resp.Data.Photos[0].Description != "first one" {
			t.Fatalf("expected photo-b first: %+v", resp.Data.Photos[0])
		}
		if resp.Data.Photos[0].Asset != "/asset/artist_photo/b.jpg" {
			t.Fatalf("unexpected first photo asset url: %q", resp.Data.Photos[0].Asset)
		}
		if resp.Data.Photos[1].ID != "photo-a" || resp.Data.Photos[1].Description != "second" {
			t.Fatalf("expected photo-a second: %+v", resp.Data.Photos[1])
		}

		if len(resp.Data.SingerMusicList) != 4 {
			t.Fatalf("unexpected singerMusicList: %+v", resp.Data.SingerMusicList)
		}
		for i, wantID := range []string{"music-1", "music-2", "music-3", "music-4"} {
			if resp.Data.SingerMusicList[i].ID != wantID {
				t.Fatalf("singerMusicList[%d] ID = %s, want %s; list = %+v", i, resp.Data.SingerMusicList[i].ID, wantID, resp.Data.SingerMusicList)
			}
		}
		if len(resp.Data.LyricistMusicList) != 0 {
			t.Fatalf("unexpected lyricistMusicList: %+v", resp.Data.LyricistMusicList)
		}
		music := resp.Data.SingerMusicList[0]
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
		for _, artist := range music.Singers {
			if artist.ID == "artist-2" {
				guestFound = true
				if artist.Name != "Guest Singer" {
					t.Fatalf("unexpected guest artist: %+v", artist)
				}
				if len(artist.Aliases) != 1 || artist.Aliases[0] != "Guest Alias" {
					t.Fatalf("unexpected guest artist aliases: %+v", artist.Aliases)
				}
			}
		}
		if !guestFound {
			t.Fatalf("guest artist not found in nested artist list: %+v", music.Singers)
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
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
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
		`INSERT INTO artist (id,name,aliases,createUserId,createTimestamp) VALUES
			('artist-alpha','Alpha',?, 'user-1', ?),
			('artist-beta','Beta', ?, 'user-1', ?)`,
		joinAliases([]string{"First Alias"}), now-100,
		joinAliases([]string{"Second Alias"}), now,
	); err != nil {
		t.Fatalf("insert singers: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO artist_photo (id,artistId,asset,position,description,addUserId,addTimestamp) VALUES
			('photo-beta-2','artist-beta','beta-2.jpg',1,'second beta photo','user-1',?),
			('photo-beta-1','artist-beta','beta-1.jpg',0,'first beta photo','user-1',?)`,
		now, now,
	); err != nil {
		t.Fatalf("insert photos: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO music (id,type,name,asset,createUserId,createTimestamp) VALUES
			('music-beta-1',1,'Beta Song One','beta-1.mp3','user-1',?),
			('music-beta-2',1,'Beta Song Two','beta-2.mp3','user-1',?),
			('music-alpha-1',1,'Alpha Song','alpha-1.mp3','user-1',?)`,
		now, now-1, now-2,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO music_singer_relation (musicId,artistId) VALUES
			('music-beta-1','artist-beta'),
			('music-beta-2','artist-beta'),
			('music-alpha-1','artist-alpha')`,
	); err != nil {
		t.Fatalf("insert music artist relations: %v", err)
	}

	type response struct {
		Code string `json:"code"`
		Data struct {
			Total      int `json:"total"`
			ArtistList []struct {
				ID         string   `json:"id"`
				Name       string   `json:"name"`
				Aliases    []string `json:"aliases"`
				MusicCount int      `json:"musicCount"`
				Photos     []struct {
					ID          string `json:"id"`
					Asset       string `json:"asset"`
					Description string `json:"description"`
				} `json:"photos"`
			} `json:"artistList"`
		} `json:"data"`
	}

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/artist/search?keyword=Beta&page=1&pageSize=10", nil)
	c.Set("authed_user", &store.User{ID: "user-1", Admin: 0})

	SearchArtist(c)

	var resp response
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.Code != "success" {
		t.Fatalf("unexpected code: %s", resp.Code)
	}
	if resp.Data.Total != 1 || len(resp.Data.ArtistList) != 1 {
		t.Fatalf("unexpected artist list: %+v", resp.Data)
	}
	artist := resp.Data.ArtistList[0]
	if artist.ID != "artist-beta" || artist.Name != "Beta" {
		t.Fatalf("unexpected artist: %+v", artist)
	}
	if artist.MusicCount != 2 {
		t.Fatalf("expected music count 2, got %d", artist.MusicCount)
	}
	if len(artist.Photos) != 2 {
		t.Fatalf("expected 2 photos, got %+v", artist.Photos)
	}
	if artist.Photos[0].ID != "photo-beta-1" || artist.Photos[0].Asset != "/asset/artist_photo/beta-1.jpg" {
		t.Fatalf("unexpected first photo: %+v", artist.Photos[0])
	}
	if artist.Photos[1].ID != "photo-beta-2" || artist.Photos[1].Description != "second beta photo" {
		t.Fatalf("unexpected second photo: %+v", artist.Photos[1])
	}
}

func TestAdminCreateArtistForceDuplicateName(t *testing.T) {
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
		`INSERT INTO artist (id,name,aliases,createUserId,createTimestamp) VALUES (?,?,?,?,?)`,
		"ABC123", "Same Name", "", "user-1", now,
	); err != nil {
		t.Fatalf("insert artist: %v", err)
	}

	type response struct {
		Code string `json:"code"`
		Data string `json:"data"`
	}
	call := func(body string) response {
		t.Helper()
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest(http.MethodPost, "/api/admin/artist", bytes.NewBufferString(body))
		c.Request.Header.Set("Content-Type", "application/json")
		c.Set("authed_user", &store.User{ID: "user-1", Admin: 1})

		AdminCreateArtist(c)

		var resp response
		if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
			t.Fatalf("decode response: %v", err)
		}
		return resp
	}

	duplicateResp := call(`{"name":"Same Name","force":false}`)
	if duplicateResp.Code != "artist_already_existed" {
		t.Fatalf("expected artist_already_existed, got %+v", duplicateResp)
	}

	forcedResp := call(`{"name":"Same Name","force":true}`)
	if forcedResp.Code != "success" {
		t.Fatalf("expected success, got %+v", forcedResp)
	}
	if matched := regexp.MustCompile(`^[0-9A-Za-z]{8}$`).MatchString(forcedResp.Data); !matched {
		t.Fatalf("expected 8-character alphanumeric artist id, got %q", forcedResp.Data)
	}
	if forcedResp.Data == "ABC123" {
		t.Fatalf("forced create reused existing id")
	}
	var count int
	if err := store.DB().QueryRow(`SELECT COUNT(1) FROM artist WHERE name=?`, "Same Name").Scan(&count); err != nil {
		t.Fatalf("count singers: %v", err)
	}
	if count != 2 {
		t.Fatalf("expected 2 same-name singers after force create, got %d", count)
	}
}

func TestAdminGetArtistList(t *testing.T) {
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
		`INSERT INTO user (id,username,password,nickname,joinTimestamp) VALUES
			('user-1','creator_one',?, 'Creator One', ?),
			('user-2','creator_two',?, 'Creator Two', ?)`,
		store.DoubleMD5("password"), now, store.DoubleMD5("password"), now,
	); err != nil {
		t.Fatalf("insert users: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO artist (id,name,aliases,searchKeywords,createUserId,createTimestamp) VALUES
			('artist-alpha','Alpha',?, 'alpha hidden token', 'user-1', ?),
			('artist-beta','Beta', ?, '', 'user-2', ?),
			('artist-gamma','Gamma',?, '', 'user-1', ?)`,
		joinAliases([]string{"First Alias", "Shared Key"}), now-300,
		joinAliases([]string{"Second Alias"}), now-100,
		joinAliases([]string{"Third Alias"}), now-200,
	); err != nil {
		t.Fatalf("insert singers: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO artist_photo (id,artistId,asset,position,description,addUserId,addTimestamp) VALUES
			('photo-beta-2','artist-beta','beta-2.jpg',1,'second beta photo','user-2',?),
			('photo-beta-1','artist-beta','beta-1.jpg',0,'first beta photo','user-2',?),
			('photo-alpha-1','artist-alpha','alpha-1.jpg',0,'first alpha photo','user-1',?)`,
		now, now, now,
	); err != nil {
		t.Fatalf("insert photos: %v", err)
	}
	// 准备音乐和歌手关联数据用于校验 musicCount 字段
	if _, err := store.DB().Exec(
		`INSERT INTO music (id,type,name,asset,createUserId,createTimestamp) VALUES
			('music-1',1,'Song One','song-1.mp3','user-1',?),
			('music-2',1,'Song Two','song-2.mp3','user-1',?),
			('music-3',1,'Song Three','song-3.mp3','user-1',?)`,
		now, now, now,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO music_singer_relation (musicId,artistId) VALUES
			('music-1','artist-alpha'),
			('music-2','artist-alpha'),
			('music-3','artist-beta')`,
	); err != nil {
		t.Fatalf("insert music_singer_relation: %v", err)
	}

	type singerItem struct {
		ID             string   `json:"id"`
		Name           string   `json:"name"`
		Aliases        []string `json:"aliases"`
		SearchKeywords string   `json:"searchKeywords"`
		Photos         []struct {
			ID          string `json:"id"`
			Asset       string `json:"asset"`
			Description string `json:"description"`
		} `json:"photos"`
		MusicCount int `json:"musicCount"`
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
			ArtistList []singerItem `json:"artistList"`
		} `json:"data"`
	}

	call := func(rawQuery string) response {
		t.Helper()

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest(http.MethodGet, "/api/admin/artist_list?"+rawQuery, nil)
		c.Set("authed_user", &store.User{ID: "user-1", Admin: 1})

		AdminGetArtistList(c)

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
		if len(resp.Data.ArtistList) != 2 {
			t.Fatalf("expected 2 singers, got %d", len(resp.Data.ArtistList))
		}
		if resp.Data.ArtistList[0].ID != "artist-beta" || resp.Data.ArtistList[1].ID != "artist-gamma" {
			t.Fatalf("unexpected order: %+v", resp.Data.ArtistList)
		}
		if resp.Data.ArtistList[0].CreateUser.Username != "creator_two" {
			t.Fatalf("unexpected create user: %+v", resp.Data.ArtistList[0].CreateUser)
		}
		if len(resp.Data.ArtistList[0].Aliases) != 1 || resp.Data.ArtistList[0].Aliases[0] != "Second Alias" {
			t.Fatalf("unexpected aliases: %+v", resp.Data.ArtistList[0].Aliases)
		}
		if resp.Data.ArtistList[1].SearchKeywords != "" {
			t.Fatalf("unexpected search keywords for gamma: %q", resp.Data.ArtistList[1].SearchKeywords)
		}
		photos := resp.Data.ArtistList[0].Photos
		if len(photos) != 2 {
			t.Fatalf("expected 2 photos, got %+v", photos)
		}
		if photos[0].ID != "photo-beta-1" || photos[0].Asset != "/asset/artist_photo/beta-1.jpg" {
			t.Fatalf("unexpected first photo: %+v", photos[0])
		}
		if photos[1].ID != "photo-beta-2" || photos[1].Description != "second beta photo" {
			t.Fatalf("unexpected second photo: %+v", photos[1])
		}
	})

	t.Run("includes music count per artist", func(t *testing.T) {
		resp := call("page=1&pageSize=10")
		if resp.Code != "success" {
			t.Fatalf("unexpected code: %s", resp.Code)
		}
		counts := map[string]int{}
		for _, s := range resp.Data.ArtistList {
			counts[s.ID] = s.MusicCount
		}
		if counts["artist-alpha"] != 2 {
			t.Fatalf("expected artist-alpha music count 2, got %d", counts["artist-alpha"])
		}
		if counts["artist-beta"] != 1 {
			t.Fatalf("expected artist-beta music count 1, got %d", counts["artist-beta"])
		}
		if counts["artist-gamma"] != 0 {
			t.Fatalf("expected artist-gamma music count 0, got %d", counts["artist-gamma"])
		}
	})

	t.Run("filters by id name alias and all", func(t *testing.T) {
		cases := []struct {
			query string
			want  string
		}{
			{"page=1&pageSize=10&filterKey=id&keyword=alpha", "artist-alpha"},
			{"page=1&pageSize=10&filterKey=name&keyword=Beta", "artist-beta"},
			{"page=1&pageSize=10&filterKey=alias&keyword=Third", "artist-gamma"},
			{"page=1&pageSize=10&filterKey=all&keyword=Shared", "artist-alpha"},
			{"page=1&pageSize=10&filterKey=all&keyword=hidden+token", "artist-alpha"},
		}
		for _, tc := range cases {
			resp := call(tc.query)
			if resp.Code != "success" || resp.Data.Total != 1 {
				t.Fatalf("query %q unexpected response: %+v", tc.query, resp)
			}
			if resp.Data.ArtistList[0].ID != tc.want {
				t.Fatalf("query %q expected %s, got %+v", tc.query, tc.want, resp.Data.ArtistList[0])
			}
		}
	})
}

func TestAdminGetArtist(t *testing.T) {
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
		`INSERT INTO user (id,username,password,nickname,joinTimestamp) VALUES
			('user-1','creator_one',?, 'Creator One', ?)`,
		store.DoubleMD5("password"), now,
	); err != nil {
		t.Fatalf("insert user: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO artist (id,name,aliases,searchKeywords,createUserId,createTimestamp) VALUES
			('artist-alpha','Alpha',?, 'alpha hidden token', 'user-1', ?)`,
		joinAliases([]string{"First Alias", "Second Alias"}), now-100,
	); err != nil {
		t.Fatalf("insert artist: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO artist_photo (id,artistId,asset,position,description,addUserId,addTimestamp) VALUES
			('photo-alpha-2','artist-alpha','alpha-2.jpg',1,'second photo','user-1',?),
			('photo-alpha-1','artist-alpha','alpha-1.jpg',0,'first photo','user-1',?)`,
		now, now,
	); err != nil {
		t.Fatalf("insert photos: %v", err)
	}

	type response struct {
		Code string `json:"code"`
		Data struct {
			ID             string   `json:"id"`
			Name           string   `json:"name"`
			Aliases        []string `json:"aliases"`
			SearchKeywords string   `json:"searchKeywords"`
			Photos         []struct {
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
		c.Request = httptest.NewRequest(http.MethodGet, "/api/admin/artist?"+rawQuery, nil)
		c.Set("authed_user", &store.User{ID: "user-1", Admin: 1})

		AdminGetArtist(c)

		var resp response
		if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
			t.Fatalf("decode response: %v", err)
		}
		return resp
	}

	t.Run("returns admin artist detail payload", func(t *testing.T) {
		resp := call("id=artist-alpha")
		if resp.Code != "success" {
			t.Fatalf("unexpected code: %s", resp.Code)
		}
		if resp.Data.ID != "artist-alpha" || resp.Data.Name != "Alpha" {
			t.Fatalf("unexpected artist payload: %+v", resp.Data)
		}
		if len(resp.Data.Aliases) != 2 || resp.Data.Aliases[0] != "First Alias" {
			t.Fatalf("unexpected aliases: %+v", resp.Data.Aliases)
		}
		if resp.Data.SearchKeywords != "alpha hidden token" {
			t.Fatalf("unexpected search keywords: %q", resp.Data.SearchKeywords)
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
		if resp.Data.Photos[0].ID != "photo-alpha-1" || resp.Data.Photos[0].Asset != "/asset/artist_photo/alpha-1.jpg" {
			t.Fatalf("unexpected first photo: %+v", resp.Data.Photos[0])
		}
		if resp.Data.MusicList != nil {
			t.Fatalf("admin artist detail should not include musicList: %+v", resp.Data.MusicList)
		}
	})

	t.Run("validates id", func(t *testing.T) {
		resp := call("")
		if resp.Code != "wrong_parameter" {
			t.Fatalf("expected wrong_parameter, got %+v", resp)
		}

		resp = call("id=missing")
		if resp.Code != "artist_not_existed" {
			t.Fatalf("expected artist_not_existed, got %+v", resp)
		}
	})
}

func TestAdminUpdateArtistSearchKeywords(t *testing.T) {
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
		`INSERT INTO artist (id,name,createUserId,createTimestamp) VALUES (?,?,?,?)`,
		"artist-1", "Singer", "user-1", now,
	); err != nil {
		t.Fatalf("insert artist: %v", err)
	}

	call := func(value string) string {
		t.Helper()

		body, err := json.Marshal(map[string]any{
			"id":    "artist-1",
			"key":   "searchKeywords",
			"value": value,
		})
		if err != nil {
			t.Fatalf("marshal body: %v", err)
		}
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest(http.MethodPut, "/api/admin/artist", bytes.NewReader(body))
		c.Request.Header.Set("Content-Type", "application/json")
		c.Set("authed_user", &store.User{ID: "user-1", Admin: 1})

		AdminUpdateArtist(c)

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
	if err := store.DB().QueryRow(`SELECT searchKeywords FROM artist WHERE id=?`, "artist-1").Scan(&stored); err != nil {
		t.Fatalf("read searchKeywords: %v", err)
	}
	if stored != "hidden token\nzjl" {
		t.Fatalf("unexpected stored searchKeywords: %q", stored)
	}

	if code := call(strings.Repeat("歌", searchKeywordsMaxLength+1)); code != "wrong_parameter" {
		t.Fatalf("expected wrong_parameter for overlong searchKeywords, got %s", code)
	}
}
