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
		"USER01", "creator", store.DoubleMD5("password"), "Creator", "avatar.jpg", now,
	); err != nil {
		t.Fatalf("insert USER01: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO user (id,username,password,nickname,joinTimestamp) VALUES (?,?,?,?,?)`,
		"VIEWER", "viewer", store.DoubleMD5("password"), "Viewer", now,
	); err != nil {
		t.Fatalf("insert viewer: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO artist (id,name,aliases,createTimestamp) VALUES (?,?,?,?)`,
		"ART001", "Performer", joinAliases([]string{"Performer Alias"}), now,
	); err != nil {
		t.Fatalf("insert artist: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO music (id,type,name,aliases,cover,asset,createTimestamp) VALUES (?,?,?,?,?,?,?)`,
		"MUS001", int(store.MusicTypeSong), "Song", joinAliases([]string{"Song Alias"}), "cover.jpg", "song.mp3", now,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}
	if err := store.ReplaceMusicArtistsByRole("MUS001", store.MusicArtistRolePerformer, []string{"ART001"}); err != nil {
		t.Fatalf("link music performers: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO musicbill (id,userId,cover,name,public,createTimestamp) VALUES
			('PUBMB1','USER01','public.jpg','Public',1,?),
			('PRVMB1','USER01','private.jpg','Private',0,?)`,
		now, now,
	); err != nil {
		t.Fatalf("insert musicbills: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO musicbill_music (musicbillId,musicId,addTimestamp) VALUES (?,?,?)`,
		"PUBMB1", "MUS001", now,
	); err != nil {
		t.Fatalf("insert musicbill music: %v", err)
	}

	t.Run("requires userId", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest(http.MethodGet, "/api/common/user", nil)
		c.Set("authed_user", &store.User{ID: "VIEWER"})

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
		c.Request = httptest.NewRequest(http.MethodGet, "/api/common/user?userId=USER01", nil)
		c.Set("authed_user", &store.User{ID: "VIEWER"})

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
		if resp.Data.ID != "USER01" || resp.Data.Username != "creator" || resp.Data.Nickname != "Creator" {
			t.Fatalf("unexpected user payload: %+v", resp.Data)
		}
		if resp.Data.Avatar != "/asset/user_avatar/avatar.jpg" {
			t.Fatalf("unexpected avatar: %s", resp.Data.Avatar)
		}
		if resp.Data.JoinTimestamp != now {
			t.Fatalf("unexpected join timestamp: %d", resp.Data.JoinTimestamp)
		}
		if len(resp.Data.MusicbillList) != 1 || resp.Data.MusicbillList[0].ID != "PUBMB1" {
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
		"ADMIN1", "ADMIN1", adminPasswordHash, "Admin", now, 1, "ADM2FA",
	); err != nil {
		t.Fatalf("insert admin user: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO user (id,username,password,nickname,joinTimestamp,admin,twoFASecret) VALUES (?,?,?,?,?,?,?)`,
		"TARGET", "TARGET", targetPasswordHash, "Target", now, 0, "TGT2FA",
	); err != nil {
		t.Fatalf("insert target user: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO user (id,username,password,nickname,joinTimestamp,admin,twoFASecret) VALUES (?,?,?,?,?,?,?)`,
		"DELETE", "DELETE", targetPasswordHash, "Delete", now, 0, "DEL2FA",
	); err != nil {
		t.Fatalf("insert delete user: %v", err)
	}
	if _, err := store.CreateAuthSession("TARGET", "target-token-hash-1", "target1", "Browser 1"); err != nil {
		t.Fatalf("create target session 1: %v", err)
	}
	if _, err := store.CreateAuthSession("TARGET", "target-token-hash-2", "target2", "Browser 2"); err != nil {
		t.Fatalf("create target session 2: %v", err)
	}
	adminSessionID, err := store.CreateAuthSession("ADMIN1", "admin-token-hash", "admin", "Admin Browser")
	if err != nil {
		t.Fatalf("create admin session: %v", err)
	}

	admin := &store.User{ID: "ADMIN1", Admin: 1}

	t.Run("resetting another user password disables 2FA and revokes sessions", func(t *testing.T) {
		resp := callAdminUpdateUser(t, admin, map[string]any{
			"id":    "TARGET",
			"key":   "password",
			"value": "new-password",
		})
		if resp.Code != apperr.Success {
			t.Fatalf("expected success, got %+v", resp)
		}

		target, err := store.GetUserByID("TARGET")
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
			"TARGET", "admin_reset",
		).Scan(&revokedCount); err != nil {
			t.Fatalf("count target revoked sessions: %v", err)
		}
		if revokedCount != 2 {
			t.Fatalf("expected 2 target sessions revoked, got %d", revokedCount)
		}
	})

	t.Run("admin cannot reset own password through admin endpoint", func(t *testing.T) {
		resp := callAdminUpdateUser(t, admin, map[string]any{
			"id":    "ADMIN1",
			"key":   "password",
			"value": "self-new-password",
		})
		if resp.Code != apperr.CanNotResetOwnPassword {
			t.Fatalf("expected %s, got %+v", apperr.CanNotResetOwnPassword, resp)
		}

		updatedAdmin, err := store.GetUserByID("ADMIN1")
		if err != nil {
			t.Fatalf("get admin user: %v", err)
		}
		ok, _ := store.VerifyPassword(updatedAdmin.Password, "admin-password")
		if !ok {
			t.Fatal("admin password should remain unchanged")
		}
		if !updatedAdmin.TwoFASecret.Valid || updatedAdmin.TwoFASecret.String != "ADM2FA" {
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

	t.Run("admin role change requires captcha fields", func(t *testing.T) {
		resp := callAdminUpdateUserAdmin(t, admin, map[string]any{
			"id":    "TARGET",
			"admin": 1,
		})
		if resp.Code != apperr.WrongParameter {
			t.Fatalf("expected %s, got %+v", apperr.WrongParameter, resp)
		}

		target, err := store.GetUserByID("TARGET")
		if err != nil {
			t.Fatalf("get target user: %v", err)
		}
		if target.Admin != 0 {
			t.Fatalf("target admin role should remain unchanged, got %d", target.Admin)
		}
	})

	t.Run("admin can grant and revoke another user's admin role", func(t *testing.T) {
		seedCaptcha(t, "cap-admin-grant", "abcd")
		resp := callAdminUpdateUserAdmin(t, admin, map[string]any{
			"id":           "TARGET",
			"admin":        1,
			"captchaId":    "cap-admin-grant",
			"captchaValue": "abcd",
		})
		if resp.Code != apperr.Success {
			t.Fatalf("expected grant success, got %+v", resp)
		}

		target, err := store.GetUserByID("TARGET")
		if err != nil {
			t.Fatalf("get target user after grant: %v", err)
		}
		if target.Admin != 1 {
			t.Fatalf("expected target admin flag 1, got %d", target.Admin)
		}

		seedCaptcha(t, "cap-admin-revoke", "abcd")
		resp = callAdminUpdateUserAdmin(t, admin, map[string]any{
			"id":           "TARGET",
			"admin":        0,
			"captchaId":    "cap-admin-revoke",
			"captchaValue": "abcd",
		})
		if resp.Code != apperr.Success {
			t.Fatalf("expected revoke success, got %+v", resp)
		}

		target, err = store.GetUserByID("TARGET")
		if err != nil {
			t.Fatalf("get target user after revoke: %v", err)
		}
		if target.Admin != 0 {
			t.Fatalf("expected target admin flag 0, got %d", target.Admin)
		}
	})

	t.Run("admin role change rejects wrong captcha", func(t *testing.T) {
		seedCaptcha(t, "cap-admin-bad", "abcd")
		resp := callAdminUpdateUserAdmin(t, admin, map[string]any{
			"id":           "TARGET",
			"admin":        1,
			"captchaId":    "cap-admin-bad",
			"captchaValue": "wrong",
		})
		if resp.Code != apperr.WrongCaptcha {
			t.Fatalf("expected %s, got %+v", apperr.WrongCaptcha, resp)
		}

		target, err := store.GetUserByID("TARGET")
		if err != nil {
			t.Fatalf("get target user: %v", err)
		}
		if target.Admin != 0 {
			t.Fatalf("target admin role should remain unchanged, got %d", target.Admin)
		}
	})

	t.Run("admin cannot change own admin role", func(t *testing.T) {
		resp := callAdminUpdateUserAdmin(t, admin, map[string]any{
			"id":           "ADMIN1",
			"admin":        0,
			"captchaId":    "cap-unused",
			"captchaValue": "abcd",
		})
		if resp.Code != apperr.UserIsAdminAlready {
			t.Fatalf("expected %s, got %+v", apperr.UserIsAdminAlready, resp)
		}

		updatedAdmin, err := store.GetUserByID("ADMIN1")
		if err != nil {
			t.Fatalf("get admin user: %v", err)
		}
		if updatedAdmin.Admin != 1 {
			t.Fatalf("admin role should remain unchanged, got %d", updatedAdmin.Admin)
		}
	})

	t.Run("admin delete user requires captcha", func(t *testing.T) {
		seedCaptcha(t, "cap-delete-ok", "abcd")
		resp := callAdminDeleteUser(t, admin, "DELETE", "cap-delete-ok", "abcd")
		if resp.Code != apperr.Success {
			t.Fatalf("expected delete success, got %+v", resp)
		}

		if _, err := store.GetUserByID("DELETE"); err == nil {
			t.Fatal("deleted user should not exist")
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

func callAdminUpdateUserAdmin(t *testing.T, requester *store.User, body map[string]any) struct {
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
	c.Request = httptest.NewRequest(http.MethodPut, "/api/admin/user_admin", bytes.NewReader(raw))
	c.Set("authed_user", requester)

	AdminUpdateUserAdmin(c)

	var resp struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	return resp
}

func callAdminDeleteUser(t *testing.T, requester *store.User, id, captchaID, captchaValue string) struct {
	Code    string `json:"code"`
	Message string `json:"message"`
} {
	t.Helper()

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	req := httptest.NewRequest(http.MethodDelete, "/api/admin/user", nil)
	q := req.URL.Query()
	q.Set("id", id)
	q.Set("captchaId", captchaID)
	q.Set("captchaValue", captchaValue)
	req.URL.RawQuery = q.Encode()
	c.Request = req
	c.Set("authed_user", requester)

	AdminDeleteUser(c)

	var resp struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	return resp
}
