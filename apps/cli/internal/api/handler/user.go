package handler

import (
	"cicada/internal/api"
	"cicada/internal/api/apperr"
	"cicada/internal/api/middleware"
	"cicada/internal/auth"
	"cicada/internal/config"
	"cicada/internal/store"
	"database/sql"
	"fmt"
	"math/rand"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func nullStr(v sql.NullString) any {
	if !v.Valid {
		return nil
	}
	return v.String
}

// ── Profile ───────────────────────────────────────────────────────────────────

func GetProfile(c *gin.Context) {
	u := middleware.GetUser(c)
	go store.TouchUser(u.ID)
	api.OK(c, gin.H{
		"id":                         u.ID,
		"username":                   u.Username,
		"avatar":                     u.Avatar,
		"nickname":                   u.Nickname,
		"joinTimestamp":              u.JoinTimestamp,
		"admin":                      u.Admin,
		"musicbillOrdersJSON":        nullStr(u.MusicbillOrdersJSON),
		"musicbillMaxAmount":         u.MusicbillMaxAmount,
		"createMusicMaxAmountPerDay": u.CreateMusicMaxAmountPerDay,
		"lastActiveTimestamp":        u.LastActiveTimestamp,
		"musicPlayRecordIndate":      u.MusicPlayRecordIndate,
		"twoFAEnabled":               u.TwoFASecret.Valid && auth.TOTPEnabled(u.TwoFASecret.String),
	})
}

type updateProfileBody struct {
	Key   string `json:"key" binding:"required"`
	Value any    `json:"value"`
}

type updatePasswordValue struct {
	Password        string `json:"password"`
	CurrentPassword string `json:"currentPassword"`
	TwoFAToken      string `json:"twoFAToken"`
}

func UpdateProfile(c *gin.Context) {
	u := middleware.GetUser(c)
	var body updateProfileBody
	if err := c.ShouldBindJSON(&body); err != nil {
		api.Fail(c, apperr.WrongParameter)
		return
	}

	switch body.Key {
	case "password":
		value, ok := decodeUpdatePasswordValue(body.Value)
		if !ok || !validPasswordLength(value.Password) {
			api.Fail(c, apperr.WrongParameter)
			return
		}
		if !validateCurrentCredential(u, value.CurrentPassword, value.TwoFAToken) {
			api.Fail(c, apperr.WrongUsernameOrPassword)
			return
		}
		passwordHash, err := store.HashPassword(value.Password)
		if err != nil {
			api.Fail(c, apperr.ServerError)
			return
		}
		store.UpdateUser(u.ID, "password", passwordHash)
		if s := middleware.GetSession(c); s != nil {
			store.RevokeOtherAuthSessions(u.ID, s.ID, time.Now().UnixMilli(), "password_changed")
		}
		api.OK(c, nil)

	case "avatar":
		avatar, ok := body.Value.(string)
		if !ok || avatar == "" || !assetExists(avatar, config.AssetTypeUserAvatar) {
			api.Fail(c, apperr.AssetNotExisted)
			return
		}
		store.UpdateUser(u.ID, "avatar", avatar)
		api.OK(c, nil)

	case "nickname":
		nick, ok := body.Value.(string)
		if !ok || nick == "" || len(nick) > 30 || strings.TrimSpace(nick) != nick {
			api.Fail(c, apperr.WrongParameter)
			return
		}
		if nick == u.Nickname {
			api.Fail(c, apperr.NoNeedToUpdate)
			return
		}
		var existID string
		if store.DB().QueryRow(`SELECT id FROM user WHERE nickname=?`, nick).Scan(&existID) == nil {
			api.Fail(c, apperr.NicknameHasUsedByOthers)
			return
		}
		store.UpdateUser(u.ID, "nickname", nick)
		api.OK(c, nil)

	case "musicbillOrders":
		raw, ok := body.Value.([]any)
		if !ok || len(raw) == 0 {
			api.Fail(c, apperr.WrongParameter)
			return
		}
		ids := make([]string, len(raw))
		for i, v := range raw {
			s, ok := v.(string)
			if !ok {
				api.Fail(c, apperr.WrongParameter)
				return
			}
			ids[i] = s
		}
		var count int
		store.DB().QueryRow(`SELECT COUNT(1) FROM musicbill WHERE id IN (`+store.Placeholders(len(ids))+`)`, store.Strs2Any(ids)...).Scan(&count)
		if count < len(ids) {
			api.Fail(c, apperr.MusicbillNotExisted)
			return
		}
		store.UpdateUser(u.ID, "musicbillOrdersJSON", `["`+strings.Join(ids, `","`)+`"]`)
		api.OK(c, nil)

	default:
		api.Fail(c, apperr.WrongParameter)
	}
}

func decodeUpdatePasswordValue(value any) (updatePasswordValue, bool) {
	raw, ok := value.(map[string]any)
	if !ok {
		return updatePasswordValue{}, false
	}
	out := updatePasswordValue{}
	if v, ok := raw["password"].(string); ok {
		out.Password = v
	}
	if v, ok := raw["currentPassword"].(string); ok {
		out.CurrentPassword = v
	}
	if v, ok := raw["twoFAToken"].(string); ok {
		out.TwoFAToken = v
	}
	return out, out.Password != "" && (out.CurrentPassword != "" || out.TwoFAToken != "")
}

func validateCurrentCredential(u *store.User, password, twoFAToken string) bool {
	if password != "" {
		ok, _ := store.VerifyPassword(u.Password, password)
		if ok {
			return true
		}
	}
	if twoFAToken != "" && u.TwoFASecret.Valid && auth.TOTPEnabled(u.TwoFASecret.String) {
		return auth.ValidateTOTP(twoFAToken, u.TwoFASecret.String)
	}
	return false
}

func GetUser(c *gin.Context) {
	uid := c.Query("uid")
	if uid == "" {
		api.Fail(c, apperr.WrongParameter)
		return
	}

	user, err := store.GetUserByID(uid)
	if err != nil {
		api.Fail(c, apperr.UserNotExisted)
		return
	}

	type publicMusicbill struct {
		ID         string
		Cover      string
		Name       string
		MusicCount int
	}
	rows, err := store.DB().Query(
		`SELECT id,cover,name,
			(SELECT COUNT(1) FROM musicbill_music WHERE musicbillId=musicbill.id)
		FROM musicbill
		WHERE userId=? AND public=1
		ORDER BY createTimestamp DESC`,
		uid,
	)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	defer rows.Close()

	musicbills := []publicMusicbill{}
	for rows.Next() {
		mb := publicMusicbill{}
		if err := rows.Scan(&mb.ID, &mb.Cover, &mb.Name, &mb.MusicCount); err != nil {
			api.Fail(c, apperr.ServerError)
			return
		}
		musicbills = append(musicbills, mb)
	}
	if err := rows.Err(); err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}

	musicbillItems := make([]gin.H, len(musicbills))
	for i, mb := range musicbills {
		musicbillItems[i] = gin.H{
			"id":         mb.ID,
			"cover":      config.AssetPublicURL(mb.Cover, config.AssetTypeMusicbillCover),
			"name":       mb.Name,
			"musicCount": mb.MusicCount,
		}
	}

	api.OK(c, gin.H{
		"id":            user.ID,
		"avatar":        config.AssetPublicURL(user.Avatar, config.AssetTypeUserAvatar),
		"joinTimestamp": user.JoinTimestamp,
		"nickname":      user.Nickname,
		"username":      user.Username,
		"musicbillList": musicbillItems,
	})
}

