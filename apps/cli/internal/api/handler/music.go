package handler

import (
	"cicada/internal/api"
	"cicada/internal/api/apperr"
	"cicada/internal/api/middleware"
	"cicada/internal/auth"
	"cicada/internal/config"
	"cicada/internal/store"
	"strings"

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
	keyword := c.Query("keyword")
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
	page := queryInt(c, "page", 1)
	pageSize := queryInt(c, "pageSize", 20)
	if page < 1 || pageSize < 1 || pageSize > 100 {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	switch filterKey {
	case "", "all", "id", "name", "alias", "singer":
	default:
		api.Fail(c, apperr.WrongParameter)
		return
	}

	total, musics, err := store.GetAdminMusicList(keyword, filterKey, page, pageSize)
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

	forks, _ := store.GetMusicForks(id)
	forkFroms, _ := store.GetMusicForkFroms(id)

	allIDs := []string{id}
	for _, f := range forks {
		allIDs = append(allIDs, f.MusicID)
	}
	for _, f := range forkFroms {
		allIDs = append(allIDs, f.ForkFrom)
	}
	singers, _ := store.GetSingersInMusicIDs(unique(allIDs))

	singersByMusic := groupSingersByMusic(singers)
	singerIDs := make([]string, 0, len(singers))
	for _, s := range singers {
		singerIDs = append(singerIDs, s.ID)
	}
	photosBySinger := singerPhotosBySingerIDs(unique(singerIDs))

	var musicbillCount int
	store.DB().QueryRow(`SELECT COUNT(1) FROM musicbill_music WHERE musicId=?`, id).Scan(&musicbillCount)

	var createUserNickname string
	store.DB().QueryRow(`SELECT nickname FROM user WHERE id=?`, m.CreateUserID).Scan(&createUserNickname)

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
			"id":      rm.ID,
			"name":    rm.Name,
			"cover":   config.AssetPublicURL(rm.Cover, config.AssetTypeMusicCover),
			"singers": singerItemsWithPhotos(singersByMusic[rm.ID], photosBySinger),
		}
	}
	forkFromList := make([]gin.H, len(forkFroms))
	for i, f := range forkFroms {
		rm := relatedMap[f.ForkFrom]
		forkFromList[i] = gin.H{
			"id":      rm.ID,
			"name":    rm.Name,
			"cover":   config.AssetPublicURL(rm.Cover, config.AssetTypeMusicCover),
			"singers": singerItemsWithPhotos(singersByMusic[rm.ID], photosBySinger),
		}
	}

	api.OK(c, gin.H{
		"id":              m.ID,
		"type":            m.Type,
		"name":            m.Name,
		"aliases":         splitAliases(m.Aliases),
		"cover":           config.AssetPublicURL(m.Cover, config.AssetTypeMusicCover),
		"asset":           config.AssetPublicURL(m.Asset, config.AssetTypeMusic),
		"heat":            m.Heat,
		"createTimestamp": m.CreateTimestamp,
		"year":            nullInt64(m.Year),
		"singers":         singerItemsWithPhotos(singersByMusic[id], photosBySinger),
		"createUser":      gin.H{"id": m.CreateUserID, "nickname": createUserNickname},
		"forkList":        forkList,
		"forkFromList":    forkFromList,
		"musicbillCount":  musicbillCount,
	})
}

// ── Create music ──────────────────────────────────────────────────────────────

type createMusicBody struct {
	Name      string `json:"name" binding:"required"`
	SingerIDs string `json:"singerIds" binding:"required"`
	Type      int    `json:"type"`
	Asset     string `json:"asset" binding:"required"`
}

