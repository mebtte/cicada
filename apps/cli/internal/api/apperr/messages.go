package apperr

import "strings"

const (
	LanguageEnglish            = "en"
	LanguageSimplifiedChinese  = "zh-Hans"
	LanguageTraditionalChinese = "zh-Hant"
)

type localizedMessage struct {
	english            string
	simplifiedChinese  string
	traditionalChinese string
}

var localizedMessages = map[string]localizedMessage{
	ServerError: {
		english:            "The server encountered an error. Please try again later.",
		simplifiedChinese:  "服务器遇到错误，请稍后重试。",
		traditionalChinese: "服務器遇到錯誤，請稍後重試。",
	},
	WrongParameter: {
		english:            "Some request information is invalid. Please check it and try again.",
		simplifiedChinese:  "部分请求信息有误，请检查后重试。",
		traditionalChinese: "部分請求信息有誤，請檢查後重試。",
	},
	WrongCaptcha: {
		english:            "The verification code is incorrect. Please try again.",
		simplifiedChinese:  "验证码不正确，请重试。",
		traditionalChinese: "驗證碼不正確，請重試。",
	},
	NotAuthorized: {
		english:            "Your session has expired. Please sign in again.",
		simplifiedChinese:  "登录状态已失效，请重新登录。",
		traditionalChinese: "登錄狀態已失效，請重新登錄。",
	},
	NotAuthorizedForAdmin: {
		english:            "Administrator access is required for this action.",
		simplifiedChinese:  "此操作需要管理员权限。",
		traditionalChinese: "此操作需要管理員權限。",
	},
	UsernameAlreadyRegistered: {
		english:            "This username is already in use.",
		simplifiedChinese:  "该用户名已被使用。",
		traditionalChinese: "該用戶名已被使用。",
	},
	MusicbillNotExisted: {
		english:            "This playlist no longer exists.",
		simplifiedChinese:  "该乐单不存在或已被删除。",
		traditionalChinese: "該樂單不存在或已被刪除。",
	},
	MusicNotExisted: {
		english:            "This song no longer exists.",
		simplifiedChinese:  "该音乐不存在或已被删除。",
		traditionalChinese: "該音樂不存在或已被刪除。",
	},
	MusicAlreadyExistedInMusicbill: {
		english:            "This song is already in the playlist.",
		simplifiedChinese:  "该音乐已在乐单中。",
		traditionalChinese: "該音樂已在樂單中。",
	},
	MusicNotExistedInMusicbill: {
		english:            "This song is not in the playlist.",
		simplifiedChinese:  "该音乐不在乐单中。",
		traditionalChinese: "該音樂不在樂單中。",
	},
	AssetOversize: {
		english:            "The selected file is too large.",
		simplifiedChinese:  "所选文件过大。",
		traditionalChinese: "所選文件過大。",
	},
	WrongAssetType: {
		english:            "This file type is not supported.",
		simplifiedChinese:  "不支持此文件类型。",
		traditionalChinese: "不支持此文件類型。",
	},
	AssetNotExisted: {
		english:            "This file no longer exists.",
		simplifiedChinese:  "该文件不存在或已被删除。",
		traditionalChinese: "該文件不存在或已被刪除。",
	},
	ArtistNotExisted: {
		english:            "This artist no longer exists.",
		simplifiedChinese:  "该艺人不存在或已被删除。",
		traditionalChinese: "該藝人不存在或已被刪除。",
	},
	ArtistAlreadyExisted: {
		english:            "An artist with this name already exists. Confirm to create a duplicate.",
		simplifiedChinese:  "已存在同名艺人，请确认是否仍要重复创建。",
		traditionalChinese: "已存在同名藝人，請確認是否仍要重復創建。",
	},
	ArtistHasMusicCanNotBeDeleted: {
		english:            "This artist cannot be deleted while songs are still associated with them.",
		simplifiedChinese:  "该艺人仍关联音乐，暂时无法删除。",
		traditionalChinese: "該藝人仍關聯音樂，暫時無法刪除。",
	},
	NoNeedToUpdate: {
		english:            "There are no changes to save.",
		simplifiedChinese:  "没有需要保存的更改。",
		traditionalChinese: "沒有需要保存的更改。",
	},
	AliasOverMaxLength: {
		english:            "The alias is too long.",
		simplifiedChinese:  "别名过长。",
		traditionalChinese: "別名過長。",
	},
	RepeatedAlias: {
		english:            "Duplicate aliases are not allowed.",
		simplifiedChinese:  "不能添加重复的别名。",
		traditionalChinese: "不能添加重復的別名。",
	},
	NicknameHasUsedByOthers: {
		english:            "This nickname is already in use.",
		simplifiedChinese:  "该昵称已被其他用户使用。",
		traditionalChinese: "該暱稱已被其他用戶使用。",
	},
	UserNotExisted: {
		english:            "This user no longer exists.",
		simplifiedChinese:  "该用户不存在或已被删除。",
		traditionalChinese: "該用戶不存在或已被刪除。",
	},
	MusicForkedByOtherCanNotBeDeleted: {
		english:            "This song cannot be deleted because another song was created from it.",
		simplifiedChinese:  "其他音乐基于该音乐创建，因此暂时无法删除。",
		traditionalChinese: "其他音樂基於該音樂創建，因此暫時無法刪除。",
	},
	CanNotCollectMusicbillRepeatly: {
		english:            "This playlist is already in your collection.",
		simplifiedChinese:  "该乐单已收藏。",
		traditionalChinese: "該樂單已收藏。",
	},
	MusicbillNotCollected: {
		english:            "This playlist is not in your collection.",
		simplifiedChinese:  "尚未收藏该乐单。",
		traditionalChinese: "尚未收藏該樂單。",
	},
	OverUserMusicbillMaxAmount: {
		english:            "You have reached the maximum number of playlists.",
		simplifiedChinese:  "乐单数量已达到上限。",
		traditionalChinese: "樂單數量已達到上限。",
	},
	CanNotDeleteAdmin: {
		english:            "The administrator account cannot be deleted.",
		simplifiedChinese:  "不能删除管理员账号。",
		traditionalChinese: "不能刪除管理員賬號。",
	},
	CanNotResetOwnPassword: {
		english:            "You cannot reset your own password here.",
		simplifiedChinese:  "不能在此处重置自己的密码。",
		traditionalChinese: "不能在此處重置自己的密碼。",
	},
	UserIsAdminAlready: {
		english:            "The selected user is already an administrator, or their own role cannot be changed.",
		simplifiedChinese:  "所选用户已是管理员，或不能修改自己的管理员角色。",
		traditionalChinese: "所選用戶已是管理員，或不能修改自己的管理員角色。",
	},
	MusicPlayRecordNotExisted: {
		english:            "This play record no longer exists.",
		simplifiedChinese:  "该播放记录不存在或已被删除。",
		traditionalChinese: "該播放記錄不存在或已被刪除。",
	},
	CanNotInviteMusicbillOwner: {
		english:            "The playlist owner cannot be invited as a collaborator.",
		simplifiedChinese:  "不能邀请乐单所有者成为协作者。",
		traditionalChinese: "不能邀請樂單所有者成為協作者。",
	},
	RepeatedSharedMusicbillInvitation: {
		english:            "This user has already been invited to the playlist.",
		simplifiedChinese:  "已邀请该用户共享乐单。",
		traditionalChinese: "已邀請該用戶共享樂單。",
	},
	NoPermissionToDeleteMusicbillSharedUser: {
		english:            "You do not have permission to remove this playlist collaborator.",
		simplifiedChinese:  "你没有权限移除该乐单协作者。",
		traditionalChinese: "你沒有權限移除該樂單協作者。",
	},
	SharedMusicbillInvitationNotExisted: {
		english:            "This playlist invitation no longer exists.",
		simplifiedChinese:  "该乐单邀请不存在或已失效。",
		traditionalChinese: "該樂單邀請不存在或已失效。",
	},
	NotMusicbillOwner: {
		english:            "Only the playlist owner can perform this action.",
		simplifiedChinese:  "只有乐单所有者可以执行此操作。",
		traditionalChinese: "只有樂單所有者可以執行此操作。",
	},
	TargetUserNotAcceptedSharedUser: {
		english:            "The selected user must accept the playlist invitation first.",
		simplifiedChinese:  "所选用户需要先接受乐单邀请。",
		traditionalChinese: "所選用戶需要先接受樂單邀請。",
	},
	WrongUsernameOrPassword: {
		english:            "The username or password is incorrect.",
		simplifiedChinese:  "用户名或密码不正确。",
		traditionalChinese: "用戶名或密碼不正確。",
	},
	LackOf2FAToken: {
		english:            "Please enter the two-factor authentication code.",
		simplifiedChinese:  "请输入两步验证代码。",
		traditionalChinese: "請輸入兩步驗證代碼。",
	},
	Wrong2FAToken: {
		english:            "The two-factor authentication code is incorrect.",
		simplifiedChinese:  "两步验证代码不正确。",
		traditionalChinese: "兩步驗證代碼不正確。",
	},
	TwoFAEnabledAlready: {
		english:            "Two-factor authentication is already enabled.",
		simplifiedChinese:  "两步验证已启用。",
		traditionalChinese: "兩步驗證已啓用。",
	},
	Need2FA: {
		english:            "Two-factor authentication is required to continue.",
		simplifiedChinese:  "需要完成两步验证才能继续。",
		traditionalChinese: "需要完成兩步驗證才能繼續。",
	},
	NoNeedTo2FA: {
		english:            "Two-factor authentication is not required for this account.",
		simplifiedChinese:  "该账号无需两步验证。",
		traditionalChinese: "該賬號無需兩步驗證。",
	},
	LoginTooFrequent: {
		english:            "There have been too many sign-in attempts. Please try again later.",
		simplifiedChinese:  "登录尝试过于频繁，请稍后重试。",
		traditionalChinese: "登錄嘗試過於頻繁，請稍後重試。",
	},
	LoginWith2FATooFrequent: {
		english:            "There have been too many two-factor authentication attempts. Please try again later.",
		simplifiedChinese:  "两步验证尝试过于频繁，请稍后重试。",
		traditionalChinese: "兩步驗證嘗試過於頻繁，請稍後重試。",
	},
	InstrumentalHasNoLyric: {
		english:            "Instrumental music cannot have lyrics.",
		simplifiedChinese:  "纯音乐不能添加歌词。",
		traditionalChinese: "純音樂不能添加歌詞。",
	},
	InstrumentalHasNoLyricist: {
		english:            "Instrumental music cannot have a lyricist.",
		simplifiedChinese:  "纯音乐不能设置作词人。",
		traditionalChinese: "純音樂不能設置作詞人。",
	},
	PartialUploadNotExisted: {
		english:            "This upload has expired. Please start the upload again.",
		simplifiedChinese:  "本次上传已失效，请重新上传。",
		traditionalChinese: "本次上傳已失效，請重新上傳。",
	},
	PartialUploadOwnerMismatch: {
		english:            "This upload belongs to another user. Please start a new upload.",
		simplifiedChinese:  "本次上传属于其他用户，请重新上传。",
		traditionalChinese: "本次上傳屬於其他用戶，請重新上傳。",
	},
	PartialUploadRangeInvalid: {
		english:            "The upload progress is out of sync. Please try the upload again.",
		simplifiedChinese:  "上传进度不同步，请重试。",
		traditionalChinese: "上傳進度不同步，請重試。",
	},
	PartialUploadHashMismatch: {
		english:            "The uploaded file could not be verified. Please upload it again.",
		simplifiedChinese:  "上传文件校验失败，请重新上传。",
		traditionalChinese: "上傳文件校驗失敗，請重新上傳。",
	},
	DiskSpaceInsufficient: {
		english:            "The server does not have enough storage space.",
		simplifiedChinese:  "服务器存储空间不足。",
		traditionalChinese: "服務器存儲空間不足。",
	},
	RepeatedFollowedArtist: {
		english:            "This artist is already followed in the playlist.",
		simplifiedChinese:  "该乐单已关注此艺人。",
		traditionalChinese: "該樂單已關注此藝人。",
	},
}

var fallbackMessages = localizedMessage{
	english:            "The request could not be completed. Please try again.",
	simplifiedChinese:  "请求未能完成，请重试。",
	traditionalChinese: "請求未能完成，請重試。",
}

// Message converts a stable application error code into user-facing text.
// Missing, empty, or unsupported client languages intentionally use English.
func Message(code, clientLanguage string) string {
	if code == Success {
		return ""
	}
	message, ok := localizedMessages[code]
	if !ok {
		message = fallbackMessages
	}
	// 标签匹配不区分大小写，但文档和客户端始终输出规范大小写。
	if strings.EqualFold(clientLanguage, LanguageSimplifiedChinese) {
		return message.simplifiedChinese
	}
	if strings.EqualFold(clientLanguage, LanguageTraditionalChinese) {
		return message.traditionalChinese
	}
	return message.english
}
