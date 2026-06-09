package handler

import (
	"cicada/internal/api"
	"cicada/internal/api/apperr"
	"cicada/internal/api/middleware"
	"cicada/internal/auth"
	"cicada/internal/store"
	"time"

	"github.com/gin-gonic/gin"
)

func GetSessionList(c *gin.Context) {
	u := middleware.GetUser(c)
	current := middleware.GetSession(c)
	sessions, err := store.GetActiveAuthSessionsByUserID(u.ID, auth.SessionActiveAfter(time.Now()))
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	list := make([]gin.H, len(sessions))
	for i, s := range sessions {
		list[i] = gin.H{
			"id":                      s.ID,
			"deviceName":              s.DeviceName,
			"createTimestamp":         s.CreateTimestamp,
			"lastSeenTimestamp":       s.LastSeenTimestamp,
			"inactiveExpireTimestamp": s.LastSeenTimestamp + int64(auth.SessionIdleTimeout/time.Millisecond),
			"current":                 current != nil && current.ID == s.ID,
		}
	}
	api.OK(c, list)
}

type updateSessionBody struct {
	DeviceName string `json:"deviceName"`
}

func UpdateSession(c *gin.Context) {
	u := middleware.GetUser(c)
	id := c.Param("id")
	var body updateSessionBody
	if id == "" || c.ShouldBindJSON(&body) != nil || body.DeviceName == "" || len(body.DeviceName) > 80 {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	updated, err := store.UpdateAuthSessionDeviceName(u.ID, id, body.DeviceName)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	if !updated {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	api.OK(c, nil)
}

func DeleteCurrentSession(c *gin.Context) {
	u := middleware.GetUser(c)
	s := middleware.GetSession(c)
	if s == nil {
		api.Fail(c, apperr.NotAuthorized)
		return
	}
	if _, err := store.RevokeAuthSession(u.ID, s.ID, time.Now().UnixMilli(), "logout"); err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	api.OK(c, nil)
}

func DeleteSession(c *gin.Context) {
	u := middleware.GetUser(c)
	id := c.Param("id")
	if id == "" {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	if id == "current" {
		DeleteCurrentSession(c)
		return
	}
	deleted, err := store.RevokeAuthSession(u.ID, id, time.Now().UnixMilli(), "user_revoke")
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	if !deleted {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	api.OK(c, nil)
}
