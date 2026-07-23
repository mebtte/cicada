package apperr

import "strings"

const (
	LanguageEnglish           = "en"
	LanguageSimplifiedChinese = "zh-Hans"
)

type localizedMessage struct {
	english           string
	simplifiedChinese string
}

var localizedMessages = map[string]localizedMessage{
	ServerError: {
		english:           "The server encountered an error. Please try again later.",
		simplifiedChinese: "服务器遇到错误，请稍后重试。",
	},
	WrongParameter: {
		english:           "Some request information is invalid. Please check it and try again.",
		simplifiedChinese: "部分请求信息有误，请检查后重试。",
	},
	WrongCaptcha: {
		english:           "The verification code is incorrect. Please try again.",
		simplifiedChinese: "验证码不正确，请重试。",
	},
	NotAuthorized: {
		english:           "Your session has expired. Please sign in again.",
		simplifiedChinese: "登录状态已失效，请重新登录。",
	},
	NotAuthorizedForAdmin: {
		english:           "Administrator access is required for this action.",
		simplifiedChinese: "此操作需要管理员权限。",
	},
	UsernameAlreadyRegistered: {
		english:           "This username is already in use.",
		simplifiedChinese: "该用户名已被使用。",
	},
	MusicbillNotExisted: {
		english:           "This playlist no longer exists.",
		simplifiedChinese: "该乐单不存在或已被删除。",
	},
	MusicNotExisted: {
		english:           "This song no longer exists.",
		simplifiedChinese: "该音乐不存在或已被删除。",
	},
	MusicAlreadyExistedInMusicbill: {
		english:           "This song is already in the playlist.",
		simplifiedChinese: "该音乐已在乐单中。",
	},
	MusicNotExistedInMusicbill: {
		english:           "This song is not in the playlist.",
		simplifiedChinese: "该音乐不在乐单中。",
	},
	AssetOversize: {
		english:           "The selected file is too large.",
		simplifiedChinese: "所选文件过大。",
	},
	WrongAssetType: {
		english:           "This file type is not supported.",
		simplifiedChinese: "不支持此文件类型。",
	},
	AssetNotExisted: {
		english:           "This file no longer exists.",
		simplifiedChinese: "该文件不存在或已被删除。",
	},
	ArtistNotExisted: {
		english:           "This artist no longer exists.",
		simplifiedChinese: "该艺人不存在或已被删除。",
	},
	ArtistAlreadyExisted: {
		english:           "An artist with this name already exists. Confirm to create a duplicate.",
		simplifiedChinese: "已存在同名艺人，请确认是否仍要重复创建。",
	},
	ArtistHasMusicCanNotBeDeleted: {
		english:           "This artist cannot be deleted while songs are still associated with them.",
		simplifiedChinese: "该艺人仍关联音乐，暂时无法删除。",
	},
	NoNeedToUpdate: {
		english:           "There are no changes to save.",
		simplifiedChinese: "没有需要保存的更改。",
	},
	AliasOverMaxLength: {
		english:           "The alias is too long.",
		simplifiedChinese: "别名过长。",
	},
	RepeatedAlias: {
		english:           "Duplicate aliases are not allowed.",
		simplifiedChinese: "不能添加重复的别名。",
	},
	NicknameHasUsedByOthers: {
		english:           "This nickname is already in use.",
		simplifiedChinese: "该昵称已被其他用户使用。",
	},
	UserNotExisted: {
		english:           "This user no longer exists.",
		simplifiedChinese: "该用户不存在或已被删除。",
	},
	MusicForkedByOtherCanNotBeDeleted: {
		english:           "This song cannot be deleted because another song was created from it.",
		simplifiedChinese: "其他音乐基于该音乐创建，因此暂时无法删除。",
	},
	CanNotCollectMusicbillRepeatly: {
		english:           "This playlist is already in your collection.",
		simplifiedChinese: "该乐单已收藏。",
	},
	MusicbillNotCollected: {
		english:           "This playlist is not in your collection.",
		simplifiedChinese: "尚未收藏该乐单。",
	},
	OverUserMusicbillMaxAmount: {
		english:           "You have reached the maximum number of playlists.",
		simplifiedChinese: "乐单数量已达到上限。",
	},
	CanNotDeleteAdmin: {
		english:           "The administrator account cannot be deleted.",
		simplifiedChinese: "不能删除管理员账号。",
	},
	CanNotResetOwnPassword: {
		english:           "You cannot reset your own password here.",
		simplifiedChinese: "不能在此处重置自己的密码。",
	},
	UserIsAdminAlready: {
		english:           "The selected user is already an administrator, or their own role cannot be changed.",
		simplifiedChinese: "所选用户已是管理员，或不能修改自己的管理员角色。",
	},
	MusicPlayRecordNotExisted: {
		english:           "This play record no longer exists.",
		simplifiedChinese: "该播放记录不存在或已被删除。",
	},
	CanNotInviteMusicbillOwner: {
		english:           "The playlist owner cannot be invited as a collaborator.",
		simplifiedChinese: "不能邀请乐单所有者成为协作者。",
	},
	RepeatedSharedMusicbillInvitation: {
		english:           "This user has already been invited to the playlist.",
		simplifiedChinese: "已邀请该用户共享乐单。",
	},
	NoPermissionToDeleteMusicbillSharedUser: {
		english:           "You do not have permission to remove this playlist collaborator.",
		simplifiedChinese: "你没有权限移除该乐单协作者。",
	},
	SharedMusicbillInvitationNotExisted: {
		english:           "This playlist invitation no longer exists.",
		simplifiedChinese: "该乐单邀请不存在或已失效。",
	},
	NotMusicbillOwner: {
		english:           "Only the playlist owner can perform this action.",
		simplifiedChinese: "只有乐单所有者可以执行此操作。",
	},
	TargetUserNotAcceptedSharedUser: {
		english:           "The selected user must accept the playlist invitation first.",
		simplifiedChinese: "所选用户需要先接受乐单邀请。",
	},
	WrongUsernameOrPassword: {
		english:           "The username or password is incorrect.",
		simplifiedChinese: "用户名或密码不正确。",
	},
	LackOf2FAToken: {
		english:           "Please enter the two-factor authentication code.",
		simplifiedChinese: "请输入两步验证代码。",
	},
	Wrong2FAToken: {
		english:           "The two-factor authentication code is incorrect.",
		simplifiedChinese: "两步验证代码不正确。",
	},
	TwoFAEnabledAlready: {
		english:           "Two-factor authentication is already enabled.",
		simplifiedChinese: "两步验证已启用。",
	},
	Need2FA: {
		english:           "Two-factor authentication is required to continue.",
		simplifiedChinese: "需要完成两步验证才能继续。",
	},
	NoNeedTo2FA: {
		english:           "Two-factor authentication is not required for this account.",
		simplifiedChinese: "该账号无需两步验证。",
	},
	LoginTooFrequent: {
		english:           "There have been too many sign-in attempts. Please try again later.",
		simplifiedChinese: "登录尝试过于频繁，请稍后重试。",
	},
	LoginWith2FATooFrequent: {
		english:           "There have been too many two-factor authentication attempts. Please try again later.",
		simplifiedChinese: "两步验证尝试过于频繁，请稍后重试。",
	},
	InstrumentalHasNoLyric: {
		english:           "Instrumental music cannot have lyrics.",
		simplifiedChinese: "纯音乐不能添加歌词。",
	},
	InstrumentalHasNoLyricist: {
		english:           "Instrumental music cannot have a lyricist.",
		simplifiedChinese: "纯音乐不能设置作词人。",
	},
	PartialUploadNotExisted: {
		english:           "This upload has expired. Please start the upload again.",
		simplifiedChinese: "本次上传已失效，请重新上传。",
	},
	PartialUploadOwnerMismatch: {
		english:           "This upload belongs to another user. Please start a new upload.",
		simplifiedChinese: "本次上传属于其他用户，请重新上传。",
	},
	PartialUploadRangeInvalid: {
		english:           "The upload progress is out of sync. Please try the upload again.",
		simplifiedChinese: "上传进度不同步，请重试。",
	},
	PartialUploadHashMismatch: {
		english:           "The uploaded file could not be verified. Please upload it again.",
		simplifiedChinese: "上传文件校验失败，请重新上传。",
	},
	DiskSpaceInsufficient: {
		english:           "The server does not have enough storage space.",
		simplifiedChinese: "服务器存储空间不足。",
	},
	RepeatedFollowedArtist: {
		english:           "This artist is already followed in the playlist.",
		simplifiedChinese: "该乐单已关注此艺人。",
	},
}

var fallbackMessages = localizedMessage{
	english:           "The request could not be completed. Please try again.",
	simplifiedChinese: "请求未能完成，请重试。",
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
	if strings.EqualFold(clientLanguage, LanguageSimplifiedChinese) {
		return message.simplifiedChinese
	}
	return message.english
}
