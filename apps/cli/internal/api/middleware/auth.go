package middleware

import (
	"cicada/internal/api"
	"cicada/internal/api/apperr"
	"cicada/internal/auth"
	"cicada/internal/config"
	"cicada/internal/store"

	"github.com/gin-gonic/gin"
)

const (
	headerToken = "x-cicada-token"
	ctxUser     = "authed_user"
)

// Auth validates the JWT and injects *store.User into the context.
func Auth() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.GetHeader(headerToken)
		if token == "" {
			api.Fail(c, apperr.NotAuthorized)
			return
		}
		userID, tokenID, err := auth.JWTVerify(token)
		if err != nil {
			api.Fail(c, apperr.NotAuthorized)
			return
		}
		u, err := store.GetUserByID(userID)
		if err != nil || u.TokenIdentifier != tokenID {
			api.Fail(c, apperr.NotAuthorized)
			return
		}
		// Resolve avatar to public URL
		u.Avatar = config.AssetPublicURL(u.Avatar, config.AssetTypeUserAvatar)
		c.Set(ctxUser, u)
		c.Next()
	}
}

// Admin ensures the authenticated user has admin flag.
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
