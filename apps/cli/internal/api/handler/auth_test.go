package handler

import (
	"bytes"
	"cicada/internal/api/apperr"
	"cicada/internal/auth"
	"cicada/internal/config"
	"cicada/internal/store"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pquerna/otp/totp"
)

func TestDisable2FARequiresValidToken(t *testing.T) {
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

	secret, _, err := auth.NewTOTPSecret("creator", "Cicada")
	if err != nil {
		t.Fatalf("create totp secret: %v", err)
	}
	activeSecret := secret[len(auth.UnusedTOTPPrefix):]
	if _, err := store.DB().Exec(
		`INSERT INTO user (id,username,password,nickname,joinTimestamp,twoFASecret) VALUES (?,?,?,?,?,?)`,
		"USER01", "creator", store.DoubleMD5("password"), "Creator", time.Now().UnixMilli(), activeSecret,
	); err != nil {
		t.Fatalf("insert user: %v", err)
	}

	validToken, err := totp.GenerateCode(activeSecret, time.Now())
	if err != nil {
		t.Fatalf("generate totp token: %v", err)
	}
	wrongToken := "000000"
	if wrongToken == validToken {
		wrongToken = "000001"
	}

	wrongResp := callDisable2FA(t, wrongToken, activeSecret)
	if wrongResp.Code != apperr.Wrong2FAToken {
		t.Fatalf("expected %s, got %s", apperr.Wrong2FAToken, wrongResp.Code)
	}
	u, err := store.GetUserByID("USER01")
	if err != nil {
		t.Fatalf("get user after wrong token: %v", err)
	}
	if !u.TwoFASecret.Valid || u.TwoFASecret.String != activeSecret {
		t.Fatalf("expected 2FA secret to remain enabled after wrong token")
	}

	successResp := callDisable2FA(t, validToken, activeSecret)
	if successResp.Code != apperr.Success {
		t.Fatalf("expected %s, got %s", apperr.Success, successResp.Code)
	}
	u, err = store.GetUserByID("USER01")
	if err != nil {
		t.Fatalf("get user after valid token: %v", err)
	}
	if u.TwoFASecret.Valid {
		t.Fatalf("expected 2FA secret to be cleared after valid token")
	}
}

func TestGetMetadataIncludesFileMaxSizes(t *testing.T) {
	gin.SetMode(gin.TestMode)
	config.Set(config.Config{
		Mode:             config.ModeProduction,
		Data:             t.TempDir(),
		Port:             8000,
		ImageFileMaxSize: 4 * 1024 * 1024,
		AudioFileMaxSize: 123 * 1024 * 1024,
		VideoFileMaxSize: 777 * 1024 * 1024,
	})

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/base/metadata", nil)

	GetMetadata(c)

	var resp struct {
		Code string `json:"code"`
		Data struct {
			Hostname         string `json:"hostname"`
			Version          string `json:"version"`
			ImageFileMaxSize int64  `json:"imageFileMaxSize"`
			AudioFileMaxSize int64  `json:"audioFileMaxSize"`
			VideoFileMaxSize int64  `json:"videoFileMaxSize"`
		} `json:"data"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.Code != apperr.Success {
		t.Fatalf("expected success, got %s", resp.Code)
	}
	if resp.Data.ImageFileMaxSize != 4*1024*1024 {
		t.Fatalf("expected image file max size %d, got %d", 4*1024*1024, resp.Data.ImageFileMaxSize)
	}
	if resp.Data.AudioFileMaxSize != 123*1024*1024 {
		t.Fatalf("expected audio file max size %d, got %d", 123*1024*1024, resp.Data.AudioFileMaxSize)
	}
	if resp.Data.VideoFileMaxSize != 777*1024*1024 {
		t.Fatalf("expected video file max size %d, got %d", 777*1024*1024, resp.Data.VideoFileMaxSize)
	}
}

func callDisable2FA(t *testing.T, token string, secret string) struct {
	Code string `json:"code"`
} {
	t.Helper()

	body, err := json.Marshal(map[string]string{"token": token})
	if err != nil {
		t.Fatalf("encode request: %v", err)
	}

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodDelete, "/api/common/2fa", bytes.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Set("authed_user", &store.User{
		ID:          "USER01",
		TwoFASecret: sql.NullString{String: secret, Valid: true},
	})

	Disable2FA(c)

	var resp struct {
		Code string `json:"code"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	return resp
}
