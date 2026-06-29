package handler

import (
	"bytes"
	"cicada/internal/config"
	"cicada/internal/store"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

func setupFollowedArtistHandlerTest(t *testing.T) {
	t.Helper()
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
		`INSERT INTO user (id,username,password,nickname,joinTimestamp,admin) VALUES
			('OWNER1','owner',?,'Owner',?,1),
			('STRNGR','stranger',?,'Stranger',?,0)`,
		store.DoubleMD5("password"), now,
		store.DoubleMD5("password"), now,
	); err != nil {
		t.Fatalf("insert users: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO musicbill (id,userId,name,createTimestamp) VALUES ('BILL01','OWNER1','Bill',?)`,
		now,
	); err != nil {
		t.Fatalf("insert musicbill: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO artist (id,name,createTimestamp) VALUES
			('ART001','Alice',?),
			('ART002','Bob',?)`,
		now, now,
	); err != nil {
		t.Fatalf("insert artists: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO music (id,type,name,asset,createTimestamp) VALUES
			('MUS001',1,'Alice Old','a.mp3',?)`,
		now,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO music_artist_relation (musicId,artistId,role,position) VALUES
			('MUS001','ART001','performer',0)`,
	); err != nil {
		t.Fatalf("insert music_artist_relation: %v", err)
	}
}

type followedArtistResponse struct {
	Code string `json:"code"`
	Data []struct {
		ID      string   `json:"id"`
		Name    string   `json:"name"`
		Aliases []string `json:"aliases"`
		Photos  []struct {
			ID    string `json:"id"`
			Asset string `json:"asset"`
		} `json:"photos"`
	} `json:"data"`
}

func callAddFollowed(t *testing.T, userID string, body map[string]any) string {
	t.Helper()
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	buf, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPost, "/api/common/musicbill/followed_artist", bytes.NewReader(buf))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req
	c.Set("authed_user", &store.User{ID: userID})
	AddMusicbillFollowedArtist(c)
	var parsed struct {
		Code string `json:"code"`
	}
	json.Unmarshal(w.Body.Bytes(), &parsed)
	return parsed.Code
}

func callListFollowed(t *testing.T, userID, musicbillID string) followedArtistResponse {
	t.Helper()
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	req := httptest.NewRequest(http.MethodGet, "/api/common/musicbill/followed_artist?musicbillId="+musicbillID, nil)
	c.Request = req
	c.Set("authed_user", &store.User{ID: userID})
	GetMusicbillFollowedArtistList(c)
	var parsed followedArtistResponse
	json.Unmarshal(w.Body.Bytes(), &parsed)
	return parsed
}

func TestFollowedArtistHandlerLifecycle(t *testing.T) {
	setupFollowedArtistHandlerTest(t)

	// 关注 Alice -> 回填 MUS001
	if code := callAddFollowed(t, "OWNER1", map[string]any{
		"musicbillId": "BILL01", "artistId": "ART001",
	}); code != "success" {
		t.Fatalf("follow expected success, got %q", code)
	}
	exists, _ := store.MusicExistsInMusicbill("BILL01", "MUS001")
	if !exists {
		t.Fatalf("expected backfill to add MUS001")
	}

	// 重复关注
	if code := callAddFollowed(t, "OWNER1", map[string]any{
		"musicbillId": "BILL01", "artistId": "ART001",
	}); code != "repeated_followed_artist" {
		t.Fatalf("expected repeated_followed_artist, got %q", code)
	}

	// 列表
	resp := callListFollowed(t, "OWNER1", "BILL01")
	if resp.Code != "success" || len(resp.Data) != 1 || resp.Data[0].ID != "ART001" {
		t.Fatalf("list unexpected: %+v", resp)
	}

	// 非乐单所有者无权
	if code := callAddFollowed(t, "STRNGR", map[string]any{
		"musicbillId": "BILL01", "artistId": "ART002",
	}); code != "musicbill_not_existed" {
		t.Fatalf("expected musicbill_not_existed, got %q", code)
	}

	// 取消关注: 不删音乐
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	req := httptest.NewRequest(http.MethodDelete, "/api/common/musicbill/followed_artist?musicbillId=BILL01&artistId=ART001", nil)
	c.Request = req
	c.Set("authed_user", &store.User{ID: "OWNER1"})
	DeleteMusicbillFollowedArtist(c)
	var parsed struct {
		Code string `json:"code"`
	}
	json.Unmarshal(w.Body.Bytes(), &parsed)
	if parsed.Code != "success" {
		t.Fatalf("unfollow expected success, got %q", parsed.Code)
	}
	exists, _ = store.MusicExistsInMusicbill("BILL01", "MUS001")
	if !exists {
		t.Fatalf("unfollow should not remove music")
	}
}

func TestAdminCreateMusicAutoAddsToFollowingMusicbills(t *testing.T) {
	setupFollowedArtistHandlerTest(t)
	// OWNER1 follows Alice
	store.AddMusicbillFollowedArtist("BILL01", "ART001")

	// Admin creates a new music with Alice as performer.
	// We bypass the AdminCreateMusic handler (which needs asset on disk) and exercise
	// the auto-add helper directly with the same arguments AdminCreateMusic would pass.
	now := time.Now().UnixMilli()
	store.DB().Exec(`INSERT INTO music (id,type,name,asset,createTimestamp) VALUES ('MUS900',1,'New Song','x.mp3',?)`, now)
	store.ReplaceMusicArtistsByRole("MUS900", store.MusicArtistRolePerformer, []string{"ART001"})
	autoAddMusicToFollowingMusicbills("MUS900", []string{"ART001"}, nil, nil)

	if ok, _ := store.MusicExistsInMusicbill("BILL01", "MUS900"); !ok {
		t.Fatalf("expected MUS900 auto-added to BILL01")
	}
}

func TestAdminUpdateMusicAddsArtistTriggersAutoAdd(t *testing.T) {
	setupFollowedArtistHandlerTest(t)
	// OWNER1 follows Bob; MUS001 currently has Alice only.
	store.AddMusicbillFollowedArtist("BILL01", "ART002")

	// Simulate AdminUpdateMusic case "performers" changing from [Alice] -> [Alice, Bob]
	oldIDs := getMusicArtistIDsByRole("MUS001", store.MusicArtistRolePerformer)
	newIDs := []string{"ART001", "ART002"}
	store.ReplaceMusicArtistsByRole("MUS001", store.MusicArtistRolePerformer, newIDs)
	autoAddMusicToFollowingMusicbills("MUS001", diffNewlyAdded(oldIDs, newIDs))

	if ok, _ := store.MusicExistsInMusicbill("BILL01", "MUS001"); !ok {
		t.Fatalf("expected MUS001 auto-added after Bob was newly attached")
	}

	// Reorder (same set) should not re-add or fail.
	store.RemoveMusicFromMusicbill("BILL01", "MUS001")
	oldIDs = getMusicArtistIDsByRole("MUS001", store.MusicArtistRolePerformer)
	reordered := []string{"ART002", "ART001"}
	store.ReplaceMusicArtistsByRole("MUS001", store.MusicArtistRolePerformer, reordered)
	autoAddMusicToFollowingMusicbills("MUS001", diffNewlyAdded(oldIDs, reordered))
	if ok, _ := store.MusicExistsInMusicbill("BILL01", "MUS001"); ok {
		t.Fatalf("reorder of same artist set should not trigger auto-add")
	}
}
