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
		"id":        s.ID,
		"name":      s.Name,
		"aliases":   splitAliases(s.Aliases),
		"photos":    photoItems,
		"musicList": musicItems,
	})
}

func SearchSinger(c *gin.Context) {
	keyword := strings.TrimSpace(c.Query("keyword"))
	page := queryInt(c, "page", 1)
	pageSize := queryInt(c, "pageSize", 20)
	if keyword == "" || page < 1 || pageSize < 1 || pageSize > 100 {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	total, singers, err := store.SearchSingers(keyword, page, pageSize)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	singerIDs := make([]string, len(singers))
	for i, s := range singers {
		singerIDs[i] = s.ID
	}
	photosBySinger := map[string][]gin.H{}
	if len(singerIDs) > 0 {
		photos, err := store.ListSingerPhotosBySingerIDs(singerIDs)
		if err != nil {
			api.Fail(c, apperr.ServerError)
			return
		}
		for _, p := range photos {
			photosBySinger[p.SingerID] = append(photosBySinger[p.SingerID], gin.H{
				"id":          p.ID,
				"asset":       config.AssetPublicURL(p.Asset, config.AssetTypeSingerPhoto),
				"description": p.Description,
			})
		}
	}
	musicCounts, err := store.GetMusicCountsBySingerIDs(singerIDs)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	list := make([]gin.H, len(singers))
	for i, s := range singers {
		photos := photosBySinger[s.ID]
		if photos == nil {
			photos = []gin.H{}
		}
		list[i] = gin.H{
			"id":         s.ID,
			"name":       s.Name,
			"aliases":    splitAliases(s.Aliases),
			"photos":     photos,
			"musicCount": musicCounts[s.ID],
		}
	}
	api.OK(c, gin.H{"total": total, "singerList": list})
}

func AdminGetSingerList(c *gin.Context) {
	keyword := c.Query("keyword")
	filterKey := c.Query("filterKey")
	page := queryInt(c, "page", 1)
	pageSize := queryInt(c, "pageSize", 20)
	if page < 1 || pageSize < 1 || pageSize > 100 {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	switch filterKey {
	case "", "all", "id", "name", "alias":
	default:
		api.Fail(c, apperr.WrongParameter)
		return
	}

	total, singers, err := store.GetAdminSingerList(keyword, filterKey, page, pageSize)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	singerIDs := make([]string, len(singers))
	for i, s := range singers {
		singerIDs[i] = s.ID
	}
	photosBySinger := map[string][]gin.H{}
	if len(singerIDs) > 0 {
		photos, _ := store.ListSingerPhotosBySingerIDs(singerIDs)
		for _, p := range photos {
			photosBySinger[p.SingerID] = append(photosBySinger[p.SingerID], gin.H{
				"id":          p.ID,
				"asset":       config.AssetPublicURL(p.Asset, config.AssetTypeSingerPhoto),
				"description": p.Description,
			})
		}
	}
	// 批量统计每个歌手关联的音乐数量，避免在循环里逐条查询
	musicCounts, err := store.GetMusicCountsBySingerIDs(singerIDs)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	list := make([]gin.H, len(singers))
	for i, s := range singers {
		photos := photosBySinger[s.ID]
		if photos == nil {
			photos = []gin.H{}
		}
		list[i] = gin.H{
			"id":         s.ID,
			"name":       s.Name,
			"aliases":    splitAliases(s.Aliases),
			"photos":     photos,
			"musicCount": musicCounts[s.ID],
			"createUser": gin.H{
				"id":       s.CreateUserID,
				"username": s.CreateUserUsername,
				"nickname": s.CreateUserNickname,
			},
			"createTimestamp": s.CreateTimestamp,
		}
	}
	api.OK(c, gin.H{"total": total, "singerList": list})
}

func AdminGetSinger(c *gin.Context) {
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

	var createUserUsername string
	var createUserNickname string
	_ = store.DB().QueryRow(
		`SELECT username,nickname FROM user WHERE id=?`,
		s.CreateUserID,
	).Scan(&createUserUsername, &createUserNickname)

	photos, _ := store.ListSingerPhotos(id)
	photoItems := make([]gin.H, len(photos))
	for i, p := range photos {
		photoItems[i] = gin.H{
			"id":          p.ID,
			"asset":       config.AssetPublicURL(p.Asset, config.AssetTypeSingerPhoto),
			"description": p.Description,
		}
	}

	// musicCount 用于编辑页判定能否删除歌手，避免再发起一次单独的查询。
	musicCount, _ := store.GetMusicCountBySingerID(id)

	api.OK(c, gin.H{
		"id":         s.ID,
		"name":       s.Name,
		"aliases":    splitAliases(s.Aliases),
		"photos":     photoItems,
		"musicCount": musicCount,
		"createUser": gin.H{
			"id":       s.CreateUserID,
			"username": createUserUsername,
			"nickname": createUserNickname,
		},
		"createTimestamp": s.CreateTimestamp,
	})
}

type createSingerBody struct {
	Name  string `json:"name" binding:"required"`
	Force bool   `json:"force"`
}

func AdminCreateSinger(c *gin.Context) {
	u := middleware.GetUser(c)
	var body createSingerBody
	if err := c.ShouldBindJSON(&body); err != nil || len(body.Name) > 50 {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	if !body.Force {
		exists, err := store.SingerNameExists(body.Name)
		if err != nil {
			api.Fail(c, apperr.ServerError)
			return
		}
		if exists {
			api.Fail(c, apperr.SingerAlreadyExisted)
			return
		}
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

func AdminUpdateSinger(c *gin.Context) {
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

func AdminDeleteSinger(c *gin.Context) {
	id := c.Query("id")
	if id == "" {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	if _, err := store.GetSingerByID(id); err != nil {
		api.Fail(c, apperr.SingerNotExisted)
		return
	}
	// 即便前端已禁用按钮，仍在服务端复核音乐数量，避免竞态导致带音乐的歌手被误删。
	count, err := store.GetMusicCountBySingerID(id)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	if count > 0 {
		api.Fail(c, apperr.SingerHasMusicCanNotBeDeleted)
		return
	}
	if err := store.DeleteSingerCascade(id); err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	api.OK(c, nil)
}
