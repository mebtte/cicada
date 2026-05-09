package apidoc

import (
	"cicada/internal/config"
	"cicada/internal/version"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type operation struct {
	Method         string
	Path           string
	Summary        string
	Description    string
	Tags           []string
	Auth           bool
	Admin          bool
	Parameters     []map[string]any
	RequestBody    map[string]any
	SuccessSchema  map[string]any
	SuccessExample any
	ErrorCodes     []string
	Responses      map[string]any
}

// Register mounts the OpenAPI spec and the built-in documentation page.
func Register(r *gin.Engine) {
	r.GET("/api_reference", servePage)
	r.GET("/api_reference/", servePage)
	r.GET("/api_reference/openapi.json", func(c *gin.Context) {
		c.JSON(http.StatusOK, Spec())
	})
}

// Spec returns the OpenAPI 3.0 document for the current HTTP API.
func Spec() map[string]any {
	appVersion := version.Get()
	paths := map[string]any{}
	for _, op := range operations() {
		addOperation(paths, op)
	}

	return map[string]any{
		"openapi": "3.0.3",
		"info": map[string]any{
			"title":   "Cicada API",
			"version": appVersion,
			"description": "Cicada server API documentation.\n\n" +
				"Except for static asset downloads, business endpoints usually return HTTP 200 for both success and failure.\n" +
				"Use the `code` field in the response body to determine success: `success` means success; any other value is a business error code.",
		},
		"tags": []map[string]any{
			{"name": "Docs", "description": "Documentation and spec output"},
			{"name": "Asset", "description": "Static asset serving and upload"},
			{"name": "Base", "description": "Base endpoints without authentication"},
			{"name": "Profile", "description": "Current user profile and security settings"},
			{"name": "User", "description": "Public user information"},
			{"name": "Music", "description": "Music and discovery data"},
			{"name": "Singer", "description": "Singer endpoints"},
			{"name": "Lyric", "description": "Lyric endpoints"},
			{"name": "PlayRecord", "description": "Play record endpoints"},
			{"name": "Musicbill", "description": "Musicbill and shared musicbill endpoints"},
			{"name": "Admin", "description": "Admin endpoints"},
		},
		"x-cicada-authentication": authenticationGuide(),
		"paths":                   paths,
		"components": map[string]any{
			"securitySchemes": map[string]any{
				"CicadaToken": map[string]any{
					"type":        "apiKey",
					"in":          "header",
					"name":        "x-cicada-token",
					"description": "Business auth token. Obtain it from `/base/login` or `/base/login_with_2fa`, then send it in the `x-cicada-token` header. Unless stated otherwise, `/api` and `/form` endpoints require this header.",
				},
			},
		},
	}
}

func authenticationGuide() map[string]any {
	return map[string]any{
		"title":   "Authentication",
		"summary": "Cicada uses a JWT-based business token. The token is returned by the login endpoints and is usually sent in the `x-cicada-token` request header.",
		"header": map[string]any{
			"name":        "x-cicada-token",
			"type":        "string",
			"description": "JWT auth token used by authenticated endpoints.",
		},
		"tokenEndpoints": []any{
			map[string]any{
				"method":      "POST",
				"path":        "/base/login",
				"description": "Returns a token after username, password, and captcha verification.",
			},
			map[string]any{
				"method":      "POST",
				"path":        "/base/login_with_2fa",
				"description": "Returns a token after username, password, and TOTP verification.",
			},
		},
		"rules": []any{
			"Send the token in the `x-cicada-token` header for authenticated `/api` and `/form` endpoints.",
			"Admin endpoints require a valid token and a user with `admin = 1`.",
			"When the token is missing, invalid, expired, or revoked, the API returns `not_authorized`.",
		},
		"exceptions": []any{
			map[string]any{
				"path":        "/base/music_play_record",
				"description": "This endpoint accepts the token in the JSON request body field `token` because it is used with `sendBeacon`.",
			},
			map[string]any{
				"path":        "/asset/{assetType}/{filename}",
				"description": "Static asset download is public and does not require authentication.",
			},
		},
	}
}

func operations() []operation {
	return []operation{
		{
			Method:      "GET",
			Path:        "/api_reference/openapi.json",
			Summary:     "Get OpenAPI spec",
			Description: "Return the OpenAPI 3.0 JSON document for the current service.",
			Tags:        []string{"Docs"},
			Responses: map[string]any{
				"200": map[string]any{
					"description": "OpenAPI 3.0 JSON document",
					"content": map[string]any{
						"application/json": map[string]any{
							"schema": map[string]any{
								"type": "object",
							},
						},
					},
				},
			},
		},
		{
			Method:      "GET",
			Path:        "/asset/{assetType}/{filename}",
			Summary:     "Get static asset",
			Description: "Return an image or audio asset. Image assets support square resizing via the `size` query parameter. Music assets support transcoding via the `codec` and `bitrate` query parameters.",
			Tags:        []string{"Asset"},
			Parameters: []map[string]any{
				pathParam("assetType", "Asset type. See enum values.", strEnumSchema([]string{
					string(config.AssetTypeUserAvatar),
					string(config.AssetTypeMusicbillCover),
					string(config.AssetTypeSingerPhoto),
					string(config.AssetTypeMusicCover),
					string(config.AssetTypeMusic),
				}, string(config.AssetTypeMusicCover))),
				pathParam("filename", "Asset filename.", strSchema("", "a1b2c3d4.jpg")),
				queryParam("size", "Resize edge length. Only applies to image assets. Max 2048.", false, intSchema("", 256)),
				queryParam("codec", "Music transcode codec. Supported combinations are codec=aac&bitrate=192 and codec=flac.", false, strEnumSchema([]string{"aac", "flac"}, "aac")),
				queryParam("bitrate", "Music transcode bitrate. Only 192 is currently accepted, and only with codec=aac. If the source bitrate is lower, the transcode output is capped at the source bitrate.", false, strEnumSchema([]string{"192"}, "192")),
			},
			Responses: map[string]any{
				"200": map[string]any{
					"description": "Asset file content",
					"content": map[string]any{
						"image/jpeg":               binaryMedia(),
						"audio/mpeg":               binaryMedia(),
						"audio/flac":               binaryMedia(),
						"audio/mp4":                binaryMedia(),
						"application/octet-stream": binaryMedia(),
					},
				},
				"400": map[string]any{"description": "Invalid asset query parameters"},
				"404": map[string]any{"description": "Asset not found"},
				"500": map[string]any{"description": "Image processing failed"},
			},
		},
		{
			Method:      "POST",
			Path:        "/form/asset",
			Summary:     "Upload asset",
			Description: "Upload an image or audio asset and return the asset ID and public path. Music uploads are accepted when ffprobe can detect an audio stream.",
			Tags:        []string{"Asset"},
			Auth:        true,
			RequestBody: multipartRequestBody(
				objSchema(
					[]string{"assetType", "asset"},
					map[string]any{
						"assetType": strEnumSchema([]string{
							string(config.AssetTypeUserAvatar),
							string(config.AssetTypeMusicbillCover),
							string(config.AssetTypeSingerPhoto),
							string(config.AssetTypeMusicCover),
							string(config.AssetTypeMusic),
						}, string(config.AssetTypeMusicCover)),
						"asset": map[string]any{
							"type":        "string",
							"format":      "binary",
							"description": "Uploaded file content.",
						},
					},
				),
				map[string]any{
					"assetType": string(config.AssetTypeMusicCover),
				},
			),
			SuccessSchema: uploadAssetSchema(),
			SuccessExample: map[string]any{
				"id":   "a1b2c3d4.jpg",
				"path": "/asset/music_cover/a1b2c3d4.jpg",
			},
			ErrorCodes: []string{"wrong_parameter", "asset_oversize", "wrong_asset_type", "server_error"},
		},
		{
			Method:         "GET",
			Path:           "/base/metadata",
			Summary:        "Get service metadata",
			Description:    "Return the current node hostname and version.",
			Tags:           []string{"Base"},
			SuccessSchema:  metadataSchema(),
			SuccessExample: map[string]any{"hostname": "cicada.local", "version": version.Get()},
		},
		{
			Method:      "GET",
			Path:        "/base/captcha",
			Summary:     "Get captcha",
			Description: "Return the captcha ID and SVG payload.",
			Tags:        []string{"Base"},
			SuccessSchema: objSchema(
				[]string{"id", "svg"},
				map[string]any{
					"id":  strSchema("Captcha ID.", "9c4a0f42"),
					"svg": strSchema("Captcha SVG content.", "<svg>...</svg>"),
				},
			),
			SuccessExample: map[string]any{"id": "9c4a0f42", "svg": "<svg>...</svg>"},
			ErrorCodes:     []string{"server_error"},
		},
		{
			Method:      "POST",
			Path:        "/base/login",
			Summary:     "Login with password",
			Description: "Login with username and password. Returns `need_2fa` when the user has 2FA enabled.",
			Tags:        []string{"Base"},
			RequestBody: jsonRequestBody(loginRequestSchema(), map[string]any{
				"username":     "cicada",
				"password":     "cicada",
				"captchaId":    "9c4a0f42",
				"captchaValue": "5k7n",
			}),
			SuccessSchema:  strSchema("JWT auth token.", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"),
			SuccessExample: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
			ErrorCodes:     []string{"wrong_parameter", "wrong_captcha", "wrong_username_or_password", "need_2fa", "login_too_frequent", "server_error"},
		},
		{
			Method:      "POST",
			Path:        "/base/login_with_2fa",
			Summary:     "Login with 2FA",
			Description: "Login with username, password, and a 2FA token.",
			Tags:        []string{"Base"},
			RequestBody: jsonRequestBody(login2FARequestSchema(), map[string]any{
				"username":   "cicada",
				"password":   "cicada",
				"twoFAToken": "123456",
			}),
			SuccessSchema:  strSchema("JWT auth token.", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"),
			SuccessExample: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
			ErrorCodes:     []string{"wrong_parameter", "wrong_username_or_password", "wrong_2fa_token", "no_need_to_2fa", "login_with_2fa_too_frequent", "server_error"},
		},
		{
			Method:      "POST",
			Path:        "/base/music_play_record",
			Summary:     "Report play record via Beacon",
			Description: "Used by the frontend `sendBeacon` flow to report play progress. The token is sent in the request body instead of a request header.",
			Tags:        []string{"Base"},
			RequestBody: jsonRequestBody(
				objSchema(
					[]string{"token", "musicId"},
					map[string]any{
						"token":   strSchema("JWT auth token.", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"),
						"musicId": strSchema("Music ID.", "music-1"),
						"percent": numSchema("Playback completion ratio, from 0 to 1.", 0.82),
					},
				),
				map[string]any{"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9", "musicId": "music-1", "percent": 0.82},
			),
			SuccessSchema:  nil,
			SuccessExample: nil,
			ErrorCodes:     []string{"wrong_parameter", "not_authorized", "music_not_existed"},
		},
		{
			Method:         "GET",
			Path:           "/api/profile",
			Summary:        "Get current profile",
			Description:    "Return the full profile and quota settings for the current signed-in user.",
			Tags:           []string{"Profile"},
			Auth:           true,
			SuccessSchema:  profileSchema(),
			SuccessExample: profileExample(),
			ErrorCodes:     []string{"not_authorized"},
		},
		{
			Method:      "PUT",
			Path:        "/api/profile",
			Summary:     "Update current profile",
			Description: "Update password, avatar, nickname, or musicbill order using the key/value pattern.",
			Tags:        []string{"Profile"},
			Auth:        true,
			RequestBody: jsonRequestBody(updateProfileRequestSchema(), map[string]any{
				"key":   "nickname",
				"value": "Cicada",
			}),
			SuccessSchema:  nil,
			SuccessExample: nil,
			ErrorCodes:     []string{"wrong_parameter", "asset_not_existed", "nickname_has_used_by_others", "musicbill_not_existed", "no_need_to_update", "not_authorized"},
		},
		{
			Method:      "GET",
			Path:        "/api/user",
			Summary:     "Get public user info",
			Description: "Return the public user profile, created music, and public musicbills by `uid`.",
			Tags:        []string{"User"},
			Auth:        true,
			Parameters: []map[string]any{
				queryParam("uid", "User ID.", true, strSchema("", "1")),
			},
			SuccessSchema:  publicUserSchema(),
			SuccessExample: publicUserExample(),
			ErrorCodes:     []string{"wrong_parameter", "user_not_existed", "not_authorized"},
		},
		{
			Method:         "POST",
			Path:           "/api/2fa",
			Summary:        "Create 2FA secret",
			Description:    "Generate a new 2FA secret and otpauth URL for the current user.",
			Tags:           []string{"Profile"},
			Auth:           true,
			SuccessSchema:  twoFASetupSchema(),
			SuccessExample: map[string]any{"secret": "JBSWY3DPEHPK3PXP", "url": "otpauth://totp/Cicada:cicada?secret=JBSWY3DPEHPK3PXP&issuer=Cicada"},
			ErrorCodes:     []string{"two_fa_enabled_already", "server_error", "not_authorized"},
		},
		{
			Method:      "PUT",
			Path:        "/api/2fa",
			Summary:     "Enable 2FA",
			Description: "Activate the generated 2FA secret for the current user using a TOTP code.",
			Tags:        []string{"Profile"},
			Auth:        true,
			RequestBody: jsonRequestBody(
				objSchema([]string{"token"}, map[string]any{
					"token": strSchema("Current TOTP token.", "123456"),
				}),
				map[string]any{"token": "123456"},
			),
			SuccessSchema:  nil,
			SuccessExample: nil,
			ErrorCodes:     []string{"wrong_parameter", "two_fa_enabled_already", "wrong_2fa_token", "not_authorized"},
		},
		{
			Method:      "DELETE",
			Path:        "/api/2fa",
			Summary:     "Disable 2FA",
			Description: "Disable 2FA for the current user using a TOTP code.",
			Tags:        []string{"Profile"},
			Auth:        true,
			RequestBody: jsonRequestBody(
				objSchema([]string{"token"}, map[string]any{
					"token": strSchema("Current TOTP token.", "123456"),
				}),
				map[string]any{"token": "123456"},
			),
			SuccessSchema:  nil,
			SuccessExample: nil,
			ErrorCodes:     []string{"wrong_parameter", "wrong_2fa_token", "no_need_to_2fa", "not_authorized"},
		},
		{
			Method:      "GET",
			Path:        "/api/music",
			Summary:     "Get music details",
			Description: "Return music metadata, singers, fork relations, creator information, and musicbill usage count.",
			Tags:        []string{"Music"},
			Auth:        true,
			Parameters: []map[string]any{
				queryParam("id", "Music ID.", true, strSchema("", "music-1")),
			},
			SuccessSchema:  musicDetailSchema(),
			SuccessExample: musicDetailExample(),
			ErrorCodes:     []string{"wrong_parameter", "music_not_existed", "not_authorized"},
		},
		{
			Method:      "POST",
			Path:        "/api/music",
			Summary:     "Create music",
			Description: "Create a music record and link singers. `singerIds` is a comma-separated string.",
			Tags:        []string{"Music"},
			Auth:        true,
			RequestBody: jsonRequestBody(createMusicRequestSchema(), map[string]any{
				"name":      "Nightingale",
				"singerIds": "singer-1,singer-2",
				"type":      1,
				"asset":     "track.mp3",
			}),
			SuccessSchema:  strSchema("Created music ID.", "music-1"),
			SuccessExample: "music-1",
			ErrorCodes:     []string{"wrong_parameter", "asset_not_existed", "singer_not_existed", "over_create_music_times_per_day", "server_error", "not_authorized"},
		},
		{
			Method:      "PUT",
			Path:        "/api/music",
			Summary:     "Update music",
			Description: "Update music name, aliases, lyrics, cover, file, singers, type, year, or fork source using the key/value pattern.",
			Tags:        []string{"Music"},
			Auth:        true,
			RequestBody: jsonRequestBody(updateMusicRequestSchema(), map[string]any{
				"id":    "music-1",
				"key":   "aliases",
				"value": []string{"Night Song", "Nocturne"},
			}),
			SuccessSchema:  nil,
			SuccessExample: nil,
			ErrorCodes:     []string{"wrong_parameter", "music_not_existed", "instrumental_has_no_lyric", "asset_not_existed", "singer_not_existed", "server_error", "not_authorized"},
		},
		{
			Method:      "DELETE",
			Path:        "/api/music",
			Summary:     "Delete music",
			Description: "Delete a music item. Requires the music ID and captcha fields.",
			Tags:        []string{"Music"},
			Auth:        true,
			Parameters: []map[string]any{
				queryParam("id", "Music ID.", true, strSchema("", "music-1")),
				queryParam("captchaId", "Captcha ID.", true, strSchema("", "9c4a0f42")),
				queryParam("captchaValue", "Captcha value.", true, strSchema("", "5k7n")),
			},
			SuccessSchema:  nil,
			SuccessExample: nil,
			ErrorCodes:     []string{"wrong_parameter", "wrong_captcha", "music_not_existed", "music_forked_by_other_can_not_be_deleted", "not_authorized"},
		},
		{
			Method:      "GET",
			Path:        "/api/music/search",
			Summary:     "Search music",
			Description: "Search all music by keyword. Returns random music when the keyword is empty.",
			Tags:        []string{"Music"},
			Auth:        true,
			Parameters: paginationParams(
				queryParam("keyword", "Name, alias, or singer keyword.", false, strSchema("", "night")),
			),
			SuccessSchema:  musicListPageSchema("musicList"),
			SuccessExample: musicListPageExample("musicList"),
			ErrorCodes:     []string{"wrong_parameter", "server_error", "not_authorized"},
		},
		{
			Method:      "GET",
			Path:        "/api/music/search_by_lyric",
			Summary:     "Search music by lyric",
			Description: "Search music by lyric content.",
			Tags:        []string{"Music"},
			Auth:        true,
			Parameters: paginationParams(
				queryParam("keyword", "Lyric keyword.", true, strSchema("", "starlight")),
			),
			SuccessSchema:  lyricSearchPageSchema(),
			SuccessExample: lyricSearchPageExample(),
			ErrorCodes:     []string{"wrong_parameter", "server_error", "not_authorized"},
		},
		{
			Method:      "GET",
			Path:        "/api/singer",
			Summary:     "Get singer details",
			Description: "Return singer metadata, photo list, and related music. The first photo (lowest position) is treated as the avatar by clients.",
			Tags:        []string{"Singer"},
			Auth:        true,
			Parameters: []map[string]any{
				queryParam("id", "Singer ID.", true, strSchema("", "singer-1")),
			},
			SuccessSchema:  singerDetailSchema(),
			SuccessExample: singerDetailExample(),
			ErrorCodes:     []string{"wrong_parameter", "singer_not_existed", "not_authorized"},
		},
		{
			Method:      "GET",
			Path:        "/api/singer/search",
			Summary:     "Search singers",
			Description: "Search singers by name or alias. The photo list is sorted by position; clients can use the first photo as the singer avatar.",
			Tags:        []string{"Singer"},
			Auth:        true,
			Parameters: paginationParams(
				queryParam("keyword", "Singer keyword.", false, strSchema("", "aur")),
			),
			SuccessSchema: objSchema(
				[]string{"total", "singerList"},
				map[string]any{
					"total":      intSchema("Total count.", 1),
					"singerList": arraySchema(singerWithPhotosSchema()),
				},
			),
			SuccessExample: map[string]any{
				"total": 1,
				"singerList": []any{
					map[string]any{
						"id":      "singer-1",
						"name":    "Aurora",
						"aliases": []string{"AUR"},
						"photos": []any{
							map[string]any{"id": "photo-1", "asset": "/asset/singer_photo/photo.jpg", "description": "Live in Tokyo, 2024"},
						},
					},
				},
			},
			ErrorCodes: []string{"wrong_parameter", "server_error", "not_authorized"},
		},
		{
			Method:      "GET",
			Path:        "/api/lyric_list",
			Summary:     "Get lyric list",
			Description: "Return the lyric versions for a music item.",
			Tags:        []string{"Lyric"},
			Auth:        true,
			Parameters: []map[string]any{
				queryParam("musicId", "Music ID.", true, strSchema("", "music-1")),
			},
			SuccessSchema: objArraySchema(map[string]any{
				"id":  intSchema("Lyric record ID.", 1),
				"lrc": strSchema("LRC content.", "[00:00.00]lyrics"),
			}),
			SuccessExample: []any{
				map[string]any{"id": 1, "lrc": "[00:00.00]lyrics"},
			},
			ErrorCodes: []string{"wrong_parameter", "music_not_existed", "instrumental_has_no_lyric", "not_authorized"},
		},
		{
			Method:      "GET",
			Path:        "/api/music_play_record_list",
			Summary:     "Get play records",
			Description: "Return paginated play records for the current user.",
			Tags:        []string{"PlayRecord"},
			Auth:        true,
			Parameters:  paginationParams(),
			SuccessSchema: objSchema(
				[]string{"total", "musicPlayRecordList"},
				map[string]any{
					"total":               intSchema("Total count.", 1),
					"musicPlayRecordList": arraySchema(playRecordSchema()),
				},
			),
			SuccessExample: map[string]any{
				"total": 1,
				"musicPlayRecordList": []any{
					map[string]any{
						"recordId":  1,
						"percent":   0.82,
						"timestamp": 1710000000000,
						"id":        "music-1",
						"name":      "Nightingale",
						"aliases":   []string{"Night Song"},
						"singers":   []any{map[string]any{"id": "singer-1", "name": "Aurora"}},
					},
				},
			},
			ErrorCodes: []string{"wrong_parameter", "server_error", "not_authorized"},
		},
		{
			Method:      "DELETE",
			Path:        "/api/music_play_record",
			Summary:     "Delete play record",
			Description: "Delete the specified play record.",
			Tags:        []string{"PlayRecord"},
			Auth:        true,
			Parameters: []map[string]any{
				queryParam("id", "Play record ID.", true, intSchema("", 1)),
			},
			SuccessSchema:  nil,
			SuccessExample: nil,
			ErrorCodes:     []string{"wrong_parameter", "music_play_record_not_existed", "not_authorized"},
		},
		{
			Method:         "GET",
			Path:           "/api/musicbill_list",
			Summary:        "Get my musicbill list",
			Description:    "Return musicbills owned by the current user or shared with the current user and already accepted.",
			Tags:           []string{"Musicbill"},
			Auth:           true,
			SuccessSchema:  arraySchema(musicbillSummarySchema()),
			SuccessExample: []any{musicbillSummaryExample()},
			ErrorCodes:     []string{"server_error", "not_authorized"},
		},
		{
			Method:      "GET",
			Path:        "/api/musicbill",
			Summary:     "Get musicbill details",
			Description: "Return musicbill metadata, shared users, and music list.",
			Tags:        []string{"Musicbill"},
			Auth:        true,
			Parameters: []map[string]any{
				queryParam("id", "Musicbill ID.", true, strSchema("", "musicbill-1")),
			},
			SuccessSchema:  musicbillDetailSchema(),
			SuccessExample: musicbillDetailExample(),
			ErrorCodes:     []string{"wrong_parameter", "musicbill_not_existed", "not_authorized"},
		},
		{
			Method:      "POST",
			Path:        "/api/musicbill",
			Summary:     "Create musicbill",
			Description: "Create a new musicbill for the current user.",
			Tags:        []string{"Musicbill"},
			Auth:        true,
			RequestBody: jsonRequestBody(
				objSchema([]string{"name"}, map[string]any{
					"name": strSchema("Musicbill name.", "Late Night"),
				}),
				map[string]any{"name": "Late Night"},
			),
			SuccessSchema:  strSchema("Created musicbill ID.", "musicbill-1"),
			SuccessExample: "musicbill-1",
			ErrorCodes:     []string{"wrong_parameter", "over_user_musicbill_max_amount", "server_error", "not_authorized"},
		},
		{
			Method:      "PUT",
			Path:        "/api/musicbill",
			Summary:     "Update musicbill",
			Description: "Update musicbill name, cover, or public status using the key/value pattern.",
			Tags:        []string{"Musicbill"},
			Auth:        true,
			RequestBody: jsonRequestBody(updateMusicbillRequestSchema(), map[string]any{
				"id":    "musicbill-1",
				"key":   "public",
				"value": true,
			}),
			SuccessSchema:  nil,
			SuccessExample: nil,
			ErrorCodes:     []string{"wrong_parameter", "musicbill_not_existed", "asset_not_existed", "no_need_to_update", "not_authorized"},
		},
		{
			Method:      "DELETE",
			Path:        "/api/musicbill",
			Summary:     "Delete musicbill",
			Description: "Delete a musicbill owned by the current user.",
			Tags:        []string{"Musicbill"},
			Auth:        true,
			Parameters: []map[string]any{
				queryParam("id", "Musicbill ID.", true, strSchema("", "musicbill-1")),
				queryParam("captchaId", "Captcha ID.", true, strSchema("", "9c4a0f42")),
				queryParam("captchaValue", "Captcha value.", true, strSchema("", "5k7n")),
			},
			SuccessSchema:  nil,
			SuccessExample: nil,
			ErrorCodes:     []string{"wrong_parameter", "wrong_captcha", "musicbill_not_existed", "not_authorized"},
		},
		{
			Method:      "POST",
			Path:        "/api/musicbill_music",
			Summary:     "Add music to musicbill",
			Description: "Add a music item to a musicbill.",
			Tags:        []string{"Musicbill"},
			Auth:        true,
			RequestBody: jsonRequestBody(
				objSchema(
					[]string{"musicbillId", "musicId"},
					map[string]any{
						"musicbillId": strSchema("Musicbill ID.", "musicbill-1"),
						"musicId":     strSchema("Music ID.", "music-1"),
					},
				),
				map[string]any{"musicbillId": "musicbill-1", "musicId": "music-1"},
			),
			SuccessSchema:  nil,
			SuccessExample: nil,
			ErrorCodes:     []string{"wrong_parameter", "musicbill_not_existed", "music_not_existed", "music_already_existed_in_musicbill", "not_authorized"},
		},
		{
			Method:      "DELETE",
			Path:        "/api/musicbill_music",
			Summary:     "Remove music from musicbill",
			Description: "Remove the specified music item from a musicbill.",
			Tags:        []string{"Musicbill"},
			Auth:        true,
			Parameters: []map[string]any{
				queryParam("musicbillId", "Musicbill ID.", true, strSchema("", "musicbill-1")),
				queryParam("musicId", "Music ID.", true, strSchema("", "music-1")),
			},
			SuccessSchema:  nil,
			SuccessExample: nil,
			ErrorCodes:     []string{"wrong_parameter", "musicbill_not_existed", "music_not_existed_in_musicbill", "not_authorized"},
		},
		{
			Method:      "POST",
			Path:        "/api/musicbill/shared_user",
			Summary:     "Invite shared musicbill user",
			Description: "Invite another user to a shared musicbill by username.",
			Tags:        []string{"Musicbill"},
			Auth:        true,
			RequestBody: jsonRequestBody(
				objSchema(
					[]string{"musicbillId", "username"},
					map[string]any{
						"musicbillId": strSchema("Musicbill ID.", "musicbill-1"),
						"username":    strSchema("Invited user username.", "alice"),
					},
				),
				map[string]any{"musicbillId": "musicbill-1", "username": "alice"},
			),
			SuccessSchema:  nil,
			SuccessExample: nil,
			ErrorCodes:     []string{"wrong_parameter", "musicbill_not_existed", "user_not_existed", "can_not_invite_musicbill_owner", "repeated_shared_musicbill_invitation", "not_authorized"},
		},
		{
			Method:      "DELETE",
			Path:        "/api/musicbill/shared_user",
			Summary:     "Remove shared musicbill user",
			Description: "The owner can remove any shared user. A shared user can only remove themselves.",
			Tags:        []string{"Musicbill"},
			Auth:        true,
			Parameters: []map[string]any{
				queryParam("musicbillId", "Musicbill ID.", true, strSchema("", "musicbill-1")),
				queryParam("userId", "User ID.", true, strSchema("", "2")),
			},
			SuccessSchema:  nil,
			SuccessExample: nil,
			ErrorCodes:     []string{"wrong_parameter", "musicbill_not_existed", "no_permission_to_delete_musicbill_shared_user", "not_authorized"},
		},
		{
			Method:         "GET",
			Path:           "/api/shared_musicbill_invitation_list",
			Summary:        "Get shared musicbill invitations",
			Description:    "Return pending shared musicbill invitations for the current user.",
			Tags:           []string{"Musicbill"},
			Auth:           true,
			SuccessSchema:  arraySchema(invitationSchema()),
			SuccessExample: []any{invitationExample()},
			ErrorCodes:     []string{"not_authorized"},
		},
		{
			Method:      "PUT",
			Path:        "/api/shared_musicbill_invitation",
			Summary:     "Accept shared musicbill invitation",
			Description: "Accept the specified shared musicbill invitation.",
			Tags:        []string{"Musicbill"},
			Auth:        true,
			RequestBody: jsonRequestBody(
				objSchema([]string{"id"}, map[string]any{
					"id": intSchema("Invitation record ID.", 1),
				}),
				map[string]any{"id": 1},
			),
			SuccessSchema:  nil,
			SuccessExample: nil,
			ErrorCodes:     []string{"wrong_parameter", "shared_musicbill_invitation_not_existed", "not_authorized"},
		},
		{
			Method:      "GET",
			Path:        "/api/public_musicbill",
			Summary:     "Get public musicbill details",
			Description: "Return public musicbill details and whether the current user has collected it.",
			Tags:        []string{"Musicbill"},
			Auth:        true,
			Parameters: []map[string]any{
				queryParam("id", "Musicbill ID.", true, strSchema("", "musicbill-1")),
			},
			SuccessSchema:  publicMusicbillDetailSchema(),
			SuccessExample: publicMusicbillDetailExample(),
			ErrorCodes:     []string{"wrong_parameter", "musicbill_not_existed", "not_authorized"},
		},
		{
			Method:      "GET",
			Path:        "/api/public_musicbill/search",
			Summary:     "Search public musicbills",
			Description: "Search public musicbills by keyword.",
			Tags:        []string{"Musicbill"},
			Auth:        true,
			Parameters: paginationParams(
				queryParam("keyword", "Musicbill keyword.", false, strSchema("", "night")),
			),
			SuccessSchema:  musicbillPageSchema("musicbillList"),
			SuccessExample: musicbillPageExample("musicbillList"),
			ErrorCodes:     []string{"wrong_parameter", "server_error", "not_authorized"},
		},
		{
			Method:      "POST",
			Path:        "/api/public_musicbill/collection",
			Summary:     "Collect public musicbill",
			Description: "Collect the specified public musicbill.",
			Tags:        []string{"Musicbill"},
			Auth:        true,
			RequestBody: jsonRequestBody(
				objSchema([]string{"id"}, map[string]any{
					"id": strSchema("Musicbill ID.", "musicbill-1"),
				}),
				map[string]any{"id": "musicbill-1"},
			),
			SuccessSchema:  nil,
			SuccessExample: nil,
			ErrorCodes:     []string{"wrong_parameter", "musicbill_not_existed", "can_not_collect_musicbill_repeatly", "not_authorized"},
		},
		{
			Method:      "DELETE",
			Path:        "/api/public_musicbill/collection",
			Summary:     "Uncollect public musicbill",
			Description: "Uncollect the specified public musicbill.",
			Tags:        []string{"Musicbill"},
			Auth:        true,
			Parameters: []map[string]any{
				queryParam("id", "Musicbill ID.", true, strSchema("", "musicbill-1")),
			},
			SuccessSchema:  nil,
			SuccessExample: nil,
			ErrorCodes:     []string{"wrong_parameter", "musicbill_not_collected", "not_authorized"},
		},
		{
			Method:      "GET",
			Path:        "/api/public_musicbill_collection_list",
			Summary:     "Get collected public musicbills",
			Description: "Return the public musicbills collected by the current user.",
			Tags:        []string{"Musicbill"},
			Auth:        true,
			Parameters: paginationParams(
				queryParam("keyword", "Musicbill keyword.", false, strSchema("", "night")),
			),
			SuccessSchema:  musicbillPageSchema("collectionList"),
			SuccessExample: musicbillPageExample("collectionList"),
			ErrorCodes:     []string{"wrong_parameter", "server_error", "not_authorized"},
		},
		{
			Method:         "GET",
			Path:           "/api/exploration",
			Summary:        "Get exploration data",
			Description:    "Return random recommendation data for music, singers, and public musicbills.",
			Tags:           []string{"Music"},
			Auth:           true,
			SuccessSchema:  explorationSchema(),
			SuccessExample: explorationExample(),
			ErrorCodes:     []string{"not_authorized"},
		},
		{
			Method:      "POST",
			Path:        "/api/admin/user",
			Summary:     "Admin create user",
			Description: "Create a regular user account.",
			Tags:        []string{"Admin"},
			Auth:        true,
			Admin:       true,
			RequestBody: jsonRequestBody(
				objSchema(
					[]string{"username", "password"},
					map[string]any{
						"username": strSchema("Username.", "alice"),
						"password": strSchema("Password.", "secret"),
						"remark":   strSchema("Remark.", "test account"),
					},
				),
				map[string]any{"username": "alice", "password": "secret", "remark": "test account"},
			),
			SuccessSchema:  nil,
			SuccessExample: nil,
			ErrorCodes:     []string{"wrong_parameter", "username_already_registered", "server_error", "not_authorized", "not_authorized_for_admin"},
		},
		{
			Method:      "PUT",
			Path:        "/api/admin/user",
			Summary:     "Admin update user settings",
			Description: "Update user remarks and quota settings using the key/value pattern.",
			Tags:        []string{"Admin"},
			Auth:        true,
			Admin:       true,
			RequestBody: jsonRequestBody(adminUpdateUserRequestSchema(), map[string]any{
				"id":    "10001",
				"key":   "remark",
				"value": "VIP user",
			}),
			SuccessSchema:  nil,
			SuccessExample: nil,
			ErrorCodes:     []string{"wrong_parameter", "user_not_existed", "not_authorized", "not_authorized_for_admin"},
		},
		{
			Method:      "PUT",
			Path:        "/api/admin/user_admin",
			Summary:     "Admin update admin flag",
			Description: "Set the `admin` flag for the specified user.",
			Tags:        []string{"Admin"},
			Auth:        true,
			Admin:       true,
			RequestBody: jsonRequestBody(
				objSchema(
					[]string{"id"},
					map[string]any{
						"id":    strSchema("User ID.", "10001"),
						"admin": intSchema("Admin flag, 0 or 1.", 1),
					},
				),
				map[string]any{"id": "10001", "admin": 1},
			),
			SuccessSchema:  nil,
			SuccessExample: nil,
			ErrorCodes:     []string{"wrong_parameter", "user_not_existed", "user_is_admin_already", "not_authorized", "not_authorized_for_admin"},
		},
		{
			Method:      "DELETE",
			Path:        "/api/admin/user",
			Summary:     "Admin delete user",
			Description: "Delete the specified non-admin user.",
			Tags:        []string{"Admin"},
			Auth:        true,
			Admin:       true,
			Parameters: []map[string]any{
				queryParam("id", "User ID.", true, strSchema("", "10001")),
			},
			SuccessSchema:  nil,
			SuccessExample: nil,
			ErrorCodes:     []string{"wrong_parameter", "user_not_existed", "can_not_delete_admin", "not_authorized", "not_authorized_for_admin"},
		},
		{
			Method:         "GET",
			Path:           "/api/admin/user_list",
			Summary:        "Admin get user list",
			Description:    "Return the full user list.",
			Tags:           []string{"Admin"},
			Auth:           true,
			Admin:          true,
			SuccessSchema:  arraySchema(adminUserSchema()),
			SuccessExample: []any{adminUserExample()},
			ErrorCodes:     []string{"server_error", "not_authorized", "not_authorized_for_admin"},
		},
		{
			Method:      "GET",
			Path:        "/api/admin/singer",
			Summary:     "Admin get singer",
			Description: "Return singer metadata and ordered photo list for admin editing.",
			Tags:        []string{"Admin"},
			Auth:        true,
			Admin:       true,
			Parameters: []map[string]any{
				queryParam("id", "Singer ID.", true, strSchema("", "singer-1")),
			},
			SuccessSchema:  adminSingerDetailSchema(),
			SuccessExample: adminSingerDetailExample(),
			ErrorCodes:     []string{"wrong_parameter", "singer_not_existed", "not_authorized", "not_authorized_for_admin"},
		},
		{
			Method:      "POST",
			Path:        "/api/admin/singer",
			Summary:     "Admin create singer",
			Description: "Create a new singer.",
			Tags:        []string{"Admin"},
			Auth:        true,
			Admin:       true,
			RequestBody: jsonRequestBody(
				objSchema([]string{"name"}, map[string]any{
					"name": strSchema("Singer name.", "Aurora"),
				}),
				map[string]any{"name": "Aurora"},
			),
			SuccessSchema:  strSchema("Created singer ID.", "singer-1"),
			SuccessExample: "singer-1",
			ErrorCodes:     []string{"wrong_parameter", "server_error", "not_authorized", "not_authorized_for_admin"},
		},
		{
			Method:      "PUT",
			Path:        "/api/admin/singer",
			Summary:     "Admin update singer",
			Description: "Update singer name or aliases using the key/value pattern. To change the avatar, manage photos via the `/api/admin/singer/photo` endpoints.",
			Tags:        []string{"Admin"},
			Auth:        true,
			Admin:       true,
			RequestBody: jsonRequestBody(updateSingerRequestSchema(), map[string]any{
				"id":    "singer-1",
				"key":   "name",
				"value": "Aurora",
			}),
			SuccessSchema:  nil,
			SuccessExample: nil,
			ErrorCodes:     []string{"wrong_parameter", "singer_not_existed", "not_authorized", "not_authorized_for_admin"},
		},
		{
			Method:      "POST",
			Path:        "/api/admin/singer/photo",
			Summary:     "Admin add singer photo",
			Description: "Append a photo to the end of the singer's photo list. The new photo's position is `max(position)+1`.",
			Tags:        []string{"Admin"},
			Auth:        true,
			Admin:       true,
			RequestBody: jsonRequestBody(
				objSchema(
					[]string{"singerId", "asset"},
					map[string]any{
						"singerId":    strSchema("Singer ID.", "singer-1"),
						"asset":       strSchema("Uploaded photo asset filename.", "photo.jpg"),
						"description": strSchema("Optional description, max 500 chars.", "Live in Tokyo, 2024"),
					},
				),
				map[string]any{"singerId": "singer-1", "asset": "photo.jpg", "description": ""},
			),
			SuccessSchema: objSchema([]string{"id"}, map[string]any{
				"id": strSchema("Photo ID.", "photo-1"),
			}),
			SuccessExample: map[string]any{"id": "photo-1"},
			ErrorCodes:     []string{"wrong_parameter", "singer_not_existed", "asset_not_existed", "not_authorized", "not_authorized_for_admin"},
		},
		{
			Method:      "PUT",
			Path:        "/api/admin/singer/photo",
			Summary:     "Admin update singer photo description",
			Description: "Update the description text of a singer photo. The asset and position are immutable; use the order endpoint to reorder.",
			Tags:        []string{"Admin"},
			Auth:        true,
			Admin:       true,
			RequestBody: jsonRequestBody(
				objSchema(
					[]string{"id", "description"},
					map[string]any{
						"id":          strSchema("Photo ID.", "photo-1"),
						"description": strSchema("New description, may be empty. Max 500 chars.", "Live in Tokyo, 2024"),
					},
				),
				map[string]any{"id": "photo-1", "description": "Live in Tokyo, 2024"},
			),
			SuccessSchema:  nil,
			SuccessExample: nil,
			ErrorCodes:     []string{"wrong_parameter", "singer_not_existed", "not_authorized", "not_authorized_for_admin"},
		},
		{
			Method:      "DELETE",
			Path:        "/api/admin/singer/photo",
			Summary:     "Admin delete singer photo",
			Description: "Delete a photo from a singer. Remaining photos keep their position values; gaps are allowed and only relative ordering matters.",
			Tags:        []string{"Admin"},
			Auth:        true,
			Admin:       true,
			RequestBody: jsonRequestBody(
				objSchema([]string{"id"}, map[string]any{
					"id": strSchema("Photo ID.", "photo-1"),
				}),
				map[string]any{"id": "photo-1"},
			),
			SuccessSchema:  nil,
			SuccessExample: nil,
			ErrorCodes:     []string{"wrong_parameter", "singer_not_existed", "not_authorized", "not_authorized_for_admin"},
		},
		{
			Method:      "PUT",
			Path:        "/api/admin/singer/photo/order",
			Summary:     "Admin reorder singer photos",
			Description: "Rewrite photo positions to match the order of `ids` (0..N-1). `ids` must contain exactly the singer's existing photo ids — the first id becomes the avatar.",
			Tags:        []string{"Admin"},
			Auth:        true,
			Admin:       true,
			RequestBody: jsonRequestBody(
				objSchema(
					[]string{"singerId", "ids"},
					map[string]any{
						"singerId": strSchema("Singer ID.", "singer-1"),
						"ids":      arraySchema(strSchema("Photo ID.", "photo-1")),
					},
				),
				map[string]any{"singerId": "singer-1", "ids": []string{"photo-2", "photo-1"}},
			),
			SuccessSchema:  nil,
			SuccessExample: nil,
			ErrorCodes:     []string{"wrong_parameter", "singer_not_existed", "not_authorized", "not_authorized_for_admin"},
		},
	}
}

func addOperation(paths map[string]any, op operation) {
	method := strings.ToLower(op.Method)

	pathItem, ok := paths[op.Path].(map[string]any)
	if !ok {
		pathItem = map[string]any{}
		paths[op.Path] = pathItem
	}

	item := map[string]any{
		"summary":             op.Summary,
		"description":         op.Description,
		"tags":                op.Tags,
		"x-cicada-auth":       op.Auth,
		"x-cicada-admin":      op.Admin,
		"x-cicada-errorCodes": op.ErrorCodes,
		"responses":           op.Responses,
	}
	if len(op.Parameters) > 0 {
		item["parameters"] = op.Parameters
	}
	if op.RequestBody != nil {
		item["requestBody"] = op.RequestBody
	}
	if op.Auth {
		item["security"] = []any{
			map[string]any{"CicadaToken": []any{}},
		}
	}
	if item["responses"] == nil {
		item["responses"] = jsonEnvelopeResponses(op.SuccessSchema, op.SuccessExample, op.ErrorCodes)
	}

	pathItem[method] = item
}

func jsonEnvelopeResponses(dataSchema map[string]any, successExample any, errorCodes []string) map[string]any {
	examples := map[string]any{
		"success": map[string]any{
			"summary": "Success response",
			"value":   successEnvelopeExample(successExample),
		},
	}
	if len(errorCodes) > 0 {
		code := errorCodes[0]
		if code == "success" && len(errorCodes) > 1 {
			code = errorCodes[1]
		}
		examples["error"] = map[string]any{
			"summary": "Error response",
			"value":   errorEnvelopeExample(code),
		}
	}

	return map[string]any{
		"200": map[string]any{
			"description": "Business response. Success and failure usually both return HTTP 200. Check the `code` field for the outcome.",
			"content": map[string]any{
				"application/json": map[string]any{
					"schema": map[string]any{
						"oneOf": []any{
							successEnvelopeSchema(dataSchema),
							errorEnvelopeSchema(),
						},
					},
					"examples": examples,
				},
			},
		},
	}
}

func binaryMedia() map[string]any {
	return map[string]any{
		"schema": map[string]any{
			"type":   "string",
			"format": "binary",
		},
	}
}

func jsonRequestBody(schema map[string]any, example any) map[string]any {
	media := map[string]any{"schema": schema}
	if example != nil {
		media["example"] = example
	}
	return map[string]any{
		"required": true,
		"content": map[string]any{
			"application/json": media,
		},
	}
}

func multipartRequestBody(schema map[string]any, example any) map[string]any {
	media := map[string]any{"schema": schema}
	if example != nil {
		media["example"] = example
	}
	return map[string]any{
		"required": true,
		"content": map[string]any{
			"multipart/form-data": media,
		},
	}
}

func successEnvelopeSchema(dataSchema map[string]any) map[string]any {
	props := map[string]any{
		"code": strEnumSchema([]string{"success"}, "success"),
	}
	if dataSchema != nil {
		props["data"] = dataSchema
	}
	return objSchema([]string{"code"}, props)
}

func errorEnvelopeSchema() map[string]any {
	return objSchema(
		[]string{"code", "message"},
		map[string]any{
			"code":    strSchema("Business error code.", "wrong_parameter"),
			"message": strSchema("Error message. The current implementation returns the same value as `code`.", "wrong_parameter"),
		},
	)
}

func successEnvelopeExample(data any) map[string]any {
	if data == nil {
		return map[string]any{"code": "success"}
	}
	return map[string]any{"code": "success", "data": data}
}

func errorEnvelopeExample(code string) map[string]any {
	return map[string]any{"code": code, "message": code}
}

func pathParam(name, desc string, schema map[string]any) map[string]any {
	return map[string]any{
		"name":        name,
		"in":          "path",
		"required":    true,
		"description": desc,
		"schema":      schema,
	}
}

func queryParam(name, desc string, required bool, schema map[string]any) map[string]any {
	return map[string]any{
		"name":        name,
		"in":          "query",
		"required":    required,
		"description": desc,
		"schema":      schema,
	}
}

func paginationParams(extra ...map[string]any) []map[string]any {
	out := make([]map[string]any, 0, len(extra)+2)
	out = append(out, extra...)
	out = append(out,
		queryParam("page", "Page number. Default is 1.", false, intSchema("", 1)),
		queryParam("pageSize", "Page size. Default is 20. Maximum is 100.", false, intSchema("", 20)),
	)
	return out
}

func strSchema(desc, example string) map[string]any {
	out := map[string]any{"type": "string"}
	if desc != "" {
		out["description"] = desc
	}
	if example != "" {
		out["example"] = example
	}
	return out
}

func strEnumSchema(values []string, example string) map[string]any {
	enumVals := make([]any, 0, len(values))
	for _, v := range values {
		enumVals = append(enumVals, v)
	}
	out := map[string]any{
		"type": "string",
		"enum": enumVals,
	}
	if example != "" {
		out["example"] = example
	}
	return out
}

func intSchema(desc string, example any) map[string]any {
	out := map[string]any{"type": "integer"}
	if desc != "" {
		out["description"] = desc
	}
	if example != nil {
		out["example"] = example
	}
	return out
}

func numSchema(desc string, example any) map[string]any {
	out := map[string]any{"type": "number"}
	if desc != "" {
		out["description"] = desc
	}
	if example != nil {
		out["example"] = example
	}
	return out
}

func boolSchema(desc string, example any) map[string]any {
	out := map[string]any{"type": "boolean"}
	if desc != "" {
		out["description"] = desc
	}
	if example != nil {
		out["example"] = example
	}
	return out
}

func anySchema(desc string) map[string]any {
	out := map[string]any{}
	if desc != "" {
		out["description"] = desc
	}
	return out
}

func arraySchema(items map[string]any) map[string]any {
	return map[string]any{
		"type":  "array",
		"items": items,
	}
}

func objArraySchema(props map[string]any) map[string]any {
	return arraySchema(objSchema(nil, props))
}

func objSchema(required []string, props map[string]any) map[string]any {
	out := map[string]any{
		"type":       "object",
		"properties": props,
	}
	if len(required) > 0 {
		req := make([]any, 0, len(required))
		for _, r := range required {
			req = append(req, r)
		}
		out["required"] = req
	}
	return out
}

func nullableSchema(schema map[string]any) map[string]any {
	out := map[string]any{}
	for k, v := range schema {
		out[k] = v
	}
	out["nullable"] = true
	return out
}

func metadataSchema() map[string]any {
	appVersion := version.Get()
	return objSchema(
		[]string{"hostname", "version"},
		map[string]any{
			"hostname": strSchema("Hostname of the current service node.", "cicada.local"),
			"version":  strSchema("Application version.", appVersion),
		},
	)
}

func uploadAssetSchema() map[string]any {
	return objSchema(
		[]string{"id", "path"},
		map[string]any{
			"id":   strSchema("Asset filename ID.", "a1b2c3d4.jpg"),
			"path": strSchema("Publicly accessible asset path.", "/asset/music_cover/a1b2c3d4.jpg"),
		},
	)
}

func loginRequestSchema() map[string]any {
	return objSchema(
		[]string{"username", "password", "captchaId", "captchaValue"},
		map[string]any{
			"username":     strSchema("Username.", "cicada"),
			"password":     strSchema("Password.", "cicada"),
			"captchaId":    strSchema("Captcha ID.", "9c4a0f42"),
			"captchaValue": strSchema("Captcha value.", "5k7n"),
		},
	)
}

func login2FARequestSchema() map[string]any {
	return objSchema(
		[]string{"username", "password", "twoFAToken"},
		map[string]any{
			"username":   strSchema("Username.", "cicada"),
			"password":   strSchema("Password.", "cicada"),
			"twoFAToken": strSchema("6-digit TOTP token.", "123456"),
		},
	)
}

func updateProfileRequestSchema() map[string]any {
	return objSchema(
		[]string{"key"},
		map[string]any{
			"key": strEnumSchema([]string{"password", "avatar", "nickname", "musicbillOrders"}, "nickname"),
			"value": map[string]any{
				"oneOf": []any{
					strSchema("String value.", "Cicada"),
					intSchema("Integer value.", 1),
					boolSchema("Boolean value.", true),
					arraySchema(strSchema("", "musicbill-1")),
				},
				"description": "Dynamic value whose meaning depends on the selected key.",
			},
		},
	)
}

func profileSchema() map[string]any {
	return objSchema(
		[]string{
			"id", "username", "avatar", "nickname", "joinTimestamp", "admin",
			"musicbillMaxAmount", "createMusicMaxAmountPerDay", "lastActiveTimestamp",
			"musicPlayRecordIndate", "twoFAEnabled",
		},
		map[string]any{
			"id":                         strSchema("User ID.", "1"),
			"username":                   strSchema("Username.", "cicada"),
			"avatar":                     strSchema("Avatar path.", "/asset/user_avatar/avatar.jpg"),
			"nickname":                   strSchema("Nickname.", "Cicada"),
			"joinTimestamp":              intSchema("Join timestamp in milliseconds.", 1710000000000),
			"admin":                      intSchema("Admin flag.", 1),
			"musicbillOrdersJSON":        nullableSchema(strSchema("Musicbill order JSON string.", "[\"musicbill-1\"]")),
			"musicbillMaxAmount":         intSchema("Musicbill limit.", 100),
			"createMusicMaxAmountPerDay": intSchema("Daily music creation limit.", 10),
			"lastActiveTimestamp":        intSchema("Last active timestamp in milliseconds.", 1710000000000),
			"musicPlayRecordIndate":      intSchema("Play record retention setting.", 0),
			"twoFAEnabled":               boolSchema("Whether 2FA is enabled.", true),
		},
	)
}

func profileExample() map[string]any {
	return map[string]any{
		"id":                         "1",
		"username":                   "cicada",
		"avatar":                     "/asset/user_avatar/avatar.jpg",
		"nickname":                   "Cicada",
		"joinTimestamp":              int64(1710000000000),
		"admin":                      1,
		"musicbillOrdersJSON":        "[\"musicbill-1\"]",
		"musicbillMaxAmount":         100,
		"createMusicMaxAmountPerDay": 10,
		"lastActiveTimestamp":        int64(1710000000000),
		"musicPlayRecordIndate":      0,
		"twoFAEnabled":               true,
	}
}

func publicUserSchema() map[string]any {
	return objSchema(
		[]string{"id", "avatar", "joinTimestamp", "nickname", "username", "musicbillList", "musicList"},
		map[string]any{
			"id":            strSchema("User ID.", "1"),
			"avatar":        strSchema("Avatar path.", "/asset/user_avatar/avatar.jpg"),
			"joinTimestamp": intSchema("Join timestamp in milliseconds.", 1710000000000),
			"nickname":      strSchema("Nickname.", "Cicada"),
			"username":      strSchema("Username.", "cicada"),
			"musicbillList": arraySchema(publicUserMusicbillSchema()),
			"musicList":     arraySchema(musicSummarySchema()),
		},
	)
}

func publicUserExample() map[string]any {
	return map[string]any{
		"id":            "1",
		"avatar":        "/asset/user_avatar/avatar.jpg",
		"joinTimestamp": int64(1710000000000),
		"nickname":      "Cicada",
		"username":      "cicada",
		"musicbillList": []any{
			map[string]any{
				"id":         "musicbill-1",
				"cover":      "/asset/musicbill_cover/cover.jpg",
				"name":       "Favorites",
				"musicCount": 12,
			},
		},
		"musicList": musicListPageExample("musicList")["musicList"],
	}
}

func publicUserMusicbillSchema() map[string]any {
	return objSchema(
		[]string{"id", "cover", "name", "musicCount"},
		map[string]any{
			"id":         strSchema("Public musicbill ID.", "musicbill-1"),
			"cover":      strSchema("Cover path.", "/asset/musicbill_cover/cover.jpg"),
			"name":       strSchema("Musicbill name.", "Favorites"),
			"musicCount": intSchema("Music count.", 12),
		},
	)
}

func twoFASetupSchema() map[string]any {
	return objSchema(
		[]string{"secret", "url"},
		map[string]any{
			"secret": strSchema("2FA secret for the user to save.", "JBSWY3DPEHPK3PXP"),
			"url":    strSchema("otpauth URL。", "otpauth://totp/Cicada:cicada?secret=JBSWY3DPEHPK3PXP&issuer=Cicada"),
		},
	)
}

func userBriefSchema(withAvatar bool) map[string]any {
	props := map[string]any{
		"id":       strSchema("User ID.", "1"),
		"nickname": strSchema("Nickname.", "Cicada"),
	}
	required := []string{"id", "nickname"}
	if withAvatar {
		props["avatar"] = strSchema("Avatar path.", "/asset/user_avatar/avatar.jpg")
		required = append(required, "avatar")
	}
	return objSchema(required, props)
}

func singerSchema() map[string]any {
	return objSchema(
		[]string{"id", "name", "aliases"},
		map[string]any{
			"id":      strSchema("Singer ID.", "singer-1"),
			"name":    strSchema("Singer name.", "Aurora"),
			"aliases": arraySchema(strSchema("", "AUR")),
		},
	)
}

func singerWithPhotosSchema() map[string]any {
	return objSchema(
		[]string{"id", "name", "aliases", "photos"},
		map[string]any{
			"id":      strSchema("Singer ID.", "singer-1"),
			"name":    strSchema("Singer name.", "Aurora"),
			"aliases": arraySchema(strSchema("", "AUR")),
			"photos":  arraySchema(singerPhotoSchema()),
		},
	)
}

func singerPhotoSchema() map[string]any {
	return objSchema(
		[]string{"id", "asset", "description"},
		map[string]any{
			"id":          strSchema("Photo ID.", "photo-1"),
			"asset":       strSchema("Photo asset path.", "/asset/singer_photo/photo.jpg"),
			"description": strSchema("Photo description (may be empty).", "Live in Tokyo, 2024"),
		},
	)
}

func musicSummarySchema() map[string]any {
	return objSchema(
		[]string{"id", "type", "name", "aliases", "cover", "asset", "heat", "createTimestamp", "singers"},
		map[string]any{
			"id":              strSchema("Music ID.", "music-1"),
			"type":            intSchema("Music type. 1 = song, 2 = instrumental.", 1),
			"name":            strSchema("Music name.", "Nightingale"),
			"aliases":         arraySchema(strSchema("", "Night Song")),
			"cover":           strSchema("Cover path.", "/asset/music_cover/cover.jpg"),
			"asset":           strSchema("Audio asset path.", "/asset/music/track.mp3"),
			"heat":            intSchema("Heat score.", 42),
			"createTimestamp": intSchema("Creation timestamp in milliseconds.", 1710000000000),
			"singers":         arraySchema(singerSchema()),
		},
	)
}

func musicRelatedSchema() map[string]any {
	return objSchema(
		[]string{"id", "name", "cover", "singers"},
		map[string]any{
			"id":      strSchema("Related music ID.", "music-2"),
			"name":    strSchema("Related music name.", "Night Song"),
			"cover":   strSchema("Cover path.", "/asset/music_cover/cover.jpg"),
			"singers": arraySchema(singerSchema()),
		},
	)
}

func musicDetailSchema() map[string]any {
	return objSchema(
		[]string{
			"id", "type", "name", "aliases", "cover", "asset", "heat", "createTimestamp",
			"singers", "createUser", "forkList", "forkFromList", "musicbillCount",
		},
		map[string]any{
			"id":              strSchema("Music ID.", "music-1"),
			"type":            intSchema("Music type.", 1),
			"name":            strSchema("Music name.", "Nightingale"),
			"aliases":         arraySchema(strSchema("", "Night Song")),
			"cover":           strSchema("Cover path.", "/asset/music_cover/cover.jpg"),
			"asset":           strSchema("Audio asset path.", "/asset/music/track.mp3"),
			"heat":            intSchema("Heat score.", 42),
			"createTimestamp": intSchema("Creation timestamp in milliseconds.", 1710000000000),
			"year":            nullableSchema(intSchema("Year.", 2024)),
			"singers":         arraySchema(singerSchema()),
			"createUser":      userBriefSchema(false),
			"forkList":        arraySchema(musicRelatedSchema()),
			"forkFromList":    arraySchema(musicRelatedSchema()),
			"musicbillCount":  intSchema("Musicbill reference count.", 3),
		},
	)
}

func musicDetailExample() map[string]any {
	return map[string]any{
		"id":              "music-1",
		"type":            1,
		"name":            "Nightingale",
		"aliases":         []string{"Night Song"},
		"cover":           "/asset/music_cover/cover.jpg",
		"asset":           "/asset/music/track.mp3",
		"heat":            42,
		"createTimestamp": int64(1710000000000),
		"year":            2024,
		"singers": []any{
			map[string]any{"id": "singer-1", "name": "Aurora", "aliases": []string{"AUR"}},
		},
		"createUser":     map[string]any{"id": "1", "nickname": "Cicada"},
		"forkList":       []any{},
		"forkFromList":   []any{},
		"musicbillCount": 3,
	}
}

func createMusicRequestSchema() map[string]any {
	return objSchema(
		[]string{"name", "singerIds", "asset"},
		map[string]any{
			"name":      strSchema("Music name.", "Nightingale"),
			"singerIds": strSchema("Comma-separated singer ID string.", "singer-1,singer-2"),
			"type":      intSchema("Music type. 1 = song, 2 = instrumental.", 1),
			"asset":     strSchema("Uploaded audio asset ID.", "track.mp3"),
		},
	)
}

func flexibleValueSchema() map[string]any {
	return map[string]any{
		"oneOf": []any{
			strSchema("String value.", "example"),
			intSchema("Integer value.", 1),
			numSchema("Numeric value.", 1.5),
			boolSchema("Boolean value.", true),
			arraySchema(strSchema("", "item")),
		},
		"description": "Dynamic value. The exact meaning depends on the selected key.",
	}
}

func updateMusicRequestSchema() map[string]any {
	return objSchema(
		[]string{"id", "key"},
		map[string]any{
			"id":    strSchema("Music ID.", "music-1"),
			"key":   strEnumSchema([]string{"name", "aliases", "lyric", "cover", "asset", "singers", "type", "year", "fork"}, "aliases"),
			"value": flexibleValueSchema(),
		},
	)
}

func musicListPageSchema(listKey string) map[string]any {
	return objSchema(
		[]string{"total", listKey},
		map[string]any{
			"total": intSchema("Total count.", 1),
			listKey: arraySchema(musicSummarySchema()),
		},
	)
}

func musicListPageExample(listKey string) map[string]any {
	return map[string]any{
		"total": 1,
		listKey: []any{
			map[string]any{
				"id":              "music-1",
				"type":            1,
				"name":            "Nightingale",
				"aliases":         []string{"Night Song"},
				"cover":           "/asset/music_cover/cover.jpg",
				"asset":           "/asset/music/track.mp3",
				"heat":            42,
				"createTimestamp": int64(1710000000000),
				"singers":         []any{map[string]any{"id": "singer-1", "name": "Aurora", "aliases": []string{"AUR"}}},
			},
		},
	}
}

func lyricSearchPageSchema() map[string]any {
	return objSchema(
		[]string{"total", "musicList"},
		map[string]any{
			"total":     intSchema("Total count.", 1),
			"musicList": arraySchema(musicSummaryWithLyricsSchema()),
		},
	)
}

func lyricSearchPageExample() map[string]any {
	return map[string]any{
		"total": 1,
		"musicList": []any{
			map[string]any{
				"id":              "music-1",
				"type":            1,
				"name":            "Nightingale",
				"aliases":         []string{"Night Song"},
				"cover":           "/asset/music_cover/cover.jpg",
				"asset":           "/asset/music/track.mp3",
				"heat":            42,
				"createTimestamp": int64(1710000000000),
				"singers":         []any{map[string]any{"id": "singer-1", "name": "Aurora", "aliases": []string{"AUR"}}},
				"lyrics":          []any{map[string]any{"id": 1, "lrc": "[00:00.00]starlight"}},
			},
		},
	}
}

func musicSummaryWithLyricsSchema() map[string]any {
	return objSchema(
		[]string{"id", "type", "name", "aliases", "cover", "asset", "heat", "createTimestamp", "singers", "lyrics"},
		map[string]any{
			"id":              strSchema("Music ID.", "music-1"),
			"type":            intSchema("Music type. 1 = song, 2 = instrumental.", 1),
			"name":            strSchema("Music name.", "Nightingale"),
			"aliases":         arraySchema(strSchema("", "Night Song")),
			"cover":           strSchema("Cover path.", "/asset/music_cover/cover.jpg"),
			"asset":           strSchema("Audio asset path.", "/asset/music/track.mp3"),
			"heat":            intSchema("Heat score.", 42),
			"createTimestamp": intSchema("Creation timestamp in milliseconds.", 1710000000000),
			"singers":         arraySchema(singerSchema()),
			"lyrics": objArraySchema(map[string]any{
				"id":  intSchema("Lyric record ID.", 1),
				"lrc": strSchema("LRC content.", "[00:00.00]starlight"),
			}),
		},
	)
}

func singerDetailSchema() map[string]any {
	return objSchema(
		[]string{"id", "name", "aliases", "photos", "musicList"},
		map[string]any{
			"id":      strSchema("Singer ID.", "singer-1"),
			"name":    strSchema("Singer name.", "Aurora"),
			"aliases": arraySchema(strSchema("", "AUR")),
			"photos":  arraySchema(singerPhotoSchema()),
			"musicList": arraySchema(objSchema([]string{"id", "type", "name", "aliases", "cover", "asset", "singers"}, map[string]any{
				"id":      strSchema("Music ID.", "music-1"),
				"type":    intSchema("Music type.", 1),
				"name":    strSchema("Music name.", "Nightingale"),
				"aliases": arraySchema(strSchema("", "Night Song")),
				"cover":   strSchema("Cover path.", "/asset/music_cover/cover.jpg"),
				"asset":   strSchema("Audio asset path.", "/asset/music/track.mp3"),
				"singers": arraySchema(singerSchema()),
			})),
		},
	)
}

func singerDetailExample() map[string]any {
	return map[string]any{
		"id":      "singer-1",
		"name":    "Aurora",
		"aliases": []string{"AUR"},
		"photos": []any{
			map[string]any{"id": "photo-1", "asset": "/asset/singer_photo/photo.jpg", "description": "Live in Tokyo, 2024"},
		},
		"musicList": []any{
			map[string]any{
				"id":      "music-1",
				"type":    1,
				"name":    "Nightingale",
				"aliases": []string{"Night Song"},
				"cover":   "/asset/music_cover/cover.jpg",
				"asset":   "/asset/music/track.mp3",
				"singers": []any{map[string]any{"id": "singer-1", "name": "Aurora", "aliases": []string{"AUR"}}},
			},
		},
	}
}

func adminSingerDetailSchema() map[string]any {
	return objSchema(
		[]string{"id", "name", "aliases", "photos", "createTimestamp", "createUser"},
		map[string]any{
			"id":              strSchema("Singer ID.", "singer-1"),
			"name":            strSchema("Singer name.", "Aurora"),
			"aliases":         arraySchema(strSchema("", "AUR")),
			"photos":          arraySchema(singerPhotoSchema()),
			"createTimestamp": intSchema("Creation timestamp in milliseconds.", 1710000000000),
			"createUser": objSchema([]string{"id", "username", "nickname"}, map[string]any{
				"id":       strSchema("User ID.", "1"),
				"username": strSchema("Username.", "alice"),
				"nickname": strSchema("Nickname.", "Alice"),
			}),
		},
	)
}

func adminSingerDetailExample() map[string]any {
	return map[string]any{
		"id":      "singer-1",
		"name":    "Aurora",
		"aliases": []string{"AUR"},
		"photos": []any{
			map[string]any{"id": "photo-1", "asset": "/asset/singer_photo/photo.jpg", "description": "Live in Tokyo, 2024"},
		},
		"createTimestamp": int64(1710000000000),
		"createUser":      map[string]any{"id": "1", "username": "alice", "nickname": "Alice"},
	}
}

func updateSingerRequestSchema() map[string]any {
	return objSchema(
		[]string{"id", "key"},
		map[string]any{
			"id":    strSchema("Singer ID.", "singer-1"),
			"key":   strEnumSchema([]string{"name", "aliases"}, "name"),
			"value": flexibleValueSchema(),
		},
	)
}

func playRecordSchema() map[string]any {
	return objSchema(
		[]string{"recordId", "percent", "timestamp", "id", "name", "aliases", "singers"},
		map[string]any{
			"recordId":  intSchema("Play record ID.", 1),
			"percent":   numSchema("Playback ratio.", 0.82),
			"timestamp": intSchema("Playback timestamp in milliseconds.", 1710000000000),
			"id":        strSchema("Music ID.", "music-1"),
			"name":      strSchema("Music name.", "Nightingale"),
			"aliases":   arraySchema(strSchema("", "Night Song")),
			"singers": objArraySchema(map[string]any{
				"id":   strSchema("Singer ID.", "singer-1"),
				"name": strSchema("Singer name.", "Aurora"),
			}),
		},
	)
}

func sharedUserSchema() map[string]any {
	return objSchema(
		[]string{"id", "nickname", "avatar", "accepted"},
		map[string]any{
			"id":       strSchema("User ID.", "2"),
			"nickname": strSchema("Nickname.", "Alice"),
			"avatar":   strSchema("Avatar path.", "/asset/user_avatar/avatar.jpg"),
			"accepted": boolSchema("Whether the invitation has been accepted.", true),
		},
	)
}

func musicbillSummarySchema() map[string]any {
	return objSchema(
		[]string{"id", "name", "cover", "public", "createTimestamp", "owner", "sharedUserList"},
		map[string]any{
			"id":              strSchema("Musicbill ID.", "musicbill-1"),
			"name":            strSchema("Musicbill name.", "Late Night"),
			"cover":           strSchema("Cover path.", "/asset/musicbill_cover/cover.jpg"),
			"public":          boolSchema("Whether the musicbill is public.", true),
			"createTimestamp": intSchema("Creation timestamp in milliseconds.", 1710000000000),
			"owner":           userBriefSchema(true),
			"sharedUserList":  arraySchema(sharedUserSchema()),
		},
	)
}

func musicbillSummaryExample() map[string]any {
	return map[string]any{
		"id":              "musicbill-1",
		"name":            "Late Night",
		"cover":           "/asset/musicbill_cover/cover.jpg",
		"public":          true,
		"createTimestamp": int64(1710000000000),
		"owner":           map[string]any{"id": "1", "nickname": "Cicada", "avatar": "/asset/user_avatar/avatar.jpg"},
		"sharedUserList":  []any{map[string]any{"id": "2", "nickname": "Alice", "avatar": "/asset/user_avatar/avatar2.jpg", "accepted": true}},
	}
}

func musicbillDetailSchema() map[string]any {
	return objSchema(
		[]string{"id", "name", "cover", "public", "createTimestamp", "owner", "sharedUserList", "musicList"},
		map[string]any{
			"id":              strSchema("Musicbill ID.", "musicbill-1"),
			"name":            strSchema("Musicbill name.", "Late Night"),
			"cover":           strSchema("Cover path.", "/asset/musicbill_cover/cover.jpg"),
			"public":          boolSchema("Whether the musicbill is public.", true),
			"createTimestamp": intSchema("Creation timestamp in milliseconds.", 1710000000000),
			"owner":           userBriefSchema(true),
			"sharedUserList":  arraySchema(sharedUserSchema()),
			"musicList": objArraySchema(map[string]any{
				"id":      strSchema("Music ID.", "music-1"),
				"type":    intSchema("Music type.", 1),
				"name":    strSchema("Music name.", "Nightingale"),
				"aliases": arraySchema(strSchema("", "Night Song")),
				"cover":   strSchema("Cover path.", "/asset/music_cover/cover.jpg"),
				"asset":   strSchema("Audio asset path.", "/asset/music/track.mp3"),
				"singers": arraySchema(singerSchema()),
			}),
		},
	)
}

func musicbillDetailExample() map[string]any {
	return map[string]any{
		"id":              "musicbill-1",
		"name":            "Late Night",
		"cover":           "/asset/musicbill_cover/cover.jpg",
		"public":          true,
		"createTimestamp": int64(1710000000000),
		"owner":           map[string]any{"id": "1", "nickname": "Cicada", "avatar": "/asset/user_avatar/avatar.jpg"},
		"sharedUserList":  []any{map[string]any{"id": "2", "nickname": "Alice", "avatar": "/asset/user_avatar/avatar2.jpg", "accepted": true}},
		"musicList": []any{
			map[string]any{
				"id":      "music-1",
				"type":    1,
				"name":    "Nightingale",
				"aliases": []string{"Night Song"},
				"cover":   "/asset/music_cover/cover.jpg",
				"asset":   "/asset/music/track.mp3",
				"singers": []any{map[string]any{"id": "singer-1", "name": "Aurora", "aliases": []string{"AUR"}}},
			},
		},
	}
}

func updateMusicbillRequestSchema() map[string]any {
	return objSchema(
		[]string{"id", "key"},
		map[string]any{
			"id":    strSchema("Musicbill ID.", "musicbill-1"),
			"key":   strEnumSchema([]string{"name", "cover", "public"}, "public"),
			"value": flexibleValueSchema(),
		},
	)
}

func invitationSchema() map[string]any {
	return objSchema(
		[]string{"id", "inviteTimestamp", "inviteUserId", "inviteUserNickname", "musicbillId"},
		map[string]any{
			"id":                 intSchema("Invitation record ID.", 1),
			"inviteTimestamp":    intSchema("Invitation timestamp in milliseconds.", 1710000000000),
			"inviteUserId":       strSchema("Inviter user ID.", "1"),
			"inviteUserNickname": strSchema("Inviter nickname.", "Cicada"),
			"musicbillId":        strSchema("Musicbill ID.", "musicbill-1"),
		},
	)
}

func invitationExample() map[string]any {
	return map[string]any{
		"id":                 1,
		"inviteTimestamp":    int64(1710000000000),
		"inviteUserId":       "1",
		"inviteUserNickname": "Cicada",
		"musicbillId":        "musicbill-1",
	}
}

func publicMusicbillDetailSchema() map[string]any {
	return objSchema(
		[]string{"id", "name", "cover", "createTimestamp", "user", "musicList", "collected"},
		map[string]any{
			"id":              strSchema("Musicbill ID.", "musicbill-1"),
			"name":            strSchema("Musicbill name.", "Late Night"),
			"cover":           strSchema("Cover path.", "/asset/musicbill_cover/cover.jpg"),
			"createTimestamp": intSchema("Creation timestamp in milliseconds.", 1710000000000),
			"user":            userBriefSchema(true),
			"musicList": objArraySchema(map[string]any{
				"id":      strSchema("Music ID.", "music-1"),
				"type":    intSchema("Music type.", 1),
				"name":    strSchema("Music name.", "Nightingale"),
				"aliases": arraySchema(strSchema("", "Night Song")),
				"cover":   strSchema("Cover path.", "/asset/music_cover/cover.jpg"),
				"asset":   strSchema("Audio asset path.", "/asset/music/track.mp3"),
				"singers": arraySchema(singerSchema()),
			}),
			"collected": boolSchema("Whether the current user has collected it.", true),
		},
	)
}

func publicMusicbillDetailExample() map[string]any {
	return map[string]any{
		"id":              "musicbill-1",
		"name":            "Late Night",
		"cover":           "/asset/musicbill_cover/cover.jpg",
		"createTimestamp": int64(1710000000000),
		"user":            map[string]any{"id": "1", "nickname": "Cicada", "avatar": "/asset/user_avatar/avatar.jpg"},
		"musicList": []any{
			map[string]any{
				"id":      "music-1",
				"type":    1,
				"name":    "Nightingale",
				"aliases": []string{"Night Song"},
				"cover":   "/asset/music_cover/cover.jpg",
				"asset":   "/asset/music/track.mp3",
				"singers": []any{map[string]any{"id": "singer-1", "name": "Aurora", "aliases": []string{"AUR"}}},
			},
		},
		"collected": true,
	}
}

func musicbillCardSchema() map[string]any {
	return objSchema(
		[]string{"id", "name", "cover", "user"},
		map[string]any{
			"id":    strSchema("Musicbill ID.", "musicbill-1"),
			"name":  strSchema("Musicbill name.", "Late Night"),
			"cover": strSchema("Cover path.", "/asset/musicbill_cover/cover.jpg"),
			"user":  userBriefSchema(true),
		},
	)
}

func musicbillPageSchema(listKey string) map[string]any {
	return objSchema(
		[]string{"total", listKey},
		map[string]any{
			"total": intSchema("Total count.", 1),
			listKey: arraySchema(musicbillCardSchema()),
		},
	)
}

func musicbillPageExample(listKey string) map[string]any {
	return map[string]any{
		"total": 1,
		listKey: []any{
			map[string]any{
				"id":    "musicbill-1",
				"name":  "Late Night",
				"cover": "/asset/musicbill_cover/cover.jpg",
				"user":  map[string]any{"id": "1", "nickname": "Cicada", "avatar": "/asset/user_avatar/avatar.jpg"},
			},
		},
	}
}

func explorationSchema() map[string]any {
	return objSchema(
		[]string{"musicList", "singerList", "publicMusicbillList"},
		map[string]any{
			"musicList": arraySchema(objSchema([]string{"id", "name", "cover", "singers"}, map[string]any{
				"id":      strSchema("Music ID.", "music-1"),
				"name":    strSchema("Music name.", "Nightingale"),
				"cover":   strSchema("Cover path.", "/asset/music_cover/cover.jpg"),
				"singers": objArraySchema(map[string]any{"id": strSchema("Singer ID.", "singer-1"), "name": strSchema("Singer name.", "Aurora")}),
			})),
			"singerList": arraySchema(objSchema([]string{"id", "name"}, map[string]any{
				"id":   strSchema("Singer ID.", "singer-1"),
				"name": strSchema("Singer name.", "Aurora"),
			})),
			"publicMusicbillList": arraySchema(objSchema([]string{"id", "name", "cover", "user"}, map[string]any{
				"id":    strSchema("Musicbill ID.", "musicbill-1"),
				"name":  strSchema("Musicbill name.", "Late Night"),
				"cover": strSchema("Cover path.", "/asset/musicbill_cover/cover.jpg"),
				"user":  userBriefSchema(false),
			})),
		},
	)
}

func explorationExample() map[string]any {
	return map[string]any{
		"musicList": []any{
			map[string]any{
				"id":      "music-1",
				"name":    "Nightingale",
				"cover":   "/asset/music_cover/cover.jpg",
				"singers": []any{map[string]any{"id": "singer-1", "name": "Aurora"}},
			},
		},
		"singerList": []any{
			map[string]any{"id": "singer-1", "name": "Aurora"},
		},
		"publicMusicbillList": []any{
			map[string]any{"id": "musicbill-1", "name": "Late Night", "cover": "/asset/musicbill_cover/cover.jpg", "user": map[string]any{"id": "1", "nickname": "Cicada"}},
		},
	}
}

func adminUpdateUserRequestSchema() map[string]any {
	return objSchema(
		[]string{"id", "key"},
		map[string]any{
			"id":    strSchema("User ID.", "10001"),
			"key":   strEnumSchema([]string{"remark", "musicbillMaxAmount", "createMusicMaxAmountPerDay", "musicPlayRecordIndate"}, "remark"),
			"value": flexibleValueSchema(),
		},
	)
}

func adminUserSchema() map[string]any {
	return objSchema(
		[]string{
			"id", "username", "nickname", "avatar", "joinTimestamp", "admin", "remark",
			"musicbillMaxAmount", "createMusicMaxAmountPerDay", "lastActiveTimestamp", "musicPlayRecordIndate",
		},
		map[string]any{
			"id":                         strSchema("User ID.", "10001"),
			"username":                   strSchema("Username.", "alice"),
			"nickname":                   strSchema("Nickname.", "Alice"),
			"avatar":                     strSchema("Avatar path.", "/asset/user_avatar/avatar.jpg"),
			"joinTimestamp":              intSchema("Join timestamp in milliseconds.", 1710000000000),
			"admin":                      intSchema("Admin flag.", 0),
			"remark":                     strSchema("Remark.", "VIP user"),
			"musicbillMaxAmount":         intSchema("Musicbill limit.", 100),
			"createMusicMaxAmountPerDay": intSchema("Daily music creation limit.", 10),
			"lastActiveTimestamp":        intSchema("Last active timestamp in milliseconds.", 1710000000000),
			"musicPlayRecordIndate":      intSchema("Play record retention setting.", 0),
		},
	)
}

func adminUserExample() map[string]any {
	return map[string]any{
		"id":                         "10001",
		"username":                   "alice",
		"nickname":                   "Alice",
		"avatar":                     "/asset/user_avatar/avatar.jpg",
		"joinTimestamp":              int64(1710000000000),
		"admin":                      0,
		"remark":                     "VIP user",
		"musicbillMaxAmount":         100,
		"createMusicMaxAmountPerDay": 10,
		"lastActiveTimestamp":        int64(1710000000000),
		"musicPlayRecordIndate":      0,
	}
}
