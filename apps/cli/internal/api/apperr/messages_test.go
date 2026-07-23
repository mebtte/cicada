package apperr

import "testing"

func TestEveryErrorCodeHasFriendlyMessages(t *testing.T) {
	errorCodes := []string{
		ServerError,
		WrongParameter,
		WrongCaptcha,
		NotAuthorized,
		NotAuthorizedForAdmin,
		UsernameAlreadyRegistered,
		MusicbillNotExisted,
		MusicNotExisted,
		MusicAlreadyExistedInMusicbill,
		MusicNotExistedInMusicbill,
		AssetOversize,
		WrongAssetType,
		AssetNotExisted,
		ArtistNotExisted,
		ArtistAlreadyExisted,
		ArtistHasMusicCanNotBeDeleted,
		NoNeedToUpdate,
		AliasOverMaxLength,
		RepeatedAlias,
		NicknameHasUsedByOthers,
		UserNotExisted,
		MusicForkedByOtherCanNotBeDeleted,
		CanNotCollectMusicbillRepeatly,
		MusicbillNotCollected,
		OverUserMusicbillMaxAmount,
		CanNotDeleteAdmin,
		CanNotResetOwnPassword,
		UserIsAdminAlready,
		MusicPlayRecordNotExisted,
		CanNotInviteMusicbillOwner,
		RepeatedSharedMusicbillInvitation,
		NoPermissionToDeleteMusicbillSharedUser,
		SharedMusicbillInvitationNotExisted,
		NotMusicbillOwner,
		TargetUserNotAcceptedSharedUser,
		WrongUsernameOrPassword,
		LackOf2FAToken,
		Wrong2FAToken,
		TwoFAEnabledAlready,
		Need2FA,
		NoNeedTo2FA,
		LoginTooFrequent,
		LoginWith2FATooFrequent,
		InstrumentalHasNoLyric,
		InstrumentalHasNoLyricist,
		PartialUploadNotExisted,
		PartialUploadOwnerMismatch,
		PartialUploadRangeInvalid,
		PartialUploadHashMismatch,
		DiskSpaceInsufficient,
		RepeatedFollowedArtist,
	}

	for _, code := range errorCodes {
		t.Run(code, func(t *testing.T) {
			message, ok := localizedMessages[code]
			if !ok {
				t.Fatal("missing message mapping")
			}
			if message.english == "" || message.english == code {
				t.Fatalf("invalid English message %q", message.english)
			}
			if message.simplifiedChinese == "" || message.simplifiedChinese == code {
				t.Fatalf("invalid Simplified Chinese message %q", message.simplifiedChinese)
			}
		})
	}

	if len(localizedMessages) != len(errorCodes) {
		t.Fatalf("message map has %d codes, test covers %d", len(localizedMessages), len(errorCodes))
	}
}

func TestMessageLanguageAndFallbackRules(t *testing.T) {
	if got := Message(Success, LanguageSimplifiedChinese); got != "" {
		t.Fatalf("success message must be empty, got %q", got)
	}
	if got := Message(WrongCaptcha, "zh-hans"); got != localizedMessages[WrongCaptcha].simplifiedChinese {
		t.Fatalf("expected Simplified Chinese message, got %q", got)
	}
	if got := Message(WrongCaptcha, "zh-CN"); got != localizedMessages[WrongCaptcha].english {
		t.Fatalf("unsupported language must use English, got %q", got)
	}
	if got := Message("unknown_code", LanguageSimplifiedChinese); got != fallbackMessages.simplifiedChinese {
		t.Fatalf("unknown code must use friendly fallback, got %q", got)
	}
}
