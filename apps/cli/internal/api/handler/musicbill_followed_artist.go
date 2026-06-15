package handler

import (
	"cicada/internal/api"
	"cicada/internal/api/apperr"
	"cicada/internal/api/middleware"
	"cicada/internal/store"
	"log"

	"github.com/gin-gonic/gin"
)

// canManageMusicbill returns true if the user is the owner or an accepted shared user.
func canManageMusicbill(musicbillID, userID string) (bool, error) {
	mb, err := store.GetMusicbillByID(musicbillID)
	if err != nil {
		return false, err
	}
	if mb.UserID == userID {
		return true, nil
	}
	sharedUsers, _ := store.GetSharedUsersInMusicbill(musicbillID)
	for _, su := range sharedUsers {
		if su.SharedUserID == userID && su.Accepted == 1 {
			return true, nil
		}
	}
	return false, nil
}

func GetMusicbillFollowedArtistList(c *gin.Context) {
	u := middleware.GetUser(c)
	musicbillID := c.Query("musicbillId")
	if musicbillID == "" {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	ok, err := canManageMusicbill(musicbillID, u.ID)
	if err != nil || !ok {
		api.Fail(c, apperr.MusicbillNotExisted)
		return
	}
	artists, err := store.GetFollowedArtistsByMusicbill(musicbillID)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	artistIDs := make([]string, len(artists))
	for i, a := range artists {
		artistIDs[i] = a.ID
	}
	photosByArtist := artistPhotosByArtistIDs(artistIDs)
	list := make([]gin.H, len(artists))
	for i, a := range artists {
		photos := photosByArtist[a.ID]
		if photos == nil {
			photos = []gin.H{}
		}
		list[i] = gin.H{
			"id":      a.ID,
			"name":    a.Name,
			"aliases": splitAliases(a.Aliases),
			"photos":  photos,
		}
	}
	api.OK(c, list)
}

type musicbillFollowedArtistBody struct {
	MusicbillID string `json:"musicbillId" binding:"required"`
	ArtistID    string `json:"artistId" binding:"required"`
}

func AddMusicbillFollowedArtist(c *gin.Context) {
	u := middleware.GetUser(c)
	var body musicbillFollowedArtistBody
	if err := c.ShouldBindJSON(&body); err != nil {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	ok, err := canManageMusicbill(body.MusicbillID, u.ID)
	if err != nil || !ok {
		api.Fail(c, apperr.MusicbillNotExisted)
		return
	}
	if _, err := store.GetArtistByID(body.ArtistID); err != nil {
		api.Fail(c, apperr.ArtistNotExisted)
		return
	}
	added, err := store.AddMusicbillFollowedArtist(body.MusicbillID, body.ArtistID)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	if !added {
		api.Fail(c, apperr.RepeatedFollowedArtist)
		return
	}
	// Backfill 该艺术家相关音乐到乐单. 失败仅记录, 不影响 follow 关系建立.
	if _, err := store.BackfillMusicbillWithArtist(body.MusicbillID, body.ArtistID); err != nil {
		log.Printf("backfill musicbill %s with artist %s: %v", body.MusicbillID, body.ArtistID, err)
	}
	api.OK(c, nil)
}

func DeleteMusicbillFollowedArtist(c *gin.Context) {
	u := middleware.GetUser(c)
	musicbillID := c.Query("musicbillId")
	artistID := c.Query("artistId")
	if musicbillID == "" || artistID == "" {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	ok, err := canManageMusicbill(musicbillID, u.ID)
	if err != nil || !ok {
		api.Fail(c, apperr.MusicbillNotExisted)
		return
	}
	if _, err := store.RemoveMusicbillFollowedArtist(musicbillID, artistID); err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	api.OK(c, nil)
}
