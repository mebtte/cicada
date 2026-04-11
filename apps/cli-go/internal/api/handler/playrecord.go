package handler

import (
	"cicada/internal/api"
	"cicada/internal/api/apperr"
	"cicada/internal/api/middleware"
	"cicada/internal/store"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetMusicPlayRecordList(c *gin.Context) {
	u := middleware.GetUser(c)
	page := queryInt(c, "page", 1)
	pageSize := queryInt(c, "pageSize", 20)
	if page < 1 || pageSize < 1 || pageSize > 100 {
		api.Fail(c, apperr.WrongParameter)
		return
	}

	total, records, err := store.GetPlayRecords(u.ID, page, pageSize)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}

	if len(records) == 0 {
		api.OK(c, gin.H{"total": total, "musicPlayRecordList": []gin.H{}})
		return
	}

	// Get singers for each music
	musicIDs := make([]string, len(records))
	for i, r := range records {
		musicIDs[i] = r.MusicID
	}
	singers, _ := store.GetSingersInMusicIDs(musicIDs)
	singerMap := map[string][]gin.H{}
	for _, s := range singers {
		singerMap[s.MusicID] = append(singerMap[s.MusicID], gin.H{
			"id":   s.ID,
			"name": s.Name,
		})
	}

	list := make([]gin.H, len(records))
	for i, r := range records {
		ss := singerMap[r.MusicID]
		if ss == nil {
			ss = []gin.H{}
		}
		list[i] = gin.H{
			"recordId":  r.ID,
			"percent":   r.Percent,
			"timestamp": r.Timestamp,
			"id":        r.MusicID,
			"name":      r.MusicName,
			"aliases":   splitAliases(r.MusicAliases),
			"singers":   ss,
		}
	}
	api.OK(c, gin.H{"total": total, "musicPlayRecordList": list})
}

func DeleteMusicPlayRecord(c *gin.Context) {
	u := middleware.GetUser(c)
	idStr := c.Query("id")
	if idStr == "" {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || id == 0 {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	deleted, _ := store.DeletePlayRecord(id, u.ID)
	if !deleted {
		api.Fail(c, apperr.MusicPlayRecordNotExisted)
		return
	}
	api.OK(c, nil)
}
