package middleware

import (
	"cicada/internal/api"
	"cicada/internal/api/apperr"
	"cicada/internal/auth"
	"cicada/internal/config"
	"cicada/internal/store"
	"errors"
	"time"

	"github.com/gin-gonic/gin"
)

const (
	headerToken = "x-cicada-token"
	ctxUser     = "authed_user"
	ctxSession  = "auth_session"
)

var errNotAuthorized = errors.New("not authorized")

// Auth validates the session token and injects *store.User into the context.
func Auth() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.GetHeader(headerToken)
		u, s, err := AuthenticateToken(c, token)
		if err != nil {
			api.Fail(c, apperr.NotAuthorized)
			return
		}
		c.Set(ctxUser, u)
		c.Set(ctxSession, s)
		c.Next()
	}
}

func AuthenticateToken(c *gin.Context, token string) (*store.User, *store.AuthSession, error) {
	if !auth.ValidSessionToken(token) {
		return nil, nil, errNotAuthorized
	}
	now := time.Now()
	s, u, err := store.GetActiveAuthSessionByTokenHash(
		auth.SessionTokenHash(token),
		auth.SessionActiveAfter(now),
	)
	if err != nil {
		return nil, nil, err
	}
	if s.LastSeenTimestamp < now.Add(-auth.SessionTouchInterval).UnixMilli() {
		ip := c.ClientIP()
		go store.TouchAuthSession(s.ID, ip, now.UnixMilli(), now.Add(-auth.SessionTouchInterval).UnixMilli())
		s.LastSeenTimestamp = now.UnixMilli()
		s.LastSeenIP = ip
	}
	u.Avatar = config.AssetPublicURL(u.Avatar, config.AssetTypeUserAvatar)
	return u, s, nil
}

// Admin ensures the authenticated user has admin flag.
// Must be chained AFTER Auth() in the same handler chain, since it reads the
// user injected by Auth(): r.GET(path, Auth(), Admin(), handler).
func Admin() gin.HandlerFunc {
	return func(c *gin.Context) {
		u := GetUser(c)
		if u == nil || u.Admin != 1 {
			api.Fail(c, apperr.NotAuthorizedForAdmin)
			return
		}
		c.Next()
	}
}

// GetUser retrieves the authenticated user from the Gin context (set by Auth middleware).
func GetUser(c *gin.Context) *store.User {
	v, _ := c.Get(ctxUser)
	if v == nil {
		return nil
	}
	return v.(*store.User)
}

func GetSession(c *gin.Context) *store.AuthSession {
	v, _ := c.Get(ctxSession)
	if v == nil {
		return nil
	}
	return v.(*store.AuthSession)
}
