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

func GetMusicbillList(c *gin.Context) {
	u := middleware.GetUser(c)
	// own musicbills
	own, err := store.GetMusicbillsByUserID(u.ID)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	// shared musicbills accepted
	sharedRows, _ := store.DB().Query(
		`SELECT mb.id,mb.userId,mb.cover,mb.coverThumbnail,mb.name,mb.public,mb.createTimestamp,owner.nickname,owner.avatar
		FROM shared_musicbill smb
		JOIN musicbill mb ON smb.musicbillId=mb.id
		JOIN user owner ON mb.userId=owner.id
		WHERE smb.sharedUserId=? AND smb.accepted=1`, u.ID,
	)
	var shared []store.Musicbill
	if sharedRows != nil {
		defer sharedRows.Close()
		for sharedRows.Next() {
			var mb store.Musicbill
			var ownerNick, ownerAvatar string
			sharedRows.Scan(&mb.ID, &mb.UserID, &mb.Cover, &mb.CoverThumbnail, &mb.Name, &mb.Public, &mb.CreateTimestamp, &ownerNick, &ownerAvatar)
			shared = append(shared, mb)
		}
	}

	// collect all unique owner ids
	ownerIDs := map[string]bool{}
	for _, mb := range own {
		ownerIDs[mb.UserID] = true
	}
	for _, mb := range shared {
		ownerIDs[mb.UserID] = true
	}
	ids := make([]string, 0, len(ownerIDs))
	for id := range ownerIDs {
		ids = append(ids, id)
	}

	// batch load owners
	ownerMap := map[string]gin.H{}
	if len(ids) > 0 {
		rows, _ := store.DB().Query(
			`SELECT id,nickname,avatar FROM user WHERE id IN (`+store.Placeholders(len(ids))+`)`,
			store.Strs2Any(ids)...,
		)
		if rows != nil {
			defer rows.Close()
			for rows.Next() {
				var id, nick, avatar string
				rows.Scan(&id, &nick, &avatar)
				ownerMap[id] = gin.H{
					"id":       id,
					"nickname": nick,
					"avatar":   config.AssetPublicURL(avatar, config.AssetTypeUserAvatar),
				}
			}
		}
	}

	// shared user lists per musicbill
	allMusicbillIDs := make([]string, 0, len(own)+len(shared))
	for _, mb := range own {
		allMusicbillIDs = append(allMusicbillIDs, mb.ID)
	}
	for _, mb := range shared {
		allMusicbillIDs = append(allMusicbillIDs, mb.ID)
	}

	sharedUsersMap := map[string][]gin.H{}
	if len(allMusicbillIDs) > 0 {
		srows, _ := store.DB().Query(
			`SELECT smb.musicbillId,smb.sharedUserId,smb.accepted,u.nickname,u.avatar
			FROM shared_musicbill smb JOIN user u ON smb.sharedUserId=u.id
			WHERE smb.musicbillId IN (`+store.Placeholders(len(allMusicbillIDs))+`)`,
			store.Strs2Any(allMusicbillIDs)...,
		)
		if srows != nil {
			defer srows.Close()
			for srows.Next() {
				var mbID, uid, nick, avatar string
				var accepted int
				srows.Scan(&mbID, &uid, &accepted, &nick, &avatar)
				sharedUsersMap[mbID] = append(sharedUsersMap[mbID], gin.H{
					"id":       uid,
					"nickname": nick,
					"avatar":   config.AssetPublicURL(avatar, config.AssetTypeUserAvatar),
					"accepted": accepted == 1,
				})
			}
		}
	}

	buildItem := func(mb store.Musicbill) gin.H {
		return gin.H{
			"id":              mb.ID,
			"name":            mb.Name,
			"cover":           config.AssetPublicURL(mb.Cover, config.AssetTypeMusicbillCover),
			"coverThumbnail":  mb.CoverThumbnail,
			"public":          mb.Public == 1,
			"createTimestamp": mb.CreateTimestamp,
			"owner":           ownerMap[mb.UserID],
			"sharedUserList":  orEmpty(sharedUsersMap[mb.ID]),
		}
	}

	list := make([]gin.H, 0, len(own)+len(shared))
	for _, mb := range own {
		list = append(list, buildItem(mb))
	}
	for _, mb := range shared {
		list = append(list, buildItem(mb))
	}
	api.OK(c, list)
}

