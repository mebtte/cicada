package handler

import (
	"cicada/internal/api"
	"cicada/internal/api/apperr"
	"cicada/internal/api/middleware"
	"cicada/internal/config"
	"cicada/internal/store"
	"strings"

	"github.com/gin-gonic/gin"
)

func GetSinger(c *gin.Context) {
	u := middleware.GetUser(c)
	id := c.Query("id")
	if id == "" {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	s, err := store.GetSingerByID(id)
	if err != nil {
		api.Fail(c, apperr.SingerNotExisted)
		return
	}

	musicList, _ := store.GetMusicsBySingerID(id)
	musicIDs := make([]string, len(musicList))
	for i, m := range musicList {
		musicIDs[i] = m.ID
	}
	singerMap := map[string][]gin.H{}
	if len(musicIDs) > 0 {
		singers, _ := store.GetSingersInMusicIDs(musicIDs)
		for _, singer := range singers {
			singerMap[singer.MusicID] = append(singerMap[singer.MusicID], gin.H{
				"id":      singer.ID,
				"name":    singer.Name,
				"aliases": splitAliases(singer.Aliases),
				"avatar":  config.AssetPublicURL(singer.Avatar, config.AssetTypeSingerAvatar),
			})
		}
	}
	musicItems := make([]gin.H, len(musicList))
	for i, m := range musicList {
		singers := singerMap[m.ID]
		if singers == nil {
			singers = []gin.H{}
		}
		musicItems[i] = gin.H{
			"id":      m.ID,
			"type":    m.Type,
			"name":    m.Name,
			"aliases": splitAliases(m.Aliases),
			"cover":   config.AssetPublicURL(m.Cover, config.AssetTypeMusicCover),
			"asset":   config.AssetPublicURL(m.Asset, config.AssetTypeMusic),
			"singers": singers,
		}
	}

	var createUserNickname string
	_ = store.DB().QueryRow(`SELECT nickname FROM user WHERE id=?`, s.CreateUserID).Scan(&createUserNickname)

	records, _ := store.GetSingerModifyRecords(id)
	modifyList := make([]gin.H, len(records))
	for i, r := range records {
		modifyList[i] = gin.H{
			"id":              r.ID,
			"key":             r.Key,
			"modifyUserId":    r.ModifyUserID,
			"modifyTimestamp": r.ModifyTimestamp,
			"modifyNickname":  r.ModifyNickname,
		}
	}
	api.OK(c, gin.H{
		"id":              s.ID,
		"name":            s.Name,
		"aliases":         splitAliases(s.Aliases),
		"avatar":          config.AssetPublicURL(s.Avatar, config.AssetTypeSingerAvatar),
		"createTimestamp": s.CreateTimestamp,
		"createUser":      gin.H{"id": s.CreateUserID, "nickname": createUserNickname},
		"musicList":       musicItems,
		"editable":        u.Admin == 1 || s.CreateUserID == u.ID,
		"modifyList":      modifyList,
	})
}

func SearchSinger(c *gin.Context) {
	keyword := c.Query("keyword")
	page := queryInt(c, "page", 1)
	pageSize := queryInt(c, "pageSize", 20)
	if page < 1 || pageSize < 1 || pageSize > 100 {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	total, singers, err := store.SearchSingers(keyword, page, pageSize)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	list := make([]gin.H, len(singers))
	for i, s := range singers {
		list[i] = gin.H{
			"id":      s.ID,
			"name":    s.Name,
			"aliases": splitAliases(s.Aliases),
			"avatar":  config.AssetPublicURL(s.Avatar, config.AssetTypeSingerAvatar),
		}
	}
	api.OK(c, gin.H{"total": total, "singerList": list})
}

type createSingerBody struct {
	Name string `json:"name" binding:"required"`
}

func CreateSinger(c *gin.Context) {
	u := middleware.GetUser(c)
	var body createSingerBody
	if err := c.ShouldBindJSON(&body); err != nil || len(body.Name) > 50 {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	id, err := store.CreateSinger(body.Name, u.ID)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	api.OK(c, id)
}

type updateSingerBody struct {
	ID    string `json:"id" binding:"required"`
	Key   string `json:"key" binding:"required"`
	Value any    `json:"value"`
}

func UpdateSinger(c *gin.Context) {
	u := middleware.GetUser(c)
	var body updateSingerBody
	if err := c.ShouldBindJSON(&body); err != nil {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	if _, err := store.GetSingerByID(body.ID); err != nil {
		api.Fail(c, apperr.SingerNotExisted)
		return
	}

	switch body.Key {
	case "name":
		name, ok := body.Value.(string)
		if !ok || name == "" || len(name) > 50 {
			api.Fail(c, apperr.WrongParameter)
			return
		}
		store.UpdateSinger(body.ID, "name", name)
		store.RecordSingerModify(body.ID, u.ID, "name")

	case "aliases":
		rawAliases, ok := body.Value.([]any)
		if !ok {
			api.Fail(c, apperr.WrongParameter)
			return
		}
		aliases := make([]string, len(rawAliases))
		for i, a := range rawAliases {
			s, ok := a.(string)
			if !ok || strings.Contains(s, aliasDivider) {
				api.Fail(c, apperr.WrongParameter)
				return
			}
			aliases[i] = s
		}
		store.UpdateSinger(body.ID, "aliases", joinAliases(aliases))
		store.RecordSingerModify(body.ID, u.ID, "aliases")

	case "avatar":
		avatar, ok := body.Value.(string)
		if !ok || (avatar != "" && !assetExists(avatar, config.AssetTypeSingerAvatar)) {
			api.Fail(c, apperr.AssetNotExisted)
			return
		}
		store.UpdateSinger(body.ID, "avatar", avatar)
		store.RecordSingerModify(body.ID, u.ID, "avatar")

	default:
		api.Fail(c, apperr.WrongParameter)
		return
	}

	api.OK(c, nil)
}

func GetSingerModifyRecordList(c *gin.Context) {
	singerID := c.Query("singerId")
	if singerID == "" {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	if _, err := store.GetSingerByID(singerID); err != nil {
		api.Fail(c, apperr.SingerNotExisted)
		return
	}
	records, _ := store.GetSingerModifyRecords(singerID)
	list := make([]gin.H, len(records))
	for i, r := range records {
		list[i] = gin.H{
			"id":              r.ID,
			"key":             r.Key,
			"modifyUserId":    r.ModifyUserID,
			"modifyTimestamp": r.ModifyTimestamp,
			"modifyNickname":  r.ModifyNickname,
		}
	}
	api.OK(c, list)
}
