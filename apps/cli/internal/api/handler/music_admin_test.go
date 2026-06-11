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

func TestAdminGetMusicList(t *testing.T) {
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
			('USER01','creator_one',?, 'Creator One', ?),
			('USER02','creator_two',?, 'Creator Two', ?)`,
		store.DoubleMD5("password"), now, store.DoubleMD5("password"), now,
	); err != nil {
		t.Fatalf("insert users: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO artist (id,name,aliases,createTimestamp) VALUES
			('ART101','Alpha Performer',?, ?),
			('ART102','Beta Performer', ?, ?)`,
		joinAliases([]string{"Voice Alias"}), now-200,
		joinAliases([]string{"Shared Performer Alias"}), now-100,
	); err != nil {
		t.Fatalf("insert performers: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO music (id,type,name,aliases,searchKeywords,cover,asset,heat,createTimestamp,year) VALUES
			('MUS101', ?, 'Alpha Song', ?, 'alpha hidden token', 'alpha.jpg', 'alpha.mp3', 9, ?, 2020),
			('MUS102', ?, 'Beta Tune', ?, '', '', 'beta.mp3', 3, ?, NULL),
			('MUS103', ?, 'Gamma Track', ?, '', '', 'gamma.mp3', 1, ?, 1999)`,
		int(store.MusicTypeSong), joinAliases([]string{"First Alias"}), now-300,
		int(store.MusicTypeInstrumental), joinAliases([]string{"Second Alias"}), now-100,
		int(store.MusicTypeSong), joinAliases([]string{"Third Alias"}), now-200,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}
	if err := store.ReplaceMusicArtistsByRole("MUS101", store.MusicArtistRolePerformer, []string{"ART101"}); err != nil {
		t.Fatalf("link alpha performers: %v", err)
	}
	if err := store.ReplaceMusicArtistsByRole("MUS102", store.MusicArtistRolePerformer, []string{"ART102"}); err != nil {
		t.Fatalf("link beta performers: %v", err)
	}
	if err := store.ReplaceMusicArtistsByRole("MUS103", store.MusicArtistRolePerformer, []string{"ART102"}); err != nil {
		t.Fatalf("link gamma performers: %v", err)
	}

	type musicItem struct {
		ID             string   `json:"id"`
		Name           string   `json:"name"`
		Aliases        []string `json:"aliases"`
		SearchKeywords string   `json:"searchKeywords"`
		Cover          string   `json:"cover"`
		Year           *int64   `json:"year"`
		Performers     []struct {
			ID      string   `json:"id"`
			Name    string   `json:"name"`
			Aliases []string `json:"aliases"`
		} `json:"performers"`
		CreateTimestamp int64 `json:"createTimestamp"`
	}
	type response struct {
		Code string `json:"code"`
		Data struct {
			Total     int         `json:"total"`
			MusicList []musicItem `json:"musicList"`
		} `json:"data"`
	}

	call := func(rawQuery string) response {
		t.Helper()

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest(http.MethodGet, "/api/admin/music_list?"+rawQuery, nil)
		c.Set("authed_user", &store.User{ID: "USER01", Admin: 1})

		AdminGetMusicList(c)

		var resp response
		if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
			t.Fatalf("decode response: %v", err)
		}
		return resp
	}

	t.Run("returns paged music ordered by create time desc", func(t *testing.T) {
		resp := call("page=1&pageSize=2")
		if resp.Code != "success" {
			t.Fatalf("unexpected code: %s", resp.Code)
		}
		if resp.Data.Total != 3 {
			t.Fatalf("expected total 3, got %d", resp.Data.Total)
		}
		if len(resp.Data.MusicList) != 2 {
			t.Fatalf("expected 2 music items, got %d", len(resp.Data.MusicList))
		}
		if resp.Data.MusicList[0].ID != "MUS102" || resp.Data.MusicList[1].ID != "MUS103" {
			t.Fatalf("unexpected order: %+v", resp.Data.MusicList)
		}
		if len(resp.Data.MusicList[0].Aliases) != 1 || resp.Data.MusicList[0].Aliases[0] != "Second Alias" {
			t.Fatalf("unexpected aliases: %+v", resp.Data.MusicList[0].Aliases)
		}
		if resp.Data.MusicList[1].SearchKeywords != "" {
			t.Fatalf("unexpected search keywords for gamma: %q", resp.Data.MusicList[1].SearchKeywords)
		}
		if resp.Data.MusicList[1].Year == nil || *resp.Data.MusicList[1].Year != 1999 {
			t.Fatalf("unexpected year: %+v", resp.Data.MusicList[1].Year)
		}
	})

	t.Run("filters by id name alias artist and all", func(t *testing.T) {
		cases := []struct {
			query string
			want  string
		}{
			{"page=1&pageSize=10&filterKey=id&keyword=MUS101", "MUS101"},
			{"page=1&pageSize=10&filterKey=name&keyword=Beta", "MUS102"},
			{"page=1&pageSize=10&filterKey=alias&keyword=Third", "MUS103"},
			{"page=1&pageSize=10&filterKey=artist&keyword=Voice", "MUS101"},
			{"page=1&pageSize=10&filterKey=all&keyword=hidden+token", "MUS101"},
			{"page=1&pageSize=10&filterKey=all&keyword=Alpha+Song", "MUS101"},
		}
		for _, tc := range cases {
			resp := call(tc.query)
			if resp.Code != "success" || resp.Data.Total != 1 {
				t.Fatalf("query %q unexpected response: %+v", tc.query, resp)
			}
			if resp.Data.MusicList[0].ID != tc.want {
				t.Fatalf("query %q expected %s, got %+v", tc.query, tc.want, resp.Data.MusicList[0])
			}
		}
	})

	t.Run("rejects invalid filter key", func(t *testing.T) {
		resp := call("page=1&pageSize=10&filterKey=bad")
		if resp.Code != "wrong_parameter" {
			t.Fatalf("expected wrong_parameter, got %+v", resp)
		}
	})

	t.Run("sorts by heat descending", func(t *testing.T) {
		resp := call("page=1&pageSize=10&sortBy=heat")
		if resp.Code != "success" {
			t.Fatalf("unexpected code: %s", resp.Code)
		}
		if len(resp.Data.MusicList) != 3 {
			t.Fatalf("expected 3 music items, got %d", len(resp.Data.MusicList))
		}
		if resp.Data.MusicList[0].ID != "MUS101" ||
			resp.Data.MusicList[1].ID != "MUS102" ||
			resp.Data.MusicList[2].ID != "MUS103" {
			t.Fatalf("unexpected order: %+v", resp.Data.MusicList)
		}
	})

	t.Run("sorts by heat ascending", func(t *testing.T) {
		resp := call("page=1&pageSize=10&sortBy=heat&sortOrder=asc")
		if resp.Code != "success" {
			t.Fatalf("unexpected code: %s", resp.Code)
		}
		if len(resp.Data.MusicList) != 3 {
			t.Fatalf("expected 3 music items, got %d", len(resp.Data.MusicList))
		}
		if resp.Data.MusicList[0].ID != "MUS103" ||
			resp.Data.MusicList[1].ID != "MUS102" ||
			resp.Data.MusicList[2].ID != "MUS101" {
			t.Fatalf("unexpected order: %+v", resp.Data.MusicList)
		}
	})

	t.Run("rejects invalid sort", func(t *testing.T) {
		if resp := call("page=1&pageSize=10&sortBy=name"); resp.Code != "wrong_parameter" {
			t.Fatalf("expected wrong_parameter for sortBy, got %+v", resp)
		}
		if resp := call("page=1&pageSize=10&sortBy=heat&sortOrder=random"); resp.Code != "wrong_parameter" {
			t.Fatalf("expected wrong_parameter for sortOrder, got %+v", resp)
		}
	})
}

func TestAdminGetMusicIncludesSearchKeywordsOnlyForAdminDetail(t *testing.T) {
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
		`INSERT INTO music (id,type,name,searchKeywords,asset,createTimestamp) VALUES (?,?,?,?,?,?)`,
		"MUS001", int(store.MusicTypeSong), "Song", "hidden admin token", "song.mp3", now,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}

	call := func(path string, handler func(*gin.Context)) map[string]any {
		t.Helper()

		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest(http.MethodGet, path, nil)
		c.Set("authed_user", &store.User{ID: "USER01", Admin: 1})

		handler(c)

		var resp struct {
			Code string         `json:"code"`
			Data map[string]any `json:"data"`
		}
		if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
			t.Fatalf("decode response: %v", err)
		}
		if resp.Code != "success" {
			t.Fatalf("unexpected code: %s body=%s", resp.Code, w.Body.String())
		}
		return resp.Data
	}

	adminData := call("/api/admin/music?id=MUS001", AdminGetMusic)
	if adminData["searchKeywords"] != "hidden admin token" {
		t.Fatalf("expected admin detail searchKeywords, got %+v", adminData)
	}

	playerData := call("/api/music?id=MUS001", GetMusic)
	if _, ok := playerData["searchKeywords"]; ok {
		t.Fatalf("ordinary music detail leaked searchKeywords: %+v", playerData)
	}
}
