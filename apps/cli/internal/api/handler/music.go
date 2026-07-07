package handler

import (
	"cicada/internal/api"
	"cicada/internal/api/apperr"
	"cicada/internal/api/middleware"
	"cicada/internal/auth"
	"cicada/internal/config"
	"cicada/internal/store"
	"log"
	"strings"
	"unicode/utf8"

	"github.com/gin-gonic/gin"
)

// ── Search music (all users) ──────────────────────────────────────────────────

func SearchMusic(c *gin.Context) {
	keyword := strings.TrimSpace(c.Query("keyword"))
	page := queryInt(c, "page", 1)
	pageSize := queryInt(c, "pageSize", 20)
	if keyword == "" || page < 1 || pageSize < 1 || pageSize > 100 || strings.Contains(keyword, aliasDivider) {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	total, musics, err := store.SearchMusic(keyword, page, pageSize)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	api.OK(c, musicListResponse(musics, total))
}

// ── Search music by lyric ─────────────────────────────────────────────────────

func SearchMusicByLyric(c *gin.Context) {
	keyword := strings.TrimSpace(c.Query("keyword"))
	page := queryInt(c, "page", 1)
	pageSize := queryInt(c, "pageSize", 20)
	if keyword == "" || page < 1 || pageSize < 1 || pageSize > 100 {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	total, ids, err := store.SearchMusicIDsByLyric(keyword, page, pageSize)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	if len(ids) == 0 {
		api.OK(c, gin.H{"total": total, "musicList": []any{}})
		return
	}
	musics, err := store.GetMusicsByIDs(ids)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	resp, err := musicListWithLyricsResponse(musics, total)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	api.OK(c, resp)
}

func AdminGetMusicList(c *gin.Context) {
	keyword := c.Query("keyword")
	filterKey := c.Query("filterKey")
	sortBy := c.Query("sortBy")
	sortOrder := c.Query("sortOrder")
	page := queryInt(c, "page", 1)
	pageSize := queryInt(c, "pageSize", 20)
	if page < 1 || pageSize < 1 || pageSize > 100 {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	switch filterKey {
	case "", "all", "id", "name", "alias", "artist":
	default:
		api.Fail(c, apperr.WrongParameter)
		return
	}
	switch sortBy {
	case "", "createTimestamp", "heat":
	default:
		api.Fail(c, apperr.WrongParameter)
		return
	}
	switch sortOrder {
	case "", "desc", "asc":
	default:
		api.Fail(c, apperr.WrongParameter)
		return
	}

	total, musics, err := store.GetAdminMusicList(keyword, filterKey, sortBy, sortOrder, page, pageSize)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	api.OK(c, adminMusicListResponse(musics, total))
}

// ── Get single music ──────────────────────────────────────────────────────────

func GetMusic(c *gin.Context) {
	id := c.Query("id")
	if id == "" {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	m, err := store.GetMusicByID(id)
	if err != nil {
		api.Fail(c, apperr.MusicNotExisted)
		return
	}

	api.OK(c, musicDetailResponse(m, false))
}

// ── Get random music (radio mode) ─────────────────────────────────────────────

func GetRandomMusic(c *gin.Context) {
	excludeID := c.Query("excludeId")
	m, err := store.GetRandomMusic(excludeID)
	if err != nil {
		api.Fail(c, apperr.MusicNotExisted)
		return
	}
	api.OK(c, musicDetailResponse(m, false))
}

func AdminGetMusic(c *gin.Context) {
	id := c.Query("id")
	if id == "" {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	m, err := store.GetMusicByID(id)
	if err != nil {
		api.Fail(c, apperr.MusicNotExisted)
		return
	}

	api.OK(c, musicDetailResponse(m, true))
}

func musicDetailResponse(m *store.Music, includeSearchKeywords bool) gin.H {
	id := m.ID
	forks, _ := store.GetMusicForks(id)
	forkFroms, _ := store.GetMusicForkFroms(id)

	allIDs := []string{id}
	for _, f := range forks {
		allIDs = append(allIDs, f.MusicID)
	}
	for _, f := range forkFroms {
		allIDs = append(allIDs, f.ForkFrom)
	}
	performers, _ := store.GetArtistsInMusicIDsByRole(unique(allIDs), store.MusicArtistRolePerformer)
	lyricists, _ := store.GetArtistsInMusicIDsByRole(unique(allIDs), store.MusicArtistRoleLyricist)
	composers, _ := store.GetArtistsInMusicIDsByRole(unique(allIDs), store.MusicArtistRoleComposer)

	performersByMusic := groupArtistsByMusic(performers)
	lyricistsByMusic := groupArtistsByMusic(lyricists)
	composersByMusic := groupArtistsByMusic(composers)
	artistIDs := make([]string, 0, len(performers)+len(lyricists)+len(composers))
	for _, artist := range performers {
		artistIDs = append(artistIDs, artist.ID)
	}
	for _, artist := range lyricists {
		artistIDs = append(artistIDs, artist.ID)
	}
	for _, artist := range composers {
		artistIDs = append(artistIDs, artist.ID)
	}
	photosByArtist := artistPhotosByArtistIDs(unique(artistIDs))

	var musicbillCount int
	store.DB().QueryRow(`SELECT COUNT(1) FROM musicbill_music WHERE musicId=?`, id).Scan(&musicbillCount)

	// Build fork music summaries
	forkIDs := make([]string, len(forks))
	for i, f := range forks {
		forkIDs[i] = f.MusicID
	}
	forkFromIDs := make([]string, len(forkFroms))
	for i, f := range forkFroms {
		forkFromIDs[i] = f.ForkFrom
	}
	relatedMusics, _ := store.GetMusicsByIDs(append(forkIDs, forkFromIDs...))
	relatedMap := map[string]store.Music{}
	for _, rm := range relatedMusics {
		relatedMap[rm.ID] = rm
	}

	forkList := make([]gin.H, len(forks))
	for i, f := range forks {
		rm := relatedMap[f.MusicID]
		forkList[i] = gin.H{
			"id":             rm.ID,
			"name":           rm.Name,
			"cover":          config.AssetPublicURL(rm.Cover, config.AssetTypeMusicCover),
			"coverThumbnail": rm.CoverThumbnail,
			"performers":     artistItemsWithPhotos(performersByMusic[rm.ID], photosByArtist),
			"lyricists": artistItemsWithPhotos(
				lyricistsByMusic[rm.ID],
				photosByArtist,
			),
			"composers": artistItemsWithPhotos(
				composersByMusic[rm.ID],
				photosByArtist,
			),
		}
	}
	forkFromList := make([]gin.H, len(forkFroms))
	for i, f := range forkFroms {
		rm := relatedMap[f.ForkFrom]
		forkFromList[i] = gin.H{
			"id":             rm.ID,
			"name":           rm.Name,
			"cover":          config.AssetPublicURL(rm.Cover, config.AssetTypeMusicCover),
			"coverThumbnail": rm.CoverThumbnail,
			"performers":     artistItemsWithPhotos(performersByMusic[rm.ID], photosByArtist),
			"lyricists": artistItemsWithPhotos(
				lyricistsByMusic[rm.ID],
				photosByArtist,
			),
			"composers": artistItemsWithPhotos(
				composersByMusic[rm.ID],
				photosByArtist,
			),
		}
	}

	resp := gin.H{
		"id":                         m.ID,
		"type":                       m.Type,
		"name":                       m.Name,
		"aliases":                    splitAliases(m.Aliases),
		"cover":                      config.AssetPublicURL(m.Cover, config.AssetTypeMusicCover),
		"coverThumbnail":             m.CoverThumbnail,
		"asset":                      config.AssetPublicURL(m.Asset, config.AssetTypeMusic),
		"assetSize":                  m.AssetSize,
		"assetDurationMs":            m.AssetDurationMs,
		"assetCodec":                 m.AssetCodec,
		"assetBitRate":               m.AssetBitRate,
		"heat":                       m.Heat,
		"createTimestamp":            m.CreateTimestamp,
		"year":                       nullInt64(m.Year),
		"performers":                 artistItemsWithPhotos(performersByMusic[id], photosByArtist),
		"lyricists":                  artistItemsWithPhotos(lyricistsByMusic[id], photosByArtist),
		"composers":                  artistItemsWithPhotos(composersByMusic[id], photosByArtist),
		"forkList":                   forkList,
		"forkFromList":               forkFromList,
		"musicbillCount":             musicbillCount,
		"relatedPublicMusicbillList": relatedPublicMusicbillItems(id),
	}
	if includeSearchKeywords {
		resp["searchKeywords"] = m.SearchKeywords
	}
	return resp
}

// ── Create music ──────────────────────────────────────────────────────────────

type createMusicBody struct {
	Name         string `json:"name" binding:"required"`
	PerformerIDs string `json:"performerIds"`
	LyricistIDs  string `json:"lyricistIds"`
	ComposerIDs  string `json:"composerIds"`
	Type         int    `json:"type"`
	Asset        string `json:"asset" binding:"required"`
}

const musicNameMaxLength = 128

func validMusicName(name string) bool {
	// Count runes so non-ASCII song names get the same 128-character budget as
	// the frontend input limit instead of being capped by UTF-8 byte length.
	return name != "" &&
		utf8.RuneCountInString(name) <= musicNameMaxLength &&
		strings.TrimSpace(name) == name
}

func AdminCreateMusic(c *gin.Context) {
	u := middleware.GetUser(c)
	if u == nil || u.Admin != 1 {
		api.Fail(c, apperr.NotAuthorizedForAdmin)
		return
	}
	var body createMusicBody
	if err := c.ShouldBindJSON(&body); err != nil || !validMusicName(body.Name) {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	musicType := store.MusicType(body.Type)
	if !musicType.Valid() {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	if !assetExists(body.Asset, config.AssetTypeMusic) {
		api.Fail(c, apperr.AssetNotExisted)
		return
	}
	performerIDs := []string{}
	if body.PerformerIDs != "" {
		performerIDs = strings.Split(body.PerformerIDs, ",")
		ok, _ := store.ArtistsExist(performerIDs)
		if !ok {
			api.Fail(c, apperr.ArtistNotExisted)
			return
		}
	}
	lyricistIDs := []string{}
	if body.LyricistIDs != "" {
		if musicType == store.MusicTypeInstrumental {
			api.Fail(c, apperr.InstrumentalHasNoLyricist)
			return
		}
		lyricistIDs = strings.Split(body.LyricistIDs, ",")
		ok, _ := store.ArtistsExist(lyricistIDs)
		if !ok {
			api.Fail(c, apperr.ArtistNotExisted)
			return
		}
	}
	composerIDs := []string{}
	if body.ComposerIDs != "" {
		composerIDs = strings.Split(body.ComposerIDs, ",")
		ok, _ := store.ArtistsExist(composerIDs)
		if !ok {
			api.Fail(c, apperr.ArtistNotExisted)
			return
		}
	}
	id, err := store.CreateMusic(body.Name, musicType, body.Asset)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	if err := store.ReplaceMusicArtistsByRole(id, store.MusicArtistRolePerformer, performerIDs); err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	if err := store.ReplaceMusicArtistsByRole(id, store.MusicArtistRoleLyricist, lyricistIDs); err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	if err := store.ReplaceMusicArtistsByRole(id, store.MusicArtistRoleComposer, composerIDs); err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	syncMusicMetadataToAsset(id)
	syncMusicAssetInfo(id)
	autoAddMusicToFollowingMusicbills(id, performerIDs, lyricistIDs, composerIDs)
	api.OK(c, id)
}

// getMusicArtistIDsByRole returns the artist IDs currently linked to the music for the given role.
func getMusicArtistIDsByRole(musicID string, role store.MusicArtistRole) []string {
	rows, err := store.GetArtistsInMusicIDsByRole([]string{musicID}, role)
	if err != nil {
		return nil
	}
	ids := make([]string, len(rows))
	for i, r := range rows {
		ids[i] = r.ID
	}
	return ids
}

// diffNewlyAdded returns ids present in newIDs but not in oldIDs.
func diffNewlyAdded(oldIDs, newIDs []string) []string {
	old := make(map[string]struct{}, len(oldIDs))
	for _, id := range oldIDs {
		old[id] = struct{}{}
	}
	added := make([]string, 0)
	for _, id := range newIDs {
		if _, ok := old[id]; !ok {
			added = append(added, id)
		}
	}
	return added
}

// autoAddMusicToFollowingMusicbills 把音乐自动加入所有关注了该音乐任一艺术家的乐单.
// 内部去重 + 单条 SQL; 失败仅记录.
func autoAddMusicToFollowingMusicbills(musicID string, artistIDGroups ...[]string) {
	seen := map[string]struct{}{}
	all := make([]string, 0)
	for _, ids := range artistIDGroups {
		for _, id := range ids {
			if id == "" {
				continue
			}
			if _, ok := seen[id]; ok {
				continue
			}
			seen[id] = struct{}{}
			all = append(all, id)
		}
	}
	if len(all) == 0 {
		return
	}
	if _, err := store.AutoAddMusicToFollowingMusicbills(musicID, all); err != nil {
		log.Printf("auto add music %s to following musicbills: %v", musicID, err)
	}
}

// ── Update music ──────────────────────────────────────────────────────────────

type updateMusicBody struct {
	ID    string `json:"id" binding:"required"`
	Key   string `json:"key" binding:"required"`
	Value any    `json:"value"`
}

const (
	musicMaxLyricAmount = 5
	musicMaxLyricLength = 16384
)

func AdminUpdateMusic(c *gin.Context) {
	u := middleware.GetUser(c)
	if u == nil || u.Admin != 1 {
		api.Fail(c, apperr.NotAuthorizedForAdmin)
		return
	}
	var body updateMusicBody
	if err := c.ShouldBindJSON(&body); err != nil {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	m, err := store.GetMusicByID(body.ID)
	if err != nil {
		api.Fail(c, apperr.MusicNotExisted)
		return
	}

	syncMetadata := false
	switch body.Key {
	case "name":
		name, ok := body.Value.(string)
		if !ok || !validMusicName(name) {
			api.Fail(c, apperr.WrongParameter)
			return
		}
		store.UpdateMusic(body.ID, "name", name)
		syncMetadata = true

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
		store.UpdateMusic(body.ID, "aliases", joinAliases(aliases))

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
		store.UpdateMusic(body.ID, "searchKeywords", searchKeywords)

	case "lyric":
		if m.Type == store.MusicTypeInstrumental {
			api.Fail(c, apperr.InstrumentalHasNoLyric)
			return
		}
		rawLyrics, ok := body.Value.([]any)
		if !ok || len(rawLyrics) > musicMaxLyricAmount {
			api.Fail(c, apperr.WrongParameter)
			return
		}
		lyrics := make([]string, 0, len(rawLyrics))
		for _, v := range rawLyrics {
			lrc, ok := v.(string)
			if !ok {
				api.Fail(c, apperr.WrongParameter)
				return
			}
			lrc = strings.TrimSpace(lrc)
			if lrc == "" {
				continue
			}
			if len(lrc) > musicMaxLyricLength {
				api.Fail(c, apperr.WrongParameter)
				return
			}
			lyrics = append(lyrics, lrc)
		}
		if err := store.UpdateLyricsByMusicID(body.ID, lyrics); err != nil {
			api.Fail(c, apperr.ServerError)
			return
		}
		syncMetadata = true

	case "cover":
		cover, ok := body.Value.(string)
		if !ok || (cover != "" && !assetExists(cover, config.AssetTypeMusicCover)) {
			api.Fail(c, apperr.AssetNotExisted)
			return
		}
		store.UpdateMusicCover(body.ID, cover, assetThumbnailDataURL(cover, config.AssetTypeMusicCover))
		syncMetadata = true

	case "asset":
		asset, ok := body.Value.(string)
		if !ok || !assetExists(asset, config.AssetTypeMusic) {
			api.Fail(c, apperr.AssetNotExisted)
			return
		}
		store.UpdateMusic(body.ID, "asset", asset)
		syncMetadata = true

	case "performers":
		rawIDs, ok := body.Value.([]any)
		if !ok {
			api.Fail(c, apperr.WrongParameter)
			return
		}
		ids := make([]string, len(rawIDs))
		for i, v := range rawIDs {
			s, ok := v.(string)
			if !ok {
				api.Fail(c, apperr.WrongParameter)
				return
			}
			ids[i] = s
		}
		if ok, _ := store.ArtistsExist(ids); !ok {
			api.Fail(c, apperr.ArtistNotExisted)
			return
		}
		oldIDs := getMusicArtistIDsByRole(body.ID, store.MusicArtistRolePerformer)
		if err := store.ReplaceMusicArtistsByRole(body.ID, store.MusicArtistRolePerformer, ids); err != nil {
			api.Fail(c, apperr.ServerError)
			return
		}
		autoAddMusicToFollowingMusicbills(body.ID, diffNewlyAdded(oldIDs, ids))
		syncMetadata = true

	case "lyricists":
		rawIDs, ok := body.Value.([]any)
		if !ok {
			api.Fail(c, apperr.WrongParameter)
			return
		}
		ids := make([]string, len(rawIDs))
		for i, v := range rawIDs {
			s, ok := v.(string)
			if !ok {
				api.Fail(c, apperr.WrongParameter)
				return
			}
			ids[i] = s
		}
		if m.Type == store.MusicTypeInstrumental && len(ids) > 0 {
			api.Fail(c, apperr.InstrumentalHasNoLyricist)
			return
		}
		if ok, _ := store.ArtistsExist(ids); !ok {
			api.Fail(c, apperr.ArtistNotExisted)
			return
		}
		oldIDs := getMusicArtistIDsByRole(body.ID, store.MusicArtistRoleLyricist)
		if err := store.ReplaceMusicArtistsByRole(body.ID, store.MusicArtistRoleLyricist, ids); err != nil {
			api.Fail(c, apperr.ServerError)
			return
		}
		autoAddMusicToFollowingMusicbills(body.ID, diffNewlyAdded(oldIDs, ids))
		syncMetadata = true

	case "composers":
		rawIDs, ok := body.Value.([]any)
		if !ok {
			api.Fail(c, apperr.WrongParameter)
			return
		}
		ids := make([]string, len(rawIDs))
		for i, v := range rawIDs {
			s, ok := v.(string)
			if !ok {
				api.Fail(c, apperr.WrongParameter)
				return
			}
			ids[i] = s
		}
		if ok, _ := store.ArtistsExist(ids); !ok {
			api.Fail(c, apperr.ArtistNotExisted)
			return
		}
		oldIDs := getMusicArtistIDsByRole(body.ID, store.MusicArtistRoleComposer)
		if err := store.ReplaceMusicArtistsByRole(body.ID, store.MusicArtistRoleComposer, ids); err != nil {
			api.Fail(c, apperr.ServerError)
			return
		}
		autoAddMusicToFollowingMusicbills(body.ID, diffNewlyAdded(oldIDs, ids))
		syncMetadata = true

	case "type":
		rawType, ok := body.Value.(float64)
		if !ok || rawType != float64(int(rawType)) {
			api.Fail(c, apperr.WrongParameter)
			return
		}
		musicType := store.MusicType(int(rawType))
		if !musicType.Valid() {
			api.Fail(c, apperr.WrongParameter)
			return
		}
		tx, err := store.DB().Begin()
		if err != nil {
			api.Fail(c, apperr.ServerError)
			return
		}
		defer tx.Rollback()
		if _, err := tx.Exec(`UPDATE music SET type=? WHERE id=?`, int(musicType), body.ID); err != nil {
			api.Fail(c, apperr.ServerError)
			return
		}
		if musicType == store.MusicTypeInstrumental {
			if _, err := tx.Exec(`DELETE FROM lyric WHERE musicId=?`, body.ID); err != nil {
				api.Fail(c, apperr.ServerError)
				return
			}
			if _, err := tx.Exec(`DELETE FROM music_artist_relation WHERE musicId=? AND role=?`, body.ID, string(store.MusicArtistRoleLyricist)); err != nil {
				api.Fail(c, apperr.ServerError)
				return
			}
		}
		if err := tx.Commit(); err != nil {
			api.Fail(c, apperr.ServerError)
			return
		}
		syncMetadata = true

	case "year":
		var year any
		if body.Value != nil {
			y, ok := body.Value.(float64)
			if !ok {
				api.Fail(c, apperr.WrongParameter)
				return
			}
			year = int(y)
		}
		store.UpdateMusic(body.ID, "year", year)
		syncMetadata = true

	case "forkFrom":
		rawIDs, ok := body.Value.([]any)
		if !ok {
			api.Fail(c, apperr.WrongParameter)
			return
		}
		ids := make([]string, 0, len(rawIDs))
		seen := map[string]bool{}
		for _, v := range rawIDs {
			id, ok := v.(string)
			if !ok || id == "" || id == body.ID {
				api.Fail(c, apperr.WrongParameter)
				return
			}
			if seen[id] {
				continue
			}
			if _, err := store.GetMusicByID(id); err != nil {
				api.Fail(c, apperr.MusicNotExisted)
				return
			}
			seen[id] = true
			ids = append(ids, id)
		}
		tx, err := store.DB().Begin()
		if err != nil {
			api.Fail(c, apperr.ServerError)
			return
		}
		defer tx.Rollback()
		if _, err := tx.Exec(`DELETE FROM music_fork WHERE musicId=?`, body.ID); err != nil {
			api.Fail(c, apperr.ServerError)
			return
		}
		for _, id := range ids {
			if _, err := tx.Exec(`INSERT INTO music_fork (musicId,forkFrom) VALUES (?,?)`, body.ID, id); err != nil {
				api.Fail(c, apperr.ServerError)
				return
			}
		}
		if err := tx.Commit(); err != nil {
			api.Fail(c, apperr.ServerError)
			return
		}

	default:
		api.Fail(c, apperr.WrongParameter)
		return
	}

	if syncMetadata {
		syncMusicMetadataToAsset(body.ID)
		syncMusicAssetInfo(body.ID)
	}
	api.OK(c, nil)
}

// ── Delete music ──────────────────────────────────────────────────────────────

func AdminDeleteMusic(c *gin.Context) {
	u := middleware.GetUser(c)
	if u == nil || u.Admin != 1 {
		api.Fail(c, apperr.NotAuthorizedForAdmin)
		return
	}
	id := c.Query("id")
	captchaID := c.Query("captchaId")
	captchaValue := c.Query("captchaValue")
	if id == "" || captchaID == "" || captchaValue == "" {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	ok, _ := auth.VerifyCaptcha(captchaID, captchaValue)
	if !ok {
		api.Fail(c, apperr.WrongCaptcha)
		return
	}
	m, err := store.GetMusicByID(id)
	if err != nil {
		api.Fail(c, apperr.MusicNotExisted)
		return
	}
	forks, _ := store.GetMusicForks(id)
	if len(forks) > 0 {
		api.Fail(c, apperr.MusicForkedByOtherCanNotBeDeleted)
		return
	}
	store.DeleteMusicCascade(id, m.Type == store.MusicTypeSong)
	api.OK(c, nil)
}

// ── Exploration ───────────────────────────────────────────────────────────────

func GetExploration(c *gin.Context) {
	const quality = 30
	const recentLimit = 20
	type musicRow struct {
		ID             string
		Name           string
		Cover          string
		CoverThumbnail string
	}
	type artistRow struct {
		ID   string
		Name string
	}
	type mbRow struct {
		ID             string
		Name           string
		Cover          string
		CoverThumbnail string
		UserID         string
	}

	queryMusicRows := func(sql string, args ...any) []musicRow {
		rows, err := store.DB().Query(sql, args...)
		if err != nil {
			return nil
		}
		defer rows.Close()
		var out []musicRow
		for rows.Next() {
			r := musicRow{}
			rows.Scan(&r.ID, &r.Name, &r.Cover, &r.CoverThumbnail)
			out = append(out, r)
		}
		return out
	}
	queryArtistRows := func(sql string, args ...any) []artistRow {
		rows, err := store.DB().Query(sql, args...)
		if err != nil {
			return nil
		}
		defer rows.Close()
		var out []artistRow
		for rows.Next() {
			r := artistRow{}
			rows.Scan(&r.ID, &r.Name)
			out = append(out, r)
		}
		return out
	}
	queryMbRows := func(sql string, args ...any) []mbRow {
		rows, err := store.DB().Query(sql, args...)
		if err != nil {
			return nil
		}
		defer rows.Close()
		var out []mbRow
		for rows.Next() {
			r := mbRow{}
			rows.Scan(&r.ID, &r.Name, &r.Cover, &r.CoverThumbnail, &r.UserID)
			out = append(out, r)
		}
		return out
	}

	musicRows := queryMusicRows(
		`SELECT id,name,cover,coverThumbnail FROM music WHERE cover!='' ORDER BY random() LIMIT ?`, quality,
	)
	artistRows := queryArtistRows(
		`SELECT id,name FROM artist ORDER BY random() LIMIT ?`, quality,
	)
	mbRows := queryMbRows(
		`SELECT id,name,cover,coverThumbnail,userId FROM musicbill WHERE public=1 AND cover!='' ORDER BY random() LIMIT ?`, quality,
	)
	// 最近添加: 按 createTimestamp 倒序取最新条目, 让发现页能呈现新入库内容。
	recentMusicRows := queryMusicRows(
		`SELECT id,name,cover,coverThumbnail FROM music WHERE cover!='' ORDER BY createTimestamp DESC LIMIT ?`, recentLimit,
	)
	recentArtistRows := queryArtistRows(
		`SELECT id,name FROM artist ORDER BY createTimestamp DESC LIMIT ?`, recentLimit,
	)
	recentMbRows := queryMbRows(
		`SELECT id,name,cover,coverThumbnail,userId FROM musicbill WHERE public=1 AND cover!='' ORDER BY createTimestamp DESC LIMIT ?`, recentLimit,
	)

	// 合并随机和最近添加列表的 ID, 用一次查询拉齐关联数据 (表演者、图片、用户), 减少数据库往返。
	collectMusicIDs := func(groups ...[]musicRow) []string {
		ids := []string{}
		for _, g := range groups {
			for _, m := range g {
				ids = append(ids, m.ID)
			}
		}
		return ids
	}
	collectArtistIDs := func(groups ...[]artistRow) []string {
		ids := []string{}
		for _, g := range groups {
			for _, artist := range g {
				ids = append(ids, artist.ID)
			}
		}
		return ids
	}
	collectMbUserIDs := func(groups ...[]mbRow) []string {
		ids := []string{}
		for _, g := range groups {
			for _, mb := range g {
				ids = append(ids, mb.UserID)
			}
		}
		return ids
	}

	allPerformers, _ := store.GetArtistsInMusicIDsByRole(collectMusicIDs(musicRows, recentMusicRows), store.MusicArtistRolePerformer)
	performersByMusic := groupArtistsByMusic(allPerformers)
	buildMusicList := func(rows []musicRow) []gin.H {
		list := make([]gin.H, len(rows))
		for i, m := range rows {
			performers := make([]gin.H, 0)
			for _, artist := range performersByMusic[m.ID] {
				performers = append(performers, gin.H{"id": artist.ID, "name": artist.Name})
			}
			list[i] = gin.H{
				"id":             m.ID,
				"name":           m.Name,
				"cover":          config.AssetPublicURL(m.Cover, config.AssetTypeMusicCover),
				"coverThumbnail": m.CoverThumbnail,
				"performers":     performers,
			}
		}
		return list
	}

	photosByArtist := map[string][]gin.H{}
	if artistIDs := collectArtistIDs(artistRows, recentArtistRows); len(artistIDs) > 0 {
		photos, _ := store.ListArtistPhotosByArtistIDs(artistIDs)
		for _, p := range photos {
			photosByArtist[p.ArtistID] = append(photosByArtist[p.ArtistID], gin.H{
				"id":          p.ID,
				"asset":       config.AssetPublicURL(p.Asset, config.AssetTypeArtistPhoto),
				"thumbnail":   p.Thumbnail,
				"description": p.Description,
			})
		}
	}
	buildArtistList := func(rows []artistRow) []gin.H {
		list := make([]gin.H, len(rows))
		for i, s := range rows {
			photos := photosByArtist[s.ID]
			if photos == nil {
				photos = []gin.H{}
			}
			list[i] = gin.H{
				"id":     s.ID,
				"name":   s.Name,
				"photos": photos,
			}
		}
		return list
	}

	userMap := map[string]string{}
	if mbUserIDs := collectMbUserIDs(mbRows, recentMbRows); len(mbUserIDs) > 0 {
		rows, _ := store.DB().Query(
			`SELECT id,nickname FROM user WHERE id IN (`+store.Placeholders(len(mbUserIDs))+`)`, store.Strs2Any(mbUserIDs)...,
		)
		if rows != nil {
			defer rows.Close()
			for rows.Next() {
				var id, nick string
				rows.Scan(&id, &nick)
				userMap[id] = nick
			}
		}
	}
	buildMbList := func(rows []mbRow) []gin.H {
		list := make([]gin.H, len(rows))
		for i, mb := range rows {
			list[i] = gin.H{
				"id":             mb.ID,
				"name":           mb.Name,
				"cover":          config.AssetPublicURL(mb.Cover, config.AssetTypeMusicbillCover),
				"coverThumbnail": mb.CoverThumbnail,
				"user":           gin.H{"id": mb.UserID, "nickname": userMap[mb.UserID]},
			}
		}
		return list
	}

	api.OK(c, gin.H{
		"musicList":                 buildMusicList(musicRows),
		"artistList":                buildArtistList(artistRows),
		"publicMusicbillList":       buildMbList(mbRows),
		"recentMusicList":           buildMusicList(recentMusicRows),
		"recentArtistList":          buildArtistList(recentArtistRows),
		"recentPublicMusicbillList": buildMbList(recentMbRows),
	})
}

// ── helpers ───────────────────────────────────────────────────────────────────

func relatedPublicMusicbillItems(musicID string) []gin.H {
	// 相关公开乐单只在音乐抽屉末尾展示少量卡片, 在数据库层随机抽样避免返回全量后再裁剪。
	rows, err := store.DB().Query(
		`SELECT mb.id,mb.name,mb.cover,mb.coverThumbnail,mb.userId,u.nickname,u.avatar,COUNT(all_mm.id)
		FROM musicbill mb
		JOIN musicbill_music matched_mm ON matched_mm.musicbillId=mb.id AND matched_mm.musicId=?
		JOIN user u ON u.id=mb.userId
		LEFT JOIN musicbill_music all_mm ON all_mm.musicbillId=mb.id
		WHERE mb.public=1
		GROUP BY mb.id,mb.name,mb.cover,mb.coverThumbnail,mb.userId,u.nickname,u.avatar
		ORDER BY random()
		LIMIT 5`, musicID,
	)
	if err != nil {
		return []gin.H{}
	}
	defer rows.Close()

	list := []gin.H{}
	for rows.Next() {
		var id, name, cover, coverThumbnail, userID, nickname, avatar string
		var musicCount int
		if err := rows.Scan(&id, &name, &cover, &coverThumbnail, &userID, &nickname, &avatar, &musicCount); err != nil {
			continue
		}
		list = append(list, gin.H{
			"id":             id,
			"name":           name,
			"cover":          config.AssetPublicURL(cover, config.AssetTypeMusicbillCover),
			"coverThumbnail": coverThumbnail,
			"musicCount":     musicCount,
			"user": gin.H{
				"id":       userID,
				"nickname": nickname,
				"avatar":   config.AssetPublicURL(avatar, config.AssetTypeUserAvatar),
			},
		})
	}
	return list
}

func musicListResponse(musics []store.Music, total int) gin.H {
	if len(musics) == 0 {
		return gin.H{"total": total, "musicList": []any{}}
	}
	ids := make([]string, len(musics))
	for i, m := range musics {
		ids[i] = m.ID
	}
	performers, _ := store.GetArtistsInMusicIDsByRole(ids, store.MusicArtistRolePerformer)
	lyricists, _ := store.GetArtistsInMusicIDsByRole(ids, store.MusicArtistRoleLyricist)
	composers, _ := store.GetArtistsInMusicIDsByRole(ids, store.MusicArtistRoleComposer)
	performersByMusic := groupArtistsByMusic(performers)
	lyricistsBySong := groupArtistsByMusic(lyricists)
	composersBySong := groupArtistsByMusic(composers)

	list := make([]gin.H, len(musics))
	for i, m := range musics {
		list[i] = gin.H{
			"id":              m.ID,
			"type":            m.Type,
			"name":            m.Name,
			"aliases":         splitAliases(m.Aliases),
			"cover":           config.AssetPublicURL(m.Cover, config.AssetTypeMusicCover),
			"coverThumbnail":  m.CoverThumbnail,
			"asset":           config.AssetPublicURL(m.Asset, config.AssetTypeMusic),
			"assetSize":       m.AssetSize,
			"assetDurationMs": m.AssetDurationMs,
			"assetCodec":      m.AssetCodec,
			"assetBitRate":    m.AssetBitRate,
			"heat":            m.Heat,
			"createTimestamp": m.CreateTimestamp,
			"performers":      artistItems(performersByMusic[m.ID]),
			"lyricists":       artistItems(lyricistsBySong[m.ID]),
			"composers":       artistItems(composersBySong[m.ID]),
		}
	}
	return gin.H{"total": total, "musicList": list}
}

func musicListWithLyricsResponse(musics []store.Music, total int) (gin.H, error) {
	resp := musicListResponse(musics, total)
	list, ok := resp["musicList"].([]gin.H)
	if !ok {
		return resp, nil
	}
	for i, m := range musics {
		lyrics, err := store.GetLyricsByMusicID(m.ID)
		if err != nil {
			return nil, err
		}
		lyricItems := make([]gin.H, len(lyrics))
		for j, l := range lyrics {
			lyricItems[j] = gin.H{
				"id":  l.ID,
				"lrc": l.LRC,
			}
		}
		list[i]["lyrics"] = lyricItems
	}
	return resp, nil
}

func adminMusicListResponse(musics []store.Music, total int) gin.H {
	if len(musics) == 0 {
		return gin.H{"total": total, "musicList": []any{}}
	}
	ids := make([]string, len(musics))
	for i, m := range musics {
		ids[i] = m.ID
	}
	performers, _ := store.GetArtistsInMusicIDsByRole(ids, store.MusicArtistRolePerformer)
	lyricists, _ := store.GetArtistsInMusicIDsByRole(ids, store.MusicArtistRoleLyricist)
	composers, _ := store.GetArtistsInMusicIDsByRole(ids, store.MusicArtistRoleComposer)
	performersByMusic := groupArtistsByMusic(performers)
	lyricistsBySong := groupArtistsByMusic(lyricists)
	composersBySong := groupArtistsByMusic(composers)

	list := make([]gin.H, len(musics))
	for i, m := range musics {
		list[i] = gin.H{
			"id":              m.ID,
			"type":            m.Type,
			"name":            m.Name,
			"aliases":         splitAliases(m.Aliases),
			"searchKeywords":  m.SearchKeywords,
			"cover":           config.AssetPublicURL(m.Cover, config.AssetTypeMusicCover),
			"coverThumbnail":  m.CoverThumbnail,
			"asset":           config.AssetPublicURL(m.Asset, config.AssetTypeMusic),
			"assetSize":       m.AssetSize,
			"assetDurationMs": m.AssetDurationMs,
			"assetCodec":      m.AssetCodec,
			"assetBitRate":    m.AssetBitRate,
			"heat":            m.Heat,
			"year":            nullInt64(m.Year),
			"createTimestamp": m.CreateTimestamp,
			"performers":      artistItems(performersByMusic[m.ID]),
			"lyricists":       artistItems(lyricistsBySong[m.ID]),
			"composers":       artistItems(composersBySong[m.ID]),
		}
	}
	return gin.H{"total": total, "musicList": list}
}

func groupArtistsByMusic(artists []store.ArtistInMusic) map[string][]store.ArtistInMusic {
	m := map[string][]store.ArtistInMusic{}
	for _, artist := range artists {
		m[artist.MusicID] = append(m[artist.MusicID], artist)
	}
	return m
}

func artistItems(artists []store.ArtistInMusic) []gin.H {
	out := make([]gin.H, len(artists))
	for i, artist := range artists {
		out[i] = gin.H{
			"id":      artist.ID,
			"name":    artist.Name,
			"aliases": splitAliases(artist.Aliases),
		}
	}
	return out
}

func artistItemsWithPhotos(artists []store.ArtistInMusic, photosByArtist map[string][]gin.H) []gin.H {
	out := make([]gin.H, len(artists))
	for i, artist := range artists {
		photos := photosByArtist[artist.ID]
		if photos == nil {
			photos = []gin.H{}
		}
		out[i] = gin.H{
			"id":      artist.ID,
			"name":    artist.Name,
			"aliases": splitAliases(artist.Aliases),
			"photos":  photos,
		}
	}
	return out
}

func artistPhotosByArtistIDs(artistIDs []string) map[string][]gin.H {
	photosByArtist := map[string][]gin.H{}
	if len(artistIDs) == 0 {
		return photosByArtist
	}
	photos, _ := store.ListArtistPhotosByArtistIDs(artistIDs)
	for _, p := range photos {
		photosByArtist[p.ArtistID] = append(photosByArtist[p.ArtistID], gin.H{
			"id":          p.ID,
			"asset":       config.AssetPublicURL(p.Asset, config.AssetTypeArtistPhoto),
			"thumbnail":   p.Thumbnail,
			"description": p.Description,
		})
	}
	return photosByArtist
}

func unique(ss []string) []string {
	seen := map[string]bool{}
	var out []string
	for _, s := range ss {
		if !seen[s] {
			seen[s] = true
			out = append(out, s)
		}
	}
	return out
}

func nullInt64(v struct {
	Int64 int64
	Valid bool
}) any {
	if !v.Valid {
		return nil
	}
	return v.Int64
}
