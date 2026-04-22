// Package handler contains all Gin HTTP handler functions.
package handler

import (
	"cicada/internal/api"
	"cicada/internal/api/apperr"
	"cicada/internal/api/middleware"
	"cicada/internal/auth"
	"cicada/internal/store"
	"cicada/internal/version"
	"os"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// ── Metadata ──────────────────────────────────────────────────────────────────

func GetMetadata(c *gin.Context) {
	hostname, _ := os.Hostname()
	api.OK(c, gin.H{"hostname": hostname, "version": version.Get()})
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
}

func Login(c *gin.Context) {
	var body loginBody
	if err := c.ShouldBindJSON(&body); err != nil {
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
	if err != nil || u.Password != store.DoubleMD5(body.Password) {
		api.Fail(c, apperr.WrongUsernameOrPassword)
		return
	}

	if u.TwoFASecret.Valid && auth.TOTPEnabled(u.TwoFASecret.String) {
		api.Fail(c, apperr.Need2FA)
		return
	}

	token, err := auth.JWTSign(u.ID, u.TokenIdentifier)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	api.OK(c, token)
}

// ── Login with 2FA ────────────────────────────────────────────────────────────

var login2FAMu sync.Mutex
var login2FALast = map[string]time.Time{}

type login2FABody struct {
	Username   string `json:"username" binding:"required"`
	Password   string `json:"password" binding:"required"`
	TwoFAToken string `json:"twoFAToken" binding:"required"`
}

func LoginWith2FA(c *gin.Context) {
	var body login2FABody
	if err := c.ShouldBindJSON(&body); err != nil {
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
	if err != nil || u.Password != store.DoubleMD5(body.Password) {
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

	token, err := auth.JWTSign(u.ID, u.TokenIdentifier)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	api.OK(c, token)
}

// ── Music play record (sendBeacon – token in body) ────────────────────────────

const effectivePlayPercent = 0.75

type playRecordBeaconBody struct {
	Token   string  `json:"token" binding:"required"`
	MusicID string  `json:"musicId" binding:"required"`
	Percent float64 `json:"percent"`
}

func CreateMusicPlayRecordBeacon(c *gin.Context) {
	var body playRecordBeaconBody
	if err := c.ShouldBindJSON(&body); err != nil || body.Percent < 0 || body.Percent > 1 {
		api.Fail(c, apperr.WrongParameter)
		return
	}

	userID, tokenID, err := auth.JWTVerify(body.Token)
	if err != nil {
		api.Fail(c, apperr.NotAuthorized)
		return
	}
	u, err := store.GetUserByID(userID)
	if err != nil || u.TokenIdentifier != tokenID {
		api.Fail(c, apperr.NotAuthorized)
		return
	}

	m, err := store.GetMusicByID(body.MusicID)
	if err != nil || m == nil {
		api.Fail(c, apperr.MusicNotExisted)
		return
	}

	store.AddPlayRecord(userID, body.MusicID, body.Percent)
	if body.Percent >= effectivePlayPercent {
		store.IncrMusicHeat(body.MusicID)
	}
	api.OK(c, nil)
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

type enable2FABody struct {
	Token string `json:"token" binding:"required"`
}

func Enable2FA(c *gin.Context) {
	u := middleware.GetUser(c)
	var body enable2FABody
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
	if !u.TwoFASecret.Valid || !auth.TOTPEnabled(u.TwoFASecret.String) {
		api.Fail(c, apperr.NoNeedTo2FA)
		return
	}
	store.UpdateUser(u.ID, "twoFASecret", nil)
	api.OK(c, nil)
}
