package handler

import (
	"cicada/internal/config"
	"cicada/internal/store"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

func TestGetMusicReturnsRelatedPublicMusicbills(t *testing.T) {
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
		`INSERT INTO user (id,username,password,nickname,avatar,joinTimestamp) VALUES
			('OWNER1','owner_one',?, 'Owner One', 'owner.jpg', ?)`,
		store.DoubleMD5("password"), now,
	); err != nil {
		t.Fatalf("insert owner: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO music (id,type,name,cover,asset,createTimestamp) VALUES
			('MUS001', ?, 'Target Song', 'target.jpg', 'target.mp3', ?),
			('MUS002', ?, 'Other Song', 'other.jpg', 'other.mp3', ?)`,
		int(store.MusicTypeSong), now,
		int(store.MusicTypeSong), now,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}

	for i := 1; i <= 6; i += 1 {
		id := fmt.Sprintf("PUB%03d", i)
		if _, err := store.DB().Exec(
			`INSERT INTO musicbill (id,userId,cover,name,public,createTimestamp) VALUES (?, 'OWNER1', ?, ?, 1, ?)`,
			id, fmt.Sprintf("%s.jpg", id), fmt.Sprintf("Public %d", i), now+int64(i),
		); err != nil {
			t.Fatalf("insert public musicbill %d: %v", i, err)
		}
		if _, err := store.DB().Exec(
			`INSERT INTO musicbill_music (musicbillId,musicId,addTimestamp) VALUES
				(?, 'MUS001', ?),
				(?, 'MUS002', ?)`,
			id, now, id, now,
		); err != nil {
			t.Fatalf("link public musicbill %d: %v", i, err)
		}
	}
	if _, err := store.DB().Exec(
		`INSERT INTO musicbill (id,userId,cover,name,public,createTimestamp) VALUES
			('PRIV01','OWNER1','private.jpg','Private',0,?),
			('UNREL1','OWNER1','unrelated.jpg','Unrelated',1,?)`,
		now, now,
	); err != nil {
		t.Fatalf("insert ignored musicbills: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO musicbill_music (musicbillId,musicId,addTimestamp) VALUES
			('PRIV01','MUS001',?),
			('UNREL1','MUS002',?)`,
		now, now,
	); err != nil {
		t.Fatalf("link ignored musicbills: %v", err)
	}

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/common/music?id=MUS001", nil)

	GetMusic(c)

	var resp struct {
		Code string `json:"code"`
		Data struct {
			RelatedPublicMusicbillList []struct {
				ID         string `json:"id"`
				Name       string `json:"name"`
				Cover      string `json:"cover"`
				MusicCount int    `json:"musicCount"`
				User       struct {
					ID       string `json:"id"`
					Nickname string `json:"nickname"`
					Avatar   string `json:"avatar"`
				} `json:"user"`
			} `json:"relatedPublicMusicbillList"`
		} `json:"data"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.Code != "success" {
		t.Fatalf("unexpected code: %s", resp.Code)
	}

	if len(resp.Data.RelatedPublicMusicbillList) != 5 {
		t.Fatalf("expected 5 related public musicbills, got %d", len(resp.Data.RelatedPublicMusicbillList))
	}
	for _, mb := range resp.Data.RelatedPublicMusicbillList {
		if mb.ID == "PRIV01" || mb.ID == "UNREL1" {
			t.Fatalf("unexpected related musicbill: %+v", mb)
		}
		if !strings.HasPrefix(mb.ID, "PUB") {
			t.Fatalf("expected public musicbill id, got %s", mb.ID)
		}
		if mb.MusicCount != 2 {
			t.Fatalf("expected music count 2 for %s, got %d", mb.ID, mb.MusicCount)
		}
		if mb.User.ID != "OWNER1" || mb.User.Nickname != "Owner One" || mb.User.Avatar != "/asset/user_avatar/owner.jpg" {
			t.Fatalf("unexpected owner data for %s: %+v", mb.ID, mb.User)
		}
	}
}
