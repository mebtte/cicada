package handler

import (
	"bytes"
	"cicada/internal/api/apperr"
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

func TestAdminUpdateUserPasswordSecurity(t *testing.T) {
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
	adminPasswordHash, err := store.HashPassword("admin-password")
	if err != nil {
		t.Fatalf("hash admin password: %v", err)
	}
	targetPasswordHash, err := store.HashPassword("old-password")
	if err != nil {
		t.Fatalf("hash target password: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO user (id,username,password,nickname,joinTimestamp,admin,twoFASecret) VALUES (?,?,?,?,?,?,?)`,
		"admin-user", "admin-user", adminPasswordHash, "Admin", now, 1, "admin-two-fa",
	); err != nil {
		t.Fatalf("insert admin user: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO user (id,username,password,nickname,joinTimestamp,admin,twoFASecret) VALUES (?,?,?,?,?,?,?)`,
		"target-user", "target-user", targetPasswordHash, "Target", now, 0, "target-two-fa",
	); err != nil {
		t.Fatalf("insert target user: %v", err)
	}
	if _, err := store.CreateAuthSession("target-user", "target-token-hash-1", "target1", "Browser 1", "agent", "127.0.0.1"); err != nil {
		t.Fatalf("create target session 1: %v", err)
	}
	if _, err := store.CreateAuthSession("target-user", "target-token-hash-2", "target2", "Browser 2", "agent", "127.0.0.1"); err != nil {
		t.Fatalf("create target session 2: %v", err)
	}
	adminSessionID, err := store.CreateAuthSession("admin-user", "admin-token-hash", "admin", "Admin Browser", "agent", "127.0.0.1")
	if err != nil {
		t.Fatalf("create admin session: %v", err)
	}

	admin := &store.User{ID: "admin-user", Admin: 1}

	t.Run("resetting another user password disables 2FA and revokes sessions", func(t *testing.T) {
		resp := callAdminUpdateUser(t, admin, map[string]any{
			"id":    "target-user",
			"key":   "password",
			"value": "new-password",
		})
		if resp.Code != apperr.Success {
			t.Fatalf("expected success, got %+v", resp)
		}

		target, err := store.GetUserByID("target-user")
		if err != nil {
			t.Fatalf("get target user: %v", err)
		}
		ok, _ := store.VerifyPassword(target.Password, "new-password")
		if !ok {
			t.Fatal("target password was not updated")
		}
		if target.TwoFASecret.Valid {
			t.Fatalf("target 2FA should be disabled, got %q", target.TwoFASecret.String)
		}

		var revokedCount int
		if err := store.DB().QueryRow(
			`SELECT COUNT(1) FROM auth_session
			WHERE userId=? AND revokeTimestamp IS NOT NULL AND revokeReason=?`,
			"target-user", "admin_reset",
		).Scan(&revokedCount); err != nil {
			t.Fatalf("count target revoked sessions: %v", err)
		}
		if revokedCount != 2 {
			t.Fatalf("expected 2 target sessions revoked, got %d", revokedCount)
		}
	})

	t.Run("admin cannot reset own password through admin endpoint", func(t *testing.T) {
		resp := callAdminUpdateUser(t, admin, map[string]any{
			"id":    "admin-user",
			"key":   "password",
			"value": "self-new-password",
		})
		if resp.Code != apperr.CanNotResetOwnPassword {
			t.Fatalf("expected %s, got %+v", apperr.CanNotResetOwnPassword, resp)
		}

		updatedAdmin, err := store.GetUserByID("admin-user")
		if err != nil {
			t.Fatalf("get admin user: %v", err)
		}
		ok, _ := store.VerifyPassword(updatedAdmin.Password, "admin-password")
		if !ok {
			t.Fatal("admin password should remain unchanged")
		}
		if !updatedAdmin.TwoFASecret.Valid || updatedAdmin.TwoFASecret.String != "admin-two-fa" {
			t.Fatalf("admin 2FA should remain unchanged, got %+v", updatedAdmin.TwoFASecret)
		}

		var revokedCount int
		if err := store.DB().QueryRow(
			`SELECT COUNT(1) FROM auth_session WHERE id=? AND revokeTimestamp IS NOT NULL`,
			adminSessionID,
		).Scan(&revokedCount); err != nil {
			t.Fatalf("count admin revoked sessions: %v", err)
		}
		if revokedCount != 0 {
			t.Fatalf("admin session should remain active, revoked count %d", revokedCount)
		}
	})
}

func callAdminUpdateUser(t *testing.T, requester *store.User, body map[string]any) struct {
	Code    string `json:"code"`
	Message string `json:"message"`
} {
	t.Helper()

	raw, err := json.Marshal(body)
	if err != nil {
		t.Fatalf("marshal body: %v", err)
	}
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPut, "/api/admin/user", bytes.NewReader(raw))
	c.Set("authed_user", requester)

	AdminUpdateUser(c)

	var resp struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	return resp
}