// ── Admin user management ─────────────────────────────────────────────────────

type createUserBody struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Remark   string `json:"remark"`
}

func AdminCreateUser(c *gin.Context) {
	var body createUserBody
	if err := c.ShouldBindJSON(&body); err != nil ||
		len(body.Username) > 30 || !validPasswordLength(body.Password) || len(body.Remark) > 200 {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	if _, err := store.GetUserByUsername(body.Username); err == nil {
		api.Fail(c, apperr.UsernameAlreadyRegistered)
		return
	}
	id := randUserID()
	if err := store.CreateUser(id, body.Username, body.Password, body.Remark); err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	api.OK(c, nil)
}

type updateUserBody struct {
	ID    string `json:"id" binding:"required"`
	Key   string `json:"key" binding:"required"`
	Value any    `json:"value"`
}

func AdminUpdateUser(c *gin.Context) {
	var body updateUserBody
	if err := c.ShouldBindJSON(&body); err != nil {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	allowed := map[string]bool{
		"remark": true, "musicbillMaxAmount": true,
		"createMusicMaxAmountPerDay": true, "musicPlayRecordIndate": true, "password": true,
	}
	if !allowed[body.Key] {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	if _, err := store.GetUserByID(body.ID); err != nil {
		api.Fail(c, apperr.UserNotExisted)
		return
	}
	if body.Key == "password" {
		pwd, ok := body.Value.(string)
		if !ok || !validPasswordLength(pwd) {
			api.Fail(c, apperr.WrongParameter)
			return
		}
		passwordHash, err := store.HashPassword(pwd)
		if err != nil {
			api.Fail(c, apperr.ServerError)
			return
		}
		store.UpdateUser(body.ID, "password", passwordHash)
		store.RevokeAllAuthSessions(body.ID, time.Now().UnixMilli(), "admin_reset")
		api.OK(c, nil)
		return
	}
	store.UpdateUser(body.ID, body.Key, body.Value)
	api.OK(c, nil)
}

type updateUserAdminBody struct {
	ID    string `json:"id" binding:"required"`
	Admin int    `json:"admin"`
}

func AdminUpdateUserAdmin(c *gin.Context) {
	requester := middleware.GetUser(c)
	var body updateUserAdminBody
	if err := c.ShouldBindJSON(&body); err != nil {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	if body.ID == requester.ID {
		api.Fail(c, apperr.UserIsAdminAlready)
		return
	}
	target, err := store.GetUserByID(body.ID)
	if err != nil {
		api.Fail(c, apperr.UserNotExisted)
		return
	}
	if body.Admin == 1 && target.Admin == 1 {
		api.Fail(c, apperr.UserIsAdminAlready)
		return
	}
	store.UpdateUser(body.ID, "admin", body.Admin)
	api.OK(c, nil)
}

type deleteUserQuery struct {
	ID string `form:"id" binding:"required"`
}

func AdminDeleteUser(c *gin.Context) {
	var q deleteUserQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	target, err := store.GetUserByID(q.ID)
	if err != nil {
		api.Fail(c, apperr.UserNotExisted)
		return
	}
	if target.Admin == 1 {
		api.Fail(c, apperr.CanNotDeleteAdmin)
		return
	}
	store.DeleteUser(q.ID)
	api.OK(c, nil)
}

func AdminGetUserList(c *gin.Context) {
	users, err := store.GetAllUsers()
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	list := make([]gin.H, len(users))
	for i, u := range users {
		list[i] = gin.H{
			"id":                         u.ID,
			"username":                   u.Username,
			"nickname":                   u.Nickname,
			"avatar":                     config.AssetPublicURL(u.Avatar, config.AssetTypeUserAvatar),
			"joinTimestamp":              u.JoinTimestamp,
			"admin":                      u.Admin,
			"remark":                     u.Remark,
			"musicbillMaxAmount":         u.MusicbillMaxAmount,
			"createMusicMaxAmountPerDay": u.CreateMusicMaxAmountPerDay,
			"lastActiveTimestamp":        u.LastActiveTimestamp,
			"musicPlayRecordIndate":      u.MusicPlayRecordIndate,
		}
	}
	api.OK(c, list)
}

func randUserID() string {
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	return fmt.Sprintf("%d", 10000+r.Intn(9990000))
}
