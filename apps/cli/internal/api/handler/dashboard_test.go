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

func TestAdminGetDashboard(t *testing.T) {
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

	now := time.Now()
	recent := now.AddDate(0, 0, -2).UnixMilli()
	old := now.AddDate(0, 0, -8).UnixMilli()

	if _, err := store.DB().Exec(`DELETE FROM user`); err != nil {
		t.Fatalf("clear seeded user: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO user (id,username,password,nickname,joinTimestamp,admin,lastActiveTimestamp) VALUES
			('USER01','admin',?, 'Admin', ?, 1, ?),
			('USER02','listener',?, 'Listener', ?, 0, ?),
			('USER03','editor',?, 'Editor', ?, 0, ?)`,
		store.DoubleMD5("password"), old, recent,
		store.DoubleMD5("password"), recent, recent,
		store.DoubleMD5("password"), recent, old,
	); err != nil {
		t.Fatalf("insert users: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO artist (id,name,createTimestamp) VALUES
			('ART201','Recent Artist',?),
			('ART202','Old Artist',?)`,
		recent,
		old,
	); err != nil {
		t.Fatalf("insert performers: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO music (id,type,name,cover,asset,assetSize,assetDurationMs,createTimestamp) VALUES
			('MUS201',?,'Recent Song','','recent.mp3',100,120000,?),
			('MUS202',?,'Old Song','old.jpg','old.mp3',250,180000,?)`,
		int(store.MusicTypeSong), recent,
		int(store.MusicTypeSong), old,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO artist_photo (id,artistId,asset,position,addTimestamp) VALUES
			('photo-old','ART202','old.jpg',1,?)`,
		recent,
	); err != nil {
		t.Fatalf("insert artist photo: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO music_play_record (userId,musicId,percent,playedAt) VALUES
			('USER02','MUS201',0.5,?),
			('USER02','MUS202',0.5,?),
			('USER03','MUS202',0.5,?)`,
		now.UnixMilli(),
		now.AddDate(0, 0, -1).UnixMilli(),
		now.AddDate(0, 0, -8).UnixMilli(),
	); err != nil {
		t.Fatalf("insert play records: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO musicbill (id,userId,name,public,createTimestamp) VALUES
			('BILL01','USER01','Public One',1,?),
			('BILL02','USER02','Public Two',1,?),
			('BILL03','USER03','Private One',0,?)`,
		recent,
		recent,
		old,
	); err != nil {
		t.Fatalf("insert musicbills: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO shared_musicbill (musicbillId,sharedUserId,inviteUserId,inviteTimestamp,accepted) VALUES
			('BILL01','USER02','USER01',?,1),
			('BILL01','USER03','USER01',?,1),
			('BILL02','USER03','USER01',?,0)`,
		recent,
		recent,
		recent,
	); err != nil {
		t.Fatalf("insert shared musicbills: %v", err)
	}

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/admin/dashboard", nil)

	AdminGetDashboard(c)

	type response struct {
		Code string `json:"code"`
		Data struct {
			TodayPlayCount int `json:"todayPlayCount"`
			PlayCount7d    int `json:"playCount7d"`
			Music          struct {
				Total             int   `json:"total"`
				TotalAssetSize    int64 `json:"totalAssetSize"`
				TotalDurationMs   int64 `json:"totalDurationMs"`
				Created7d         int   `json:"created7d"`
				WithoutCoverCount int   `json:"withoutCoverCount"`
			} `json:"music"`
			Artist struct {
				Total             int `json:"total"`
				Created7d         int `json:"created7d"`
				PhotoCount        int `json:"photoCount"`
				WithoutPhotoCount int `json:"withoutPhotoCount"`
			} `json:"artist"`
			User struct {
				Total             int `json:"total"`
				AdminCount        int `json:"adminCount"`
				ActiveUser7dCount int `json:"activeUser7dCount"`
			} `json:"user"`
			Musicbill struct {
				Total  int `json:"total"`
				Public int `json:"public"`
				Shared int `json:"shared"`
			} `json:"musicbill"`
		} `json:"data"`
	}

	var resp response
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.Code != "success" {
		t.Fatalf("unexpected code: %s", resp.Code)
	}
	if resp.Data.TodayPlayCount != 1 {
		t.Fatalf("expected today play count 1, got %d", resp.Data.TodayPlayCount)
	}
	if resp.Data.PlayCount7d != 2 {
		t.Fatalf("expected 7d play count 2, got %d", resp.Data.PlayCount7d)
	}
	if resp.Data.Music.Total != 2 ||
		resp.Data.Music.TotalAssetSize != 350 ||
		resp.Data.Music.TotalDurationMs != 300000 ||
		resp.Data.Music.Created7d != 1 ||
		resp.Data.Music.WithoutCoverCount != 1 {
		t.Fatalf("unexpected music summary: %+v", resp.Data.Music)
	}
	if resp.Data.Artist.Total != 2 ||
		resp.Data.Artist.Created7d != 1 ||
		resp.Data.Artist.PhotoCount != 1 ||
		resp.Data.Artist.WithoutPhotoCount != 1 {
		t.Fatalf("unexpected artist summary: %+v", resp.Data.Artist)
	}
	if resp.Data.User.Total != 3 ||
		resp.Data.User.AdminCount != 1 ||
		resp.Data.User.ActiveUser7dCount != 2 {
		t.Fatalf("unexpected user summary: %+v", resp.Data.User)
	}
	if resp.Data.Musicbill.Total != 3 ||
		resp.Data.Musicbill.Public != 2 ||
		resp.Data.Musicbill.Shared != 1 {
		t.Fatalf("unexpected musicbill summary: %+v", resp.Data.Musicbill)
	}
}