func CreateMusic(c *gin.Context) {
	u := middleware.GetUser(c)
	var body createMusicBody
	if err := c.ShouldBindJSON(&body); err != nil || len(body.Name) > 50 || strings.TrimSpace(body.Name) != body.Name {
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
	singerIDs := strings.Split(body.SingerIDs, ",")
	ok, _ := store.SingersExist(singerIDs)
	if !ok {
		api.Fail(c, apperr.SingerNotExisted)
		return
	}
	if u.CreateMusicMaxAmountPerDay != 0 {
		count, _ := store.CountTodayMusicByUser(u.ID, store.TodayStartMs())
		if count >= u.CreateMusicMaxAmountPerDay {
			api.Fail(c, apperr.OverCreateMusicTimesPerDay)
			return
		}
	}
	id, err := store.CreateMusic(body.Name, musicType, u.ID, body.Asset)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	store.LinkMusicSingers(id, singerIDs)
	syncMusicMetadataToAsset(id)
	api.OK(c, id)
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

func UpdateMusic(c *gin.Context) {
	u := middleware.GetUser(c)
	var body updateMusicBody
	if err := c.ShouldBindJSON(&body); err != nil {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	m, err := store.GetMusicByID(body.ID)
	if err != nil || (u.Admin == 0 && m.CreateUserID != u.ID) {
		api.Fail(c, apperr.MusicNotExisted)
		return
	}

	syncMetadata := false
	switch body.Key {
	case "name":
		name, ok := body.Value.(string)
		if !ok || name == "" || len(name) > 50 || strings.TrimSpace(name) != name {
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
		store.UpdateMusic(body.ID, "cover", cover)
		syncMetadata = true

	case "asset":
		asset, ok := body.Value.(string)
		if !ok || !assetExists(asset, config.AssetTypeMusic) {
			api.Fail(c, apperr.AssetNotExisted)
			return
		}
		store.UpdateMusic(body.ID, "asset", asset)
		syncMetadata = true

	case "singers":
		rawIDs, ok := body.Value.([]any)
		if !ok || len(rawIDs) == 0 {
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
		if ok, _ := store.SingersExist(ids); !ok {
			api.Fail(c, apperr.SingerNotExisted)
			return
		}
		store.DB().Exec(`DELETE FROM music_singer_relation WHERE musicId=?`, body.ID)
		store.LinkMusicSingers(body.ID, ids)
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
		store.UpdateMusic(body.ID, "type", int(musicType))

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
	}
	api.OK(c, nil)
}

// ── Delete music ──────────────────────────────────────────────────────────────

func DeleteMusic(c *gin.Context) {
	u := middleware.GetUser(c)
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
	if err != nil || (u.Admin == 0 && m.CreateUserID != u.ID) {
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
	type musicRow struct {
		ID    string
		Name  string
		Cover string
	}
	type singerRow struct {
		ID   string
		Name string
	}
	type mbRow struct {
		ID     string
		Name   string
		Cover  string
		UserID string
	}

	musicRows, _ := func() ([]musicRow, error) {
		rows, err := store.DB().Query(
			`SELECT id,name,cover FROM music WHERE cover!='' ORDER BY random() LIMIT ?`, quality,
		)
		if err != nil {
			return nil, err
		}
		defer rows.Close()
		var out []musicRow
		for rows.Next() {
			r := musicRow{}
			rows.Scan(&r.ID, &r.Name, &r.Cover)
			out = append(out, r)
		}
		return out, nil
	}()

	singerRows, _ := func() ([]singerRow, error) {
		rows, err := store.DB().Query(
			`SELECT id,name FROM singer ORDER BY random() LIMIT ?`, quality,
		)
		if err != nil {
			return nil, err
		}
		defer rows.Close()
		var out []singerRow
		for rows.Next() {
			r := singerRow{}
			rows.Scan(&r.ID, &r.Name)
			out = append(out, r)
		}
		return out, nil
	}()

	mbRows, _ := func() ([]mbRow, error) {
		rows, err := store.DB().Query(
			`SELECT id,name,cover,userId FROM musicbill WHERE public=1 AND cover!='' ORDER BY random() LIMIT ?`, quality,
		)
		if err != nil {
			return nil, err
		}
		defer rows.Close()
		var out []mbRow
		for rows.Next() {
			r := mbRow{}
			rows.Scan(&r.ID, &r.Name, &r.Cover, &r.UserID)
			out = append(out, r)
		}
		return out, nil
	}()

	musicIDs := make([]string, len(musicRows))
	for i, m := range musicRows {
		musicIDs[i] = m.ID
	}
	allSingers, _ := store.GetSingersInMusicIDs(musicIDs)
	bySong := groupSingersByMusic(allSingers)

	musicList := make([]gin.H, len(musicRows))
	for i, m := range musicRows {
		ss := make([]gin.H, 0)
		for _, s := range bySong[m.ID] {
			ss = append(ss, gin.H{"id": s.ID, "name": s.Name})
		}
		musicList[i] = gin.H{
			"id":      m.ID,
			"name":    m.Name,
			"cover":   config.AssetPublicURL(m.Cover, config.AssetTypeMusicCover),
			"singers": ss,
		}
	}

	singerIDs := make([]string, len(singerRows))
	for i, s := range singerRows {
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
	singerList := make([]gin.H, len(singerRows))
	for i, s := range singerRows {
		photos := photosBySinger[s.ID]
		if photos == nil {
			photos = []gin.H{}
		}
		singerList[i] = gin.H{
			"id":     s.ID,
			"name":   s.Name,
			"photos": photos,
		}
	}

	// Collect user IDs for musicbill owners
	mbUserIDs := make([]string, len(mbRows))
	for i, mb := range mbRows {
		mbUserIDs[i] = mb.UserID
	}
	userMap := map[string]string{}
	if len(mbUserIDs) > 0 {
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

	publicMBList := make([]gin.H, len(mbRows))
	for i, mb := range mbRows {
		publicMBList[i] = gin.H{
			"id":    mb.ID,
			"name":  mb.Name,
			"cover": config.AssetPublicURL(mb.Cover, config.AssetTypeMusicbillCover),
			"user":  gin.H{"id": mb.UserID, "nickname": userMap[mb.UserID]},
		}
	}

	api.OK(c, gin.H{
		"musicList":           musicList,
		"singerList":          singerList,
		"publicMusicbillList": publicMBList,
	})
}

// ── helpers ───────────────────────────────────────────────────────────────────

func musicListResponse(musics []store.Music, total int) gin.H {
	if len(musics) == 0 {
		return gin.H{"total": total, "musicList": []any{}}
	}
	ids := make([]string, len(musics))
	for i, m := range musics {
		ids[i] = m.ID
	}
	singers, _ := store.GetSingersInMusicIDs(ids)
	bySong := groupSingersByMusic(singers)

	list := make([]gin.H, len(musics))
	for i, m := range musics {
		list[i] = gin.H{
			"id":              m.ID,
			"type":            m.Type,
			"name":            m.Name,
			"aliases":         splitAliases(m.Aliases),
			"cover":           config.AssetPublicURL(m.Cover, config.AssetTypeMusicCover),
			"asset":           config.AssetPublicURL(m.Asset, config.AssetTypeMusic),
			"heat":            m.Heat,
			"createTimestamp": m.CreateTimestamp,
			"singers":         singerItems(bySong[m.ID]),
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

func adminMusicListResponse(musics []store.AdminMusic, total int) gin.H {
	if len(musics) == 0 {
		return gin.H{"total": total, "musicList": []any{}}
	}
	ids := make([]string, len(musics))
	for i, m := range musics {
		ids[i] = m.ID
	}
	singers, _ := store.GetSingersInMusicIDs(ids)
	bySong := groupSingersByMusic(singers)

	list := make([]gin.H, len(musics))
	for i, m := range musics {
		list[i] = gin.H{
			"id":              m.ID,
			"type":            m.Type,
			"name":            m.Name,
			"aliases":         splitAliases(m.Aliases),
			"cover":           config.AssetPublicURL(m.Cover, config.AssetTypeMusicCover),
			"asset":           config.AssetPublicURL(m.Asset, config.AssetTypeMusic),
			"heat":            m.Heat,
			"year":            nullInt64(m.Year),
			"createTimestamp": m.CreateTimestamp,
			"singers":         singerItems(bySong[m.ID]),
			"createUser": gin.H{
				"id":       m.CreateUserID,
				"username": m.CreateUserUsername,
				"nickname": m.CreateUserNickname,
			},
		}
	}
	return gin.H{"total": total, "musicList": list}
}

func groupSingersByMusic(singers []store.SingerInMusic) map[string][]store.SingerInMusic {
	m := map[string][]store.SingerInMusic{}
	for _, s := range singers {
		m[s.MusicID] = append(m[s.MusicID], s)
	}
	return m
}

func singerItems(ss []store.SingerInMusic) []gin.H {
	out := make([]gin.H, len(ss))
	for i, s := range ss {
		out[i] = gin.H{
			"id":      s.ID,
			"name":    s.Name,
			"aliases": splitAliases(s.Aliases),
		}
	}
	return out
}

func singerItemsWithPhotos(ss []store.SingerInMusic, photosBySinger map[string][]gin.H) []gin.H {
	out := make([]gin.H, len(ss))
	for i, s := range ss {
		photos := photosBySinger[s.ID]
		if photos == nil {
			photos = []gin.H{}
		}
		out[i] = gin.H{
			"id":      s.ID,
			"name":    s.Name,
			"aliases": splitAliases(s.Aliases),
			"photos":  photos,
		}
	}
	return out
}

func singerPhotosBySingerIDs(singerIDs []string) map[string][]gin.H {
	photosBySinger := map[string][]gin.H{}
	if len(singerIDs) == 0 {
		return photosBySinger
	}
	photos, _ := store.ListSingerPhotosBySingerIDs(singerIDs)
	for _, p := range photos {
		photosBySinger[p.SingerID] = append(photosBySinger[p.SingerID], gin.H{
			"id":          p.ID,
			"asset":       config.AssetPublicURL(p.Asset, config.AssetTypeSingerPhoto),
			"description": p.Description,
		})
	}
	return photosBySinger
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
