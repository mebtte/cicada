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

func GetArtist(c *gin.Context) {
	id := c.Query("id")
	if id == "" {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	artist, err := store.GetArtistByID(id)
	if err != nil {
		api.Fail(c, apperr.ArtistNotExisted)
		return
	}

	singerMusicList, _ := store.GetMusicsBySingerID(id)
	lyricistMusicList, _ := store.GetMusicsByLyricistID(id)
	photos, _ := store.ListArtistPhotos(id)
	photoItems := make([]gin.H, len(photos))
	for i, p := range photos {
		photoItems[i] = gin.H{
			"id":          p.ID,
			"asset":       config.AssetPublicURL(p.Asset, config.AssetTypeArtistPhoto),
			"thumbnail":   p.Thumbnail,
			"description": p.Description,
		}
	}

	api.OK(c, gin.H{
		"id":                artist.ID,
		"name":              artist.Name,
		"aliases":           splitAliases(artist.Aliases),
		"photos":            photoItems,
		"singerMusicList":   artistMusicItems(singerMusicList),
		"lyricistMusicList": artistMusicItems(lyricistMusicList),
	})
}

func SearchArtist(c *gin.Context) {
	keyword := strings.TrimSpace(c.Query("keyword"))
	page := queryInt(c, "page", 1)
	pageSize := queryInt(c, "pageSize", 20)
	if keyword == "" || page < 1 || pageSize < 1 || pageSize > 100 {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	total, artists, err := store.SearchArtists(keyword, page, pageSize)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	artistIDs := make([]string, len(artists))
	for i, artist := range artists {
		artistIDs[i] = artist.ID
	}
	photosByArtist := artistPhotosByArtistIDs(artistIDs)
	musicCounts, err := store.GetMusicCountsByArtistIDs(artistIDs)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	list := make([]gin.H, len(artists))
	for i, artist := range artists {
		photos := photosByArtist[artist.ID]
		if photos == nil {
			photos = []gin.H{}
		}
		list[i] = gin.H{
			"id":         artist.ID,
			"name":       artist.Name,
			"aliases":    splitAliases(artist.Aliases),
			"photos":     photos,
			"musicCount": musicCounts[artist.ID],
		}
	}
	api.OK(c, gin.H{"total": total, "artistList": list})
}

func AdminGetArtistList(c *gin.Context) {
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

	total, artists, err := store.GetAdminArtistList(keyword, filterKey, page, pageSize)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	artistIDs := make([]string, len(artists))
	for i, artist := range artists {
		artistIDs[i] = artist.ID
	}
	photosByArtist := artistPhotosByArtistIDs(artistIDs)
	musicCounts, err := store.GetMusicCountsByArtistIDs(artistIDs)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	list := make([]gin.H, len(artists))
	for i, artist := range artists {
		photos := photosByArtist[artist.ID]
		if photos == nil {
			photos = []gin.H{}
		}
		list[i] = gin.H{
			"id":             artist.ID,
			"name":           artist.Name,
			"aliases":        splitAliases(artist.Aliases),
			"searchKeywords": artist.SearchKeywords,
			"photos":         photos,
			"musicCount":     musicCounts[artist.ID],
			"createUser": gin.H{
				"id":       artist.CreateUserID,
				"username": artist.CreateUserUsername,
				"nickname": artist.CreateUserNickname,
			},
			"createTimestamp": artist.CreateTimestamp,
		}
	}
	api.OK(c, gin.H{"total": total, "artistList": list})
}

func AdminGetArtist(c *gin.Context) {
	id := c.Query("id")
	if id == "" {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	artist, err := store.GetArtistByID(id)
	if err != nil {
		api.Fail(c, apperr.ArtistNotExisted)
		return
	}

	var createUserUsername string
	var createUserNickname string
	_ = store.DB().QueryRow(
		`SELECT username,nickname FROM user WHERE id=?`,
		artist.CreateUserID,
	).Scan(&createUserUsername, &createUserNickname)

	photos, _ := store.ListArtistPhotos(id)
	photoItems := make([]gin.H, len(photos))
	for i, p := range photos {
		photoItems[i] = gin.H{
			"id":          p.ID,
			"asset":       config.AssetPublicURL(p.Asset, config.AssetTypeArtistPhoto),
			"thumbnail":   p.Thumbnail,
			"description": p.Description,
		}
	}

	musicCount, _ := store.GetMusicCountByArtistID(id)

	api.OK(c, gin.H{
		"id":             artist.ID,
		"name":           artist.Name,
		"aliases":        splitAliases(artist.Aliases),
		"searchKeywords": artist.SearchKeywords,
		"photos":         photoItems,
		"musicCount":     musicCount,
		"createUser": gin.H{
			"id":       artist.CreateUserID,
			"username": createUserUsername,
			"nickname": createUserNickname,
		},
		"createTimestamp": artist.CreateTimestamp,
	})
}

type createArtistBody struct {
	Name  string `json:"name" binding:"required"`
	Force bool   `json:"force"`
}

func AdminCreateArtist(c *gin.Context) {
	u := middleware.GetUser(c)
	var body createArtistBody
	if err := c.ShouldBindJSON(&body); err != nil || len(body.Name) > 50 {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	if !body.Force {
		exists, err := store.ArtistNameExists(body.Name)
		if err != nil {
			api.Fail(c, apperr.ServerError)
			return
		}
		if exists {
			api.Fail(c, apperr.ArtistAlreadyExisted)
			return
		}
	}
	id, err := store.CreateArtist(body.Name, u.ID)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	api.OK(c, id)
}

type updateArtistBody struct {
	ID    string `json:"id" binding:"required"`
	Key   string `json:"key" binding:"required"`
	Value any    `json:"value"`
}

func AdminUpdateArtist(c *gin.Context) {
	var body updateArtistBody
	if err := c.ShouldBindJSON(&body); err != nil {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	if _, err := store.GetArtistByID(body.ID); err != nil {
		api.Fail(c, apperr.ArtistNotExisted)
		return
	}

	switch body.Key {
	case "name":
		name, ok := body.Value.(string)
		if !ok || name == "" || len(name) > 50 {
			api.Fail(c, apperr.WrongParameter)
			return
		}
		store.UpdateArtist(body.ID, "name", name)

	case "aliases":
		rawAliases, ok := body.Value.([]any)
		if !ok {
			api.Fail(c, apperr.WrongParameter)
			return
		}
		aliases := make([]string, len(rawAliases))
		for i, alias := range rawAliases {
			s, ok := alias.(string)
			if !ok || strings.Contains(s, aliasDivider) {
				api.Fail(c, apperr.WrongParameter)
				return
			}
			aliases[i] = s
		}
		store.UpdateArtist(body.ID, "aliases", joinAliases(aliases))

	case "searchKeywords":
		searchKeywords, ok := body.Value.(string)
		if !ok {
			api.Fail(c, apperr.WrongParameter)
			return
		}
		searchKeywords, ok = normalizeSearchKeywords(searchKeywords)
		if !ok {
			api.Fail(c, apperr.WrongParameter)
			return
		}
		store.UpdateArtist(body.ID, "searchKeywords", searchKeywords)

	default:
		api.Fail(c, apperr.WrongParameter)
		return
	}

	api.OK(c, nil)
}

func AdminDeleteArtist(c *gin.Context) {
	id := c.Query("id")
	if id == "" {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	if _, err := store.GetArtistByID(id); err != nil {
		api.Fail(c, apperr.ArtistNotExisted)
		return
	}
	count, err := store.GetMusicCountByArtistID(id)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	if count > 0 {
		api.Fail(c, apperr.ArtistHasMusicCanNotBeDeleted)
		return
	}
	if err := store.DeleteArtistCascade(id); err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	api.OK(c, nil)
}

func artistMusicItems(musicList []store.Music) []gin.H {
	musicIDs := make([]string, len(musicList))
	for i, music := range musicList {
		musicIDs[i] = music.ID
	}
	singers, _ := store.GetSingersInMusicIDs(musicIDs)
	lyricists, _ := store.GetLyricistsInMusicIDs(musicIDs)
	singerMap := groupArtistsByMusic(singers)
	lyricistMap := groupArtistsByMusic(lyricists)

	musicItems := make([]gin.H, len(musicList))
	for i, music := range musicList {
		musicItems[i] = gin.H{
			"id":             music.ID,
			"type":           music.Type,
			"name":           music.Name,
			"aliases":        splitAliases(music.Aliases),
			"cover":          config.AssetPublicURL(music.Cover, config.AssetTypeMusicCover),
			"coverThumbnail": music.CoverThumbnail,
			"asset":          config.AssetPublicURL(music.Asset, config.AssetTypeMusic),
			"singers":        artistItems(singerMap[music.ID]),
			"lyricists":      artistItems(lyricistMap[music.ID]),
		}
	}
	return musicItems
}
