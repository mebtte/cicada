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

// canEditSinger returns true when u may edit s. Admins can edit any singer;
// otherwise only the creator can.
func canEditSinger(u *store.User, s *store.Singer) bool {
	return u.Admin == 1 || s.CreateUserID == u.ID
}

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

	photos, _ := store.ListSingerPhotos(id)
	photoItems := make([]gin.H, len(photos))
	for i, p := range photos {
		photoItems[i] = gin.H{
			"id":          p.ID,
			"asset":       config.AssetPublicURL(p.Asset, config.AssetTypeSingerPhoto),
			"description": p.Description,
		}
	}

	api.OK(c, gin.H{
		"id":              s.ID,
		"name":            s.Name,
		"aliases":         splitAliases(s.Aliases),
		"photos":          photoItems,
		"createTimestamp": s.CreateTimestamp,
		"createUser":      gin.H{"id": s.CreateUserID, "nickname": createUserNickname},
		"musicList":       musicItems,
		"editable":        canEditSinger(u, s),
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

	default:
		api.Fail(c, apperr.WrongParameter)
		return
	}

	api.OK(c, nil)
}
