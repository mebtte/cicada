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

func setupTransferOwnerHandlerTest(t *testing.T) {
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
		`INSERT INTO user (id,username,password,nickname,joinTimestamp) VALUES
			('owner','owner',?, 'Owner', ?),
			('shared','shared',?, 'Shared', ?),
			('pending','pending',?, 'Pending', ?),
			('stranger','stranger',?, 'Stranger', ?)`,
		store.DoubleMD5("password"), now,
		store.DoubleMD5("password"), now,
		store.DoubleMD5("password"), now,
		store.DoubleMD5("password"), now,
	); err != nil {
		t.Fatalf("insert users: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO musicbill (id,userId,name,createTimestamp) VALUES ('mb-1','owner','Bill',?)`,
		now,
	); err != nil {
		t.Fatalf("insert musicbill: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO shared_musicbill (musicbillId,sharedUserId,inviteUserId,inviteTimestamp,accepted) VALUES
			('mb-1','shared','owner',?,1),
			('mb-1','pending','owner',?,0)`,
		now, now,
	); err != nil {
		t.Fatalf("insert shared rows: %v", err)
	}
}

// seedCaptcha 插入一条新鲜的 captcha, 返回 id+value 供 body 使用.
func seedCaptcha(t *testing.T, id, value string) {
	t.Helper()
	if _, err := store.DB().Exec(
		`INSERT INTO captcha (id,value,createTimestamp) VALUES (?,?,?)`,
		id, value, time.Now().UnixMilli(),
	); err != nil {
		t.Fatalf("seed captcha: %v", err)
	}
}

func callTransferOwner(t *testing.T, userID string, body map[string]any) (string, *httptest.ResponseRecorder) {
	t.Helper()
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	buf, err := json.Marshal(body)
	if err != nil {
		t.Fatalf("marshal body: %v", err)
	}
	req := httptest.NewRequest(http.MethodPut, "/api/musicbill/owner", bytes.NewReader(buf))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req
	c.Set("authed_user", &store.User{ID: userID})
	TransferMusicbillOwner(c)

	var parsed struct {
		Code string `json:"code"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &parsed); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	return parsed.Code, w
}

func TestTransferMusicbillOwnerHandler(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		setupTransferOwnerHandlerTest(t)
		seedCaptcha(t, "cap-ok", "abcd")

		code, _ := callTransferOwner(t, "owner", map[string]any{
			"musicbillId":  "mb-1",
			"userId":       "shared",
			"captchaId":    "cap-ok",
			"captchaValue": "abcd",
		})
		if code != "success" {
			t.Fatalf("expected success, got %q", code)
		}
		mb, _ := store.GetMusicbillByID("mb-1")
		if mb.UserID != "shared" {
			t.Fatalf("expected owner=shared, got %q", mb.UserID)
		}
	})

	t.Run("wrong captcha", func(t *testing.T) {
		setupTransferOwnerHandlerTest(t)
		seedCaptcha(t, "cap-bad", "abcd")

		code, _ := callTransferOwner(t, "owner", map[string]any{
			"musicbillId":  "mb-1",
			"userId":       "shared",
			"captchaId":    "cap-bad",
			"captchaValue": "wrong",
		})
		if code != "wrong_captcha" {
			t.Fatalf("expected wrong_captcha, got %q", code)
		}
	})

	t.Run("caller is not owner", func(t *testing.T) {
		setupTransferOwnerHandlerTest(t)
		seedCaptcha(t, "cap-x", "abcd")

		code, _ := callTransferOwner(t, "stranger", map[string]any{
			"musicbillId":  "mb-1",
			"userId":       "shared",
			"captchaId":    "cap-x",
			"captchaValue": "abcd",
		})
		if code != "not_musicbill_owner" {
			t.Fatalf("expected not_musicbill_owner, got %q", code)
		}
	})

	t.Run("target is self", func(t *testing.T) {
		setupTransferOwnerHandlerTest(t)
		code, _ := callTransferOwner(t, "owner", map[string]any{
			"musicbillId":  "mb-1",
			"userId":       "owner",
			"captchaId":    "cap-unused",
			"captchaValue": "abcd",
		})
		if code != "wrong_parameter" {
			t.Fatalf("expected wrong_parameter, got %q", code)
		}
	})

	t.Run("target has not accepted", func(t *testing.T) {
		setupTransferOwnerHandlerTest(t)
		seedCaptcha(t, "cap-p", "abcd")

		code, _ := callTransferOwner(t, "owner", map[string]any{
			"musicbillId":  "mb-1",
			"userId":       "pending",
			"captchaId":    "cap-p",
			"captchaValue": "abcd",
		})
		if code != "target_user_not_accepted_shared_user" {
			t.Fatalf("expected target_user_not_accepted_shared_user, got %q", code)
		}
	})

	t.Run("target not in shared list", func(t *testing.T) {
		setupTransferOwnerHandlerTest(t)
		seedCaptcha(t, "cap-s", "abcd")

		code, _ := callTransferOwner(t, "owner", map[string]any{
			"musicbillId":  "mb-1",
			"userId":       "stranger",
			"captchaId":    "cap-s",
			"captchaValue": "abcd",
		})
		if code != "target_user_not_accepted_shared_user" {
			t.Fatalf("expected target_user_not_accepted_shared_user, got %q", code)
		}
	})
}
