package handler

import (
	"cicada/internal/api"
	"cicada/internal/api/apperr"
	"cicada/internal/api/middleware"
	"cicada/internal/store"
	"errors"
	"math"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

const effectivePlayPercent = 0.75

type createPlayRecordBody struct {
	MusicID        string  `json:"musicId" binding:"required"`
	ClientRecordID string  `json:"clientRecordId" binding:"required"`
	Percent        float64 `json:"percent"`
	PlayedAt       int64   `json:"playedAt"`
}

func normalizePlayPercent(percent float64) (float64, bool) {
	if math.IsNaN(percent) || math.IsInf(percent, 0) {
		return 0, false
	}
	// HTMLMediaElement 结束点附近可能因为浮点误差给出略小于 0 或略大于 1 的值.
	return min(max(percent, 0), 1), true
}

func normalizePlayedAt(playedAt int64, now int64) (int64, bool) {
	if playedAt <= 0 {
		return 0, false
	}
	// 客户端时间可能快于服务端，钳制未来时间，避免播放记录排序被异常时间污染.
	if playedAt > now {
		return now, true
	}
	return playedAt, true
}

func CreateMusicPlayRecord(c *gin.Context) {
	u := middleware.GetUser(c)
	var body createPlayRecordBody
	if u == nil || c.ShouldBindJSON(&body) != nil {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	clientRecordID := strings.TrimSpace(body.ClientRecordID)
	if clientRecordID == "" || len(clientRecordID) > 128 {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	percent, ok := normalizePlayPercent(body.Percent)
	if !ok {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	playedAt, ok := normalizePlayedAt(body.PlayedAt, time.Now().UnixMilli())
	if !ok {
		api.Fail(c, apperr.WrongParameter)
		return
	}

	m, err := store.GetMusicByID(body.MusicID)
	if err != nil || m == nil {
		api.Fail(c, apperr.MusicNotExisted)
		return
	}

	if err := store.SavePlayRecord(u.ID, body.MusicID, clientRecordID, percent, playedAt, effectivePlayPercent); err != nil {
		if errors.Is(err, store.ErrPlayRecordClientIDConflict) {
			api.Fail(c, apperr.WrongParameter)
			return
		}
		api.Fail(c, apperr.ServerError)
		return
	}
	api.OK(c, nil)
}

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

	musicIDs := make([]string, len(records))
	for i, r := range records {
		musicIDs[i] = r.MusicID
	}
	singers, _ := store.GetSingersInMusicIDs(musicIDs)
	lyricists, _ := store.GetLyricistsInMusicIDs(musicIDs)
	composers, _ := store.GetComposersInMusicIDs(musicIDs)
	singerMap := map[string][]gin.H{}
	for _, s := range singers {
		singerMap[s.MusicID] = append(singerMap[s.MusicID], gin.H{
			"id":   s.ID,
			"name": s.Name,
		})
	}
	lyricistMap := map[string][]gin.H{}
	for _, artist := range lyricists {
		lyricistMap[artist.MusicID] = append(lyricistMap[artist.MusicID], gin.H{
			"id":   artist.ID,
			"name": artist.Name,
		})
	}
	composerMap := map[string][]gin.H{}
	for _, artist := range composers {
		composerMap[artist.MusicID] = append(composerMap[artist.MusicID], gin.H{
			"id":   artist.ID,
			"name": artist.Name,
		})
	}

	list := make([]gin.H, len(records))
	for i, r := range records {
		ss := singerMap[r.MusicID]
		if ss == nil {
			ss = []gin.H{}
		}
		ls := lyricistMap[r.MusicID]
		if ls == nil {
			ls = []gin.H{}
		}
		cs := composerMap[r.MusicID]
		if cs == nil {
			cs = []gin.H{}
		}
		list[i] = gin.H{
			"recordId":  r.ID,
			"percent":   r.Percent,
			"playedAt":  r.PlayedAt,
			"id":        r.MusicID,
			"name":      r.MusicName,
			"aliases":   splitAliases(r.MusicAliases),
			"singers":   ss,
			"lyricists": ls,
			"composers": cs,
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
