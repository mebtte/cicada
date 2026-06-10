// Package handler contains all Gin HTTP handler functions.
package handler

import (
	"cicada/internal/api"
	"cicada/internal/api/apperr"
	"cicada/internal/api/middleware"
	"cicada/internal/auth"
	"cicada/internal/config"
	"cicada/internal/store"
	"cicada/internal/version"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// ── Metadata ──────────────────────────────────────────────────────────────────

func GetMetadata(c *gin.Context) {
	hostname, _ := os.Hostname()
	cfg := config.Get()
	api.OK(c, gin.H{
		"hostname":         hostname,
		"version":          version.Get(),
		"imageFileMaxSize": cfg.ImageFileMaxSize,
		"audioFileMaxSize": cfg.AudioFileMaxSize,
		"videoFileMaxSize": cfg.VideoFileMaxSize,
	})
}

// ── Captcha ───────────────────────────────────────────────────────────────────

func GetCaptcha(c *gin.Context) {
	id, svg, err := auth.NewCaptcha()
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	api.OK(c, gin.H{"id": id, "svg": svg})
}

// ── Login ─────────────────────────────────────────────────────────────────────

const loginInterval = 3 * time.Second

var loginMu sync.Mutex
var loginLastTime = map[string]time.Time{}

type loginBody struct {
	Username     string `json:"username" binding:"required"`
	Password     string `json:"password" binding:"required"`
	CaptchaID    string `json:"captchaId" binding:"required"`
	CaptchaValue string `json:"captchaValue" binding:"required"`
	DeviceName   string `json:"deviceName"`
}

type loginResponse struct {
	Token     string `json:"token"`
	SessionID string `json:"sessionId"`
}

func Login(c *gin.Context) {
	var body loginBody
	if err := c.ShouldBindJSON(&body); err != nil || !validPasswordLength(body.Password) {
		api.Fail(c, apperr.WrongParameter)
		return
	}

	now := time.Now()
	loginMu.Lock()
	if last, ok := loginLastTime[body.Username]; ok && now.Sub(last) < loginInterval {
		loginMu.Unlock()
		api.Fail(c, apperr.LoginTooFrequent)
		return
	}
	loginLastTime[body.Username] = now
	for k, v := range loginLastTime {
		if now.Sub(v) >= loginInterval {
			delete(loginLastTime, k)
		}
	}
	loginMu.Unlock()

	ok, _ := auth.VerifyCaptcha(body.CaptchaID, body.CaptchaValue)
	if !ok {
		api.Fail(c, apperr.WrongCaptcha)
		return
	}

	u, err := store.GetUserByUsername(body.Username)
	if err != nil || !verifyLoginPassword(u, body.Password) {
		api.Fail(c, apperr.WrongUsernameOrPassword)
		return
	}

	if u.TwoFASecret.Valid && auth.TOTPEnabled(u.TwoFASecret.String) {
		api.Fail(c, apperr.Need2FA)
		return
	}

	resp, err := createLoginSession(c, u.ID, body.DeviceName)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	api.OK(c, resp)
}

// ── Login with 2FA ────────────────────────────────────────────────────────────

var login2FAMu sync.Mutex
var login2FALast = map[string]time.Time{}

type login2FABody struct {
	Username   string `json:"username" binding:"required"`
	Password   string `json:"password" binding:"required"`
	TwoFAToken string `json:"twoFAToken" binding:"required"`
	DeviceName string `json:"deviceName"`
}

func LoginWith2FA(c *gin.Context) {
	var body login2FABody
	if err := c.ShouldBindJSON(&body); err != nil || !validPasswordLength(body.Password) {
		api.Fail(c, apperr.WrongParameter)
		return
	}

	now := time.Now()
	login2FAMu.Lock()
	if last, ok := login2FALast[body.Username]; ok && now.Sub(last) < loginInterval {
		login2FAMu.Unlock()
		api.Fail(c, apperr.LoginWith2FATooFrequent)
		return
	}
	login2FALast[body.Username] = now
	for k, v := range login2FALast {
		if now.Sub(v) >= loginInterval {
			delete(login2FALast, k)
		}
	}
	login2FAMu.Unlock()

	u, err := store.GetUserByUsername(body.Username)
	if err != nil || !verifyLoginPassword(u, body.Password) {
		api.Fail(c, apperr.WrongUsernameOrPassword)
		return
	}

	if !u.TwoFASecret.Valid || !auth.TOTPEnabled(u.TwoFASecret.String) {
		api.Fail(c, apperr.NoNeedTo2FA)
		return
	}

	if !auth.ValidateTOTP(body.TwoFAToken, u.TwoFASecret.String) {
		api.Fail(c, apperr.Wrong2FAToken)
		return
	}

	resp, err := createLoginSession(c, u.ID, body.DeviceName)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	api.OK(c, resp)
}

func verifyLoginPassword(u *store.User, password string) bool {
	ok, needsUpgrade := store.VerifyPassword(u.Password, password)
	if ok && needsUpgrade {
		if hash, err := store.HashPassword(password); err == nil {
			_ = store.UpdateUser(u.ID, "password", hash)
		}
	}
	return ok
}

func createLoginSession(c *gin.Context, userID, deviceName string) (loginResponse, error) {
	token, tokenPrefix, tokenHash, err := auth.NewSessionToken()
	if err != nil {
		return loginResponse{}, err
	}
	if deviceName == "" {
		deviceName = defaultDeviceName(c.Request.UserAgent())
	}
	sessionID, err := store.CreateAuthSession(
		userID,
		tokenHash,
		tokenPrefix,
		limitString(deviceName, 80),
	)
	if err != nil {
		return loginResponse{}, err
	}
	return loginResponse{Token: token, SessionID: sessionID}, nil
}

func defaultDeviceName(userAgent string) string {
	if userAgent == "" {
		return "Unknown device"
	}
	browser := detectBrowserName(userAgent)
	osName := detectOSName(userAgent)
	if browser != "" && osName != "" {
		return browser + " on " + osName
	}
	if browser != "" {
		return browser
	}
	if osName != "" {
		return osName
	}
	return "Unknown device"
}

func detectBrowserName(userAgent string) string {
	switch {
	case strings.Contains(userAgent, "Edg/"):
		return "Edge"
	case strings.Contains(userAgent, "OPR/"):
		return "Opera"
	case strings.Contains(userAgent, "Firefox/") || strings.Contains(userAgent, "FxiOS/"):
		return "Firefox"
	case strings.Contains(userAgent, "CriOS/") ||
		strings.Contains(userAgent, "Chrome/") ||
		strings.Contains(userAgent, "Chromium/"):
		return "Chrome"
	case strings.Contains(userAgent, "Safari/"):
		return "Safari"
	default:
		return ""
	}
}

func detectOSName(userAgent string) string {
	switch {
	case strings.Contains(userAgent, "iPhone") ||
		strings.Contains(userAgent, "iPad") ||
		strings.Contains(userAgent, "iPod"):
		return "iOS"
	case strings.Contains(userAgent, "Android"):
		return "Android"
	case strings.Contains(userAgent, "Windows NT"):
		return "Windows"
	case strings.Contains(userAgent, "Mac OS X") || strings.Contains(userAgent, "Macintosh"):
		return "macOS"
	case strings.Contains(userAgent, "Linux"):
		return "Linux"
	default:
		return ""
	}
}

func limitString(v string, n int) string {
	if len(v) <= n {
		return v
	}
	return v[:n]
}

// ── 2FA management ────────────────────────────────────────────────────────────

func Create2FA(c *gin.Context) {
	u := middleware.GetUser(c)
	if u.TwoFASecret.Valid && auth.TOTPEnabled(u.TwoFASecret.String) {
		api.Fail(c, apperr.TwoFAEnabledAlready)
		return
	}
	secret, url, err := auth.NewTOTPSecret(u.Username, "Cicada")
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	store.UpdateUser(u.ID, "twoFASecret", secret)
	api.OK(c, gin.H{"secret": secret[len(auth.UnusedTOTPPrefix):], "url": url})
}

type twoFATokenBody struct {
	Token string `json:"token" binding:"required"`
}

func Enable2FA(c *gin.Context) {
	u := middleware.GetUser(c)
	var body twoFATokenBody
	if err := c.ShouldBindJSON(&body); err != nil {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	if !u.TwoFASecret.Valid || u.TwoFASecret.String == "" {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	if auth.TOTPEnabled(u.TwoFASecret.String) {
		api.Fail(c, apperr.TwoFAEnabledAlready)
		return
	}
	if !auth.ValidateTOTP(body.Token, u.TwoFASecret.String) {
		api.Fail(c, apperr.Wrong2FAToken)
		return
	}
	// Remove the unused_ prefix to mark as active
	activeSecret := u.TwoFASecret.String[len(auth.UnusedTOTPPrefix):]
	store.UpdateUser(u.ID, "twoFASecret", activeSecret)
	api.OK(c, nil)
}

func Disable2FA(c *gin.Context) {
	u := middleware.GetUser(c)
	var body twoFATokenBody
	if err := c.ShouldBindJSON(&body); err != nil {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	if !u.TwoFASecret.Valid || !auth.TOTPEnabled(u.TwoFASecret.String) {
		api.Fail(c, apperr.NoNeedTo2FA)
		return
	}
	if !auth.ValidateTOTP(body.Token, u.TwoFASecret.String) {
		api.Fail(c, apperr.Wrong2FAToken)
		return
	}
	store.UpdateUser(u.ID, "twoFASecret", nil)
	api.OK(c, nil)
}