func orEmpty(v []gin.H) []gin.H {
	if v == nil {
		return []gin.H{}
	}
	return v
}

func GetMusicbill(c *gin.Context) {
	u := middleware.GetUser(c)
	id := c.Query("id")
	if id == "" {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	mb, err := store.GetMusicbillByID(id)
	if err != nil {
		api.Fail(c, apperr.MusicbillNotExisted)
		return
	}

	// access check: owner or accepted shared user
	sharedUsers, _ := store.GetSharedUsersInMusicbill(id)
	isShared := false
	for _, su := range sharedUsers {
		if su.SharedUserID == u.ID && su.Accepted == 1 {
			isShared = true
			break
		}
	}
	if mb.UserID != u.ID && !isShared {
		api.Fail(c, apperr.MusicbillNotExisted)
		return
	}

	musicList, _ := store.GetMusicsInMusicbill(id)
	musicIDs := make([]string, len(musicList))
	for i, m := range musicList {
		musicIDs[i] = m.ID
	}
	performerMap := map[string][]gin.H{}
	lyricistMap := map[string][]gin.H{}
	composerMap := map[string][]gin.H{}
	if len(musicIDs) > 0 {
		performers, _ := store.GetArtistsInMusicIDsByRole(musicIDs, store.MusicArtistRolePerformer)
		for _, artist := range performers {
			performerMap[artist.MusicID] = append(performerMap[artist.MusicID], gin.H{
				"id":      artist.ID,
				"name":    artist.Name,
				"aliases": splitAliases(artist.Aliases),
			})
		}
		lyricists, _ := store.GetArtistsInMusicIDsByRole(musicIDs, store.MusicArtistRoleLyricist)
		for _, artist := range lyricists {
			lyricistMap[artist.MusicID] = append(lyricistMap[artist.MusicID], gin.H{
				"id":      artist.ID,
				"name":    artist.Name,
				"aliases": splitAliases(artist.Aliases),
			})
		}
		composers, _ := store.GetArtistsInMusicIDsByRole(musicIDs, store.MusicArtistRoleComposer)
		for _, artist := range composers {
			composerMap[artist.MusicID] = append(composerMap[artist.MusicID], gin.H{
				"id":      artist.ID,
				"name":    artist.Name,
				"aliases": splitAliases(artist.Aliases),
			})
		}
	}

	musicItems := make([]gin.H, len(musicList))
	for i, m := range musicList {
		performers := performerMap[m.ID]
		if performers == nil {
			performers = []gin.H{}
		}
		lyricists := lyricistMap[m.ID]
		if lyricists == nil {
			lyricists = []gin.H{}
		}
		composers := composerMap[m.ID]
		if composers == nil {
			composers = []gin.H{}
		}
		musicItems[i] = gin.H{
			"id":             m.ID,
			"type":           m.Type,
			"name":           m.Name,
			"aliases":        splitAliases(m.Aliases),
			"cover":          config.AssetPublicURL(m.Cover, config.AssetTypeMusicCover),
			"coverThumbnail": m.CoverThumbnail,
			"asset":          config.AssetPublicURL(m.Asset, config.AssetTypeMusic),
			"performers":     performers,
			"lyricists":      lyricists,
			"composers":      composers,
		}
	}

	sharedUserItems := make([]gin.H, len(sharedUsers))
	for i, su := range sharedUsers {
		sharedUserItems[i] = gin.H{
			"id":       su.SharedUserID,
			"nickname": su.UserNickname,
			"avatar":   config.AssetPublicURL(su.UserAvatar, config.AssetTypeUserAvatar),
			"accepted": su.Accepted == 1,
		}
	}

	api.OK(c, gin.H{
		"id":              mb.ID,
		"name":            mb.Name,
		"cover":           config.AssetPublicURL(mb.Cover, config.AssetTypeMusicbillCover),
		"coverThumbnail":  mb.CoverThumbnail,
		"public":          mb.Public == 1,
		"createTimestamp": mb.CreateTimestamp,
		"owner": gin.H{
			"id":       mb.UserID,
			"nickname": mb.OwnerNickname,
			"avatar":   config.AssetPublicURL(mb.OwnerAvatar, config.AssetTypeUserAvatar),
		},
		"sharedUserList": sharedUserItems,
		"musicList":      musicItems,
	})
}

type createMusicbillBody struct {
	Name string `json:"name" binding:"required"`
}

const maxMusicbillAmountPerUser = 1024

func CreateMusicbill(c *gin.Context) {
	u := middleware.GetUser(c)
	var body createMusicbillBody
	if err := c.ShouldBindJSON(&body); err != nil || len(body.Name) > 64 {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	count, _ := store.CountUserMusicbills(u.ID)
	if count >= maxMusicbillAmountPerUser {
		api.Fail(c, apperr.OverUserMusicbillMaxAmount)
		return
	}
	id, err := store.CreateMusicbill(u.ID, body.Name)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	api.OK(c, id)
}

type updateMusicbillBody struct {
	ID           string `json:"id" binding:"required"`
	Key          string `json:"key" binding:"required"`
	Value        any    `json:"value"`
	CaptchaID    string `json:"captchaId"`
	CaptchaValue string `json:"captchaValue"`
}

func UpdateMusicbill(c *gin.Context) {
	u := middleware.GetUser(c)
	var body updateMusicbillBody
	if err := c.ShouldBindJSON(&body); err != nil {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	mb, err := store.GetMusicbillByID(body.ID)
	if err != nil {
		api.Fail(c, apperr.MusicbillNotExisted)
		return
	}
	// owner or accepted shared user can update
	if mb.UserID != u.ID {
		sharedUsers, _ := store.GetSharedUsersInMusicbill(body.ID)
		ok := false
		for _, su := range sharedUsers {
			if su.SharedUserID == u.ID && su.Accepted == 1 {
				ok = true
				break
			}
		}
		if !ok {
			api.Fail(c, apperr.MusicbillNotExisted)
			return
		}
	}

	switch body.Key {
	case "name":
		name, ok := body.Value.(string)
		if !ok || name == "" || len(name) > 64 {
			api.Fail(c, apperr.WrongParameter)
			return
		}
		if name == mb.Name {
			api.Fail(c, apperr.NoNeedToUpdate)
			return
		}
		store.UpdateMusicbill(body.ID, "name", name)
	case "cover":
		cover, ok := body.Value.(string)
		if !ok || cover == "" {
			api.Fail(c, apperr.WrongParameter)
			return
		}
		if cover == mb.Cover {
			api.Fail(c, apperr.NoNeedToUpdate)
			return
		}
		if !assetExists(cover, config.AssetTypeMusicbillCover) {
			api.Fail(c, apperr.AssetNotExisted)
			return
		}
		store.UpdateMusicbillCover(body.ID, cover, assetThumbnailDataURL(cover, config.AssetTypeMusicbillCover))
	case "public":
		pub, ok := body.Value.(bool)
		if !ok {
			api.Fail(c, apperr.WrongParameter)
			return
		}
		newVal := 0
		if pub {
			newVal = 1
		}
		if newVal == mb.Public {
			api.Fail(c, apperr.NoNeedToUpdate)
			return
		}
		// Un-publicizing wipes every collector's record, so guard it behind a captcha.
		if !pub {
			if body.CaptchaID == "" || body.CaptchaValue == "" {
				api.Fail(c, apperr.WrongCaptcha)
				return
			}
			if !verifyCaptcha(body.CaptchaID, body.CaptchaValue) {
				api.Fail(c, apperr.WrongCaptcha)
				return
			}
		}
		store.UpdateMusicbill(body.ID, "public", newVal)
		if !pub {
			store.ClearPublicMusicbillCollections(body.ID)
		}
	default:
		api.Fail(c, apperr.WrongParameter)
		return
	}
	api.OK(c, nil)
}

type deleteMusicbillQuery struct {
	ID           string `form:"id" binding:"required"`
	CaptchaID    string `form:"captchaId" binding:"required"`
	CaptchaValue string `form:"captchaValue" binding:"required"`
}

func DeleteMusicbill(c *gin.Context) {
	u := middleware.GetUser(c)
	var q deleteMusicbillQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		api.Fail(c, apperr.WrongParameter)
		return
	}

	// verify captcha
	if !verifyCaptcha(q.CaptchaID, q.CaptchaValue) {
		api.Fail(c, apperr.WrongCaptcha)
		return
	}

	mb, err := store.GetMusicbillByID(q.ID)
	if err != nil || mb.UserID != u.ID {
		api.Fail(c, apperr.MusicbillNotExisted)
		return
	}
	store.DeleteMusicbill(q.ID)
	api.OK(c, nil)
}

type addMusicToMusicbillBody struct {
	MusicbillID string `json:"musicbillId" binding:"required"`
	MusicID     string `json:"musicId" binding:"required"`
}

func AddMusicToMusicbill(c *gin.Context) {
	u := middleware.GetUser(c)
	var body addMusicToMusicbillBody
	if err := c.ShouldBindJSON(&body); err != nil {
		api.Fail(c, apperr.WrongParameter)
		return
	}

	mb, err := store.GetMusicbillByID(body.MusicbillID)
	if err != nil {
		api.Fail(c, apperr.MusicbillNotExisted)
		return
	}
	if mb.UserID != u.ID {
		sharedUsers, _ := store.GetSharedUsersInMusicbill(body.MusicbillID)
		ok := false
		for _, su := range sharedUsers {
			if su.SharedUserID == u.ID && su.Accepted == 1 {
				ok = true
				break
			}
		}
		if !ok {
			api.Fail(c, apperr.MusicbillNotExisted)
			return
		}
	}

	if _, err := store.GetMusicByID(body.MusicID); err != nil {
		api.Fail(c, apperr.MusicNotExisted)
		return
	}

	exists, _ := store.MusicExistsInMusicbill(body.MusicbillID, body.MusicID)
	if exists {
		api.Fail(c, apperr.MusicAlreadyExistedInMusicbill)
		return
	}

	store.AddMusicToMusicbill(body.MusicbillID, body.MusicID)
	api.OK(c, nil)
}

func RemoveMusicFromMusicbill(c *gin.Context) {
	u := middleware.GetUser(c)
	musicbillID := c.Query("musicbillId")
	musicID := c.Query("musicId")
	if musicbillID == "" || musicID == "" {
		api.Fail(c, apperr.WrongParameter)
		return
	}

	mb, err := store.GetMusicbillByID(musicbillID)
	if err != nil {
		api.Fail(c, apperr.MusicbillNotExisted)
		return
	}
	if mb.UserID != u.ID {
		sharedUsers, _ := store.GetSharedUsersInMusicbill(musicbillID)
		ok := false
		for _, su := range sharedUsers {
			if su.SharedUserID == u.ID && su.Accepted == 1 {
				ok = true
				break
			}
		}
		if !ok {
			api.Fail(c, apperr.MusicbillNotExisted)
			return
		}
	}

	removed, _ := store.RemoveMusicFromMusicbill(musicbillID, musicID)
	if !removed {
		api.Fail(c, apperr.MusicNotExistedInMusicbill)
		return
	}
	api.OK(c, nil)
}

type addSharedUserBody struct {
	MusicbillID string `json:"musicbillId" binding:"required"`
	Username    string `json:"username" binding:"required"`
}

func AddMusicbillSharedUser(c *gin.Context) {
	u := middleware.GetUser(c)
	var body addSharedUserBody
	if err := c.ShouldBindJSON(&body); err != nil {
		api.Fail(c, apperr.WrongParameter)
		return
	}

	mb, err := store.GetMusicbillByID(body.MusicbillID)
	if err != nil {
		api.Fail(c, apperr.MusicbillNotExisted)
		return
	}

	sharedUsers, _ := store.GetSharedUsersInMusicbill(body.MusicbillID)
	if mb.UserID != u.ID {
		ok := false
		for _, su := range sharedUsers {
			if su.SharedUserID == u.ID && su.Accepted == 1 {
				ok = true
				break
			}
		}
		if !ok {
			api.Fail(c, apperr.MusicbillNotExisted)
			return
		}
	}

	target, err := store.GetUserByUsername(body.Username)
	if err != nil {
		api.Fail(c, apperr.UserNotExisted)
		return
	}
	if target.ID == mb.UserID {
		api.Fail(c, apperr.CanNotInviteMusicbillOwner)
		return
	}
	for _, su := range sharedUsers {
		if su.SharedUserID == target.ID {
			api.Fail(c, apperr.RepeatedSharedMusicbillInvitation)
			return
		}
	}

	store.AddMusicbillSharedUser(body.MusicbillID, target.ID, u.ID)
	api.OK(c, nil)
}

func DeleteMusicbillSharedUser(c *gin.Context) {
	u := middleware.GetUser(c)
	musicbillID := c.Query("musicbillId")
	userID := c.Query("userId")
	if musicbillID == "" || userID == "" {
		api.Fail(c, apperr.WrongParameter)
		return
	}

	mb, err := store.GetMusicbillByID(musicbillID)
	if err != nil {
		api.Fail(c, apperr.MusicbillNotExisted)
		return
	}

	// owner can remove anyone; shared user can only remove themselves
	if u.ID != mb.UserID && u.ID != userID {
		api.Fail(c, apperr.NoPermissionToDeleteMusicbillSharedUser)
		return
	}

	removed, _ := store.RemoveMusicbillSharedUser(musicbillID, userID)
	if !removed {
		api.Fail(c, apperr.MusicbillNotExisted)
		return
	}
	api.OK(c, nil)
}

func GetSharedMusicbillInvitationList(c *gin.Context) {
	u := middleware.GetUser(c)
	invitations, _ := store.GetPendingInvitationsForUser(u.ID)
	list := make([]gin.H, len(invitations))
	for i, inv := range invitations {
		list[i] = gin.H{
			"id":                 inv.ID,
			"inviteTimestamp":    inv.InviteTimestamp,
			"inviteUserId":       inv.InviteUserID,
			"inviteUserNickname": inv.UserNickname,
			"musicbillId":        inv.MusicbillID,
			"musicbillName":      inv.MusicbillName,
		}
	}
	api.OK(c, list)
}

type transferMusicbillOwnerBody struct {
	MusicbillID  string `json:"musicbillId" binding:"required"`
	UserID       string `json:"userId" binding:"required"`
	CaptchaID    string `json:"captchaId" binding:"required"`
	CaptchaValue string `json:"captchaValue" binding:"required"`
}

func TransferMusicbillOwner(c *gin.Context) {
	u := middleware.GetUser(c)
	var body transferMusicbillOwnerBody
	if err := c.ShouldBindJSON(&body); err != nil {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	if body.UserID == u.ID {
		api.Fail(c, apperr.WrongParameter)
		return
	}

	if !verifyCaptcha(body.CaptchaID, body.CaptchaValue) {
		api.Fail(c, apperr.WrongCaptcha)
		return
	}

	mb, err := store.GetMusicbillByID(body.MusicbillID)
	if err != nil {
		api.Fail(c, apperr.MusicbillNotExisted)
		return
	}
	if mb.UserID != u.ID {
		api.Fail(c, apperr.NotMusicbillOwner)
		return
	}

	if _, err := store.GetUserByID(body.UserID); err != nil {
		api.Fail(c, apperr.UserNotExisted)
		return
	}

	sharedUsers, _ := store.GetSharedUsersInMusicbill(body.MusicbillID)
	targetAccepted := false
	for _, su := range sharedUsers {
		if su.SharedUserID == body.UserID && su.Accepted == 1 {
			targetAccepted = true
			break
		}
	}
	if !targetAccepted {
		api.Fail(c, apperr.TargetUserNotAcceptedSharedUser)
		return
	}

	ok, err := store.TransferMusicbillOwner(body.MusicbillID, u.ID, body.UserID)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	if !ok {
		api.Fail(c, apperr.NotMusicbillOwner)
		return
	}
	api.OK(c, nil)
}

type acceptInvitationBody struct {
	ID int64 `json:"id" binding:"required"`
}

func AcceptSharedMusicbillInvitation(c *gin.Context) {
	u := middleware.GetUser(c)
	var body acceptInvitationBody
	if err := c.ShouldBindJSON(&body); err != nil {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	accepted, _ := store.AcceptInvitation(body.ID, u.ID)
	if !accepted {
		api.Fail(c, apperr.SharedMusicbillInvitationNotExisted)
		return
	}
	api.OK(c, nil)
}

// Public musicbill

func GetPublicMusicbill(c *gin.Context) {
	u := middleware.GetUser(c)
	id := c.Query("id")
	if id == "" {
		api.Fail(c, apperr.WrongParameter)
		return
	}

	mb, err := store.GetMusicbillByID(id)
	if err != nil {
		api.Fail(c, apperr.MusicbillNotExisted)
		return
	}
	if mb.Public != 1 && mb.UserID != u.ID {
		api.Fail(c, apperr.MusicbillNotExisted)
		return
	}

	musicList, _ := store.GetMusicsInMusicbill(id)
	musicIDs := make([]string, len(musicList))
	for i, m := range musicList {
		musicIDs[i] = m.ID
	}
	performerMap := map[string][]gin.H{}
	lyricistMap := map[string][]gin.H{}
	composerMap := map[string][]gin.H{}
	if len(musicIDs) > 0 {
		performers, _ := store.GetArtistsInMusicIDsByRole(musicIDs, store.MusicArtistRolePerformer)
		for _, artist := range performers {
			performerMap[artist.MusicID] = append(performerMap[artist.MusicID], gin.H{
				"id":      artist.ID,
				"name":    artist.Name,
				"aliases": splitAliases(artist.Aliases),
			})
		}
		lyricists, _ := store.GetArtistsInMusicIDsByRole(musicIDs, store.MusicArtistRoleLyricist)
		for _, artist := range lyricists {
			lyricistMap[artist.MusicID] = append(lyricistMap[artist.MusicID], gin.H{
				"id":      artist.ID,
				"name":    artist.Name,
				"aliases": splitAliases(artist.Aliases),
			})
		}
		composers, _ := store.GetArtistsInMusicIDsByRole(musicIDs, store.MusicArtistRoleComposer)
		for _, artist := range composers {
			composerMap[artist.MusicID] = append(composerMap[artist.MusicID], gin.H{
				"id":      artist.ID,
				"name":    artist.Name,
				"aliases": splitAliases(artist.Aliases),
			})
		}
	}

	musicItems := make([]gin.H, len(musicList))
	for i, m := range musicList {
		performers := performerMap[m.ID]
		if performers == nil {
			performers = []gin.H{}
		}
		lyricists := lyricistMap[m.ID]
		if lyricists == nil {
			lyricists = []gin.H{}
		}
		composers := composerMap[m.ID]
		if composers == nil {
			composers = []gin.H{}
		}
		musicItems[i] = gin.H{
			"id":             m.ID,
			"type":           m.Type,
			"name":           m.Name,
			"aliases":        splitAliases(m.Aliases),
			"cover":          config.AssetPublicURL(m.Cover, config.AssetTypeMusicCover),
			"coverThumbnail": m.CoverThumbnail,
			"asset":          config.AssetPublicURL(m.Asset, config.AssetTypeMusic),
			"performers":     performers,
			"lyricists":      lyricists,
			"composers":      composers,
		}
	}

	collected := store.IsPublicMusicbillCollected(id, u.ID)

	api.OK(c, gin.H{
		"id":              mb.ID,
		"name":            mb.Name,
		"cover":           config.AssetPublicURL(mb.Cover, config.AssetTypeMusicbillCover),
		"coverThumbnail":  mb.CoverThumbnail,
		"public":          mb.Public == 1,
		"createTimestamp": mb.CreateTimestamp,
		"user": gin.H{
			"id":       mb.UserID,
			"nickname": mb.OwnerNickname,
			"avatar":   config.AssetPublicURL(mb.OwnerAvatar, config.AssetTypeUserAvatar),
		},
		"musicList": musicItems,
		"collected": collected,
	})
}

func SearchPublicMusicbill(c *gin.Context) {
	keyword := strings.TrimSpace(c.Query("keyword"))
	page := queryInt(c, "page", 1)
	pageSize := queryInt(c, "pageSize", 20)
	if keyword == "" || page < 1 || pageSize < 1 || pageSize > 100 {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	total, mbs, err := store.SearchPublicMusicbills(keyword, page, pageSize)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	list := make([]gin.H, len(mbs))
	for i, mb := range mbs {
		list[i] = gin.H{
			"id":             mb.ID,
			"name":           mb.Name,
			"cover":          config.AssetPublicURL(mb.Cover, config.AssetTypeMusicbillCover),
			"coverThumbnail": mb.CoverThumbnail,
			"musicCount":     mb.MusicCount,
			"user": gin.H{
				"id":       mb.UserID,
				"nickname": mb.OwnerNickname,
				"avatar":   config.AssetPublicURL(mb.OwnerAvatar, config.AssetTypeUserAvatar),
			},
		}
	}
	api.OK(c, gin.H{"total": total, "musicbillList": list})
}

type collectMusicbillBody struct {
	ID string `json:"id" binding:"required"`
}

func CollectPublicMusicbill(c *gin.Context) {
	u := middleware.GetUser(c)
	var body collectMusicbillBody
	if err := c.ShouldBindJSON(&body); err != nil {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	mb, err := store.GetPublicMusicbillByID(body.ID)
	if err != nil || mb.Public != 1 {
		api.Fail(c, apperr.MusicbillNotExisted)
		return
	}
	if store.IsPublicMusicbillCollected(body.ID, u.ID) {
		api.Fail(c, apperr.CanNotCollectMusicbillRepeatly)
		return
	}
	store.CollectPublicMusicbill(body.ID, u.ID)
	api.OK(c, nil)
}

func UncollectPublicMusicbill(c *gin.Context) {
	u := middleware.GetUser(c)
	id := c.Query("id")
	if id == "" {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	removed, _ := store.UncollectPublicMusicbill(id, u.ID)
	if !removed {
		api.Fail(c, apperr.MusicbillNotCollected)
		return
	}
	api.OK(c, nil)
}

func GetPublicMusicbillCollectionList(c *gin.Context) {
	u := middleware.GetUser(c)
	keyword := c.Query("keyword")
	page := queryInt(c, "page", 1)
	pageSize := queryInt(c, "pageSize", 20)
	if page < 1 || pageSize < 1 || pageSize > 100 {
		api.Fail(c, apperr.WrongParameter)
		return
	}

	pat := "%" + keyword + "%"
	var total int
	var rows interface{ Close() error }

	if keyword != "" {
		store.DB().QueryRow(
			`SELECT COUNT(mc.id) FROM public_musicbill_collection mc
			LEFT JOIN musicbill m ON mc.musicbillId=m.id
			WHERE m.public=1 AND m.name LIKE ? AND mc.userId=?`,
			pat, u.ID,
		).Scan(&total)
		// 收藏页直接展示乐单音乐数量，在列表查询里一起取出。
		r, err := store.DB().Query(
			`SELECT m.id,m.name,m.cover,m.coverThumbnail,m.userId,
				(SELECT COUNT(1) FROM musicbill_music mm WHERE mm.musicbillId=m.id) AS musicCount
			FROM public_musicbill_collection mc
			LEFT JOIN musicbill m ON m.id=mc.musicbillId
			WHERE m.public=1 AND m.name LIKE ? AND mc.userId=?
			ORDER BY mc.collectTimestamp DESC LIMIT ? OFFSET ?`,
			pat, u.ID, pageSize, (page-1)*pageSize,
		)
		if err != nil {
			api.Fail(c, apperr.ServerError)
			return
		}
		rows = r
		defer r.Close()

		type row struct {
			ID, Name, Cover, CoverThumbnail, UserID string
			MusicCount                              int
		}
		var items []row
		sqlRows := r
		for sqlRows.Next() {
			var item row
			sqlRows.Scan(&item.ID, &item.Name, &item.Cover, &item.CoverThumbnail, &item.UserID, &item.MusicCount)
			items = append(items, item)
		}

		// load owners
		ownerIDs := make([]string, 0)
		seen := map[string]bool{}
		for _, item := range items {
			if !seen[item.UserID] {
				ownerIDs = append(ownerIDs, item.UserID)
				seen[item.UserID] = true
			}
		}
		ownerMap := map[string]gin.H{}
		if len(ownerIDs) > 0 {
			or, _ := store.DB().Query(
				`SELECT id,nickname FROM user WHERE id IN (`+store.Placeholders(len(ownerIDs))+`)`,
				store.Strs2Any(ownerIDs)...,
			)
			if or != nil {
				defer or.Close()
				for or.Next() {
					var id, nick string
					or.Scan(&id, &nick)
					ownerMap[id] = gin.H{"id": id, "nickname": nick}
				}
			}
		}

		list := make([]gin.H, len(items))
		for i, item := range items {
			list[i] = gin.H{
				"id":             item.ID,
				"name":           item.Name,
				"cover":          config.AssetPublicURL(item.Cover, config.AssetTypeMusicbillCover),
				"coverThumbnail": item.CoverThumbnail,
				"musicCount":     item.MusicCount,
				"user":           ownerMap[item.UserID],
			}
		}
		_ = rows
		api.OK(c, gin.H{"total": total, "collectionList": list})
		return
	}

	// no keyword
	store.DB().QueryRow(
		`SELECT COUNT(mc.id) FROM public_musicbill_collection mc
		LEFT JOIN musicbill m ON mc.musicbillId=m.id
		WHERE m.public=1 AND mc.userId=?`,
		u.ID,
	).Scan(&total)
	r, err := store.DB().Query(
		`SELECT m.id,m.name,m.cover,m.coverThumbnail,m.userId,
			(SELECT COUNT(1) FROM musicbill_music mm WHERE mm.musicbillId=m.id) AS musicCount
		FROM public_musicbill_collection mc
		LEFT JOIN musicbill m ON m.id=mc.musicbillId
		WHERE m.public=1 AND mc.userId=?
		ORDER BY mc.collectTimestamp DESC LIMIT ? OFFSET ?`,
		u.ID, pageSize, (page-1)*pageSize,
	)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	defer r.Close()

	type row struct {
		ID, Name, Cover, CoverThumbnail, UserID string
		MusicCount                              int
	}
	var items []row
	for r.Next() {
		var item row
		r.Scan(&item.ID, &item.Name, &item.Cover, &item.CoverThumbnail, &item.UserID, &item.MusicCount)
		items = append(items, item)
	}

	ownerIDs := make([]string, 0)
	seen := map[string]bool{}
	for _, item := range items {
		if !seen[item.UserID] {
			ownerIDs = append(ownerIDs, item.UserID)
			seen[item.UserID] = true
		}
	}
	ownerMap := map[string]gin.H{}
	if len(ownerIDs) > 0 {
		or, _ := store.DB().Query(
			`SELECT id,nickname FROM user WHERE id IN (`+store.Placeholders(len(ownerIDs))+`)`,
			store.Strs2Any(ownerIDs)...,
		)
		if or != nil {
			defer or.Close()
			for or.Next() {
				var id, nick string
				or.Scan(&id, &nick)
				ownerMap[id] = gin.H{"id": id, "nickname": nick}
			}
		}
	}

	list := make([]gin.H, len(items))
	for i, item := range items {
		list[i] = gin.H{
			"id":             item.ID,
			"name":           item.Name,
			"cover":          config.AssetPublicURL(item.Cover, config.AssetTypeMusicbillCover),
			"coverThumbnail": item.CoverThumbnail,
			"musicCount":     item.MusicCount,
			"user":           ownerMap[item.UserID],
		}
	}
	api.OK(c, gin.H{"total": total, "collectionList": list})
}

func verifyCaptcha(id, value string) bool {
	ok, _ := auth.VerifyCaptcha(id, value)
	return ok
}
