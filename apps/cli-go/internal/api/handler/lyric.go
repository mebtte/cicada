package handler

import (
	"cicada/internal/api"
	"cicada/internal/api/apperr"
	"cicada/internal/store"

	"github.com/gin-gonic/gin"
)

func GetLyricList(c *gin.Context) {
	musicID := c.Query("musicId")
	if musicID == "" {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	music, err := store.GetMusicByID(musicID)
	if err != nil {
		api.Fail(c, apperr.MusicNotExisted)
		return
	}
	if music.Type == store.MusicTypeUnknown {
		api.Fail(c, apperr.InstrumentalHasNoLyric)
		return
	}
	lyrics, _ := store.GetLyricsByMusicID(musicID)
	list := make([]gin.H, len(lyrics))
	for i, l := range lyrics {
		list[i] = gin.H{
			"id":  l.ID,
			"lrc": l.LRC,
		}
	}
	api.OK(c, list)
}
