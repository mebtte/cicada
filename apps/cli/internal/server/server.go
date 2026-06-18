package server

import (
	"cicada/internal/api/handler"
	"cicada/internal/api/middleware"
	"cicada/internal/apidoc"
	"cicada/internal/config"
	"fmt"

	"github.com/gin-gonic/gin"
)

func NewServer() *gin.Engine {
	if config.Get().Mode == config.ModeDevelopment {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	if config.Get().Mode == config.ModeDevelopment {
		r.Use(gin.Logger())
	}
	r.Use(middleware.AccessLogger())
	r.Use(middleware.Recovery())
	r.Use(corsMiddleware())
	apidoc.Register(r)

	// Asset serving (no auth)
	for _, at := range config.AllAssetTypes {
		path := fmt.Sprintf("/asset/%s/:filename", at)
		assetHandler := handler.ServeAsset(at)
		r.GET(path, assetHandler)
		r.HEAD(path, assetHandler)
	}

	// Per-route auth: each handler explicitly declares the middleware it needs.
	// Conventions:
	//   - public:  r.METHOD(path, handler)
	//   - authed:  r.METHOD(path, middleware.Auth(), handler)
	//   - admin:   r.METHOD(path, middleware.Auth(), middleware.Admin(), handler)
	// SECURITY: opt-in auth means new handlers default to public — when adding
	// a route, explicitly choose one of the three forms above.
	auth := middleware.Auth
	admin := middleware.Admin

	api := r.Group("/api")
	base := api.Group("/base")
	common := api.Group("/common")
	adminAPI := api.Group("/admin")

	// Base routes (public)
	base.GET("/metadata", handler.GetMetadata)
	base.GET("/captcha", handler.GetCaptcha)
	base.POST("/login", handler.Login)
	base.POST("/login_with_2fa", handler.LoginWith2FA)

	// Common API routes

	// Asset upload
	common.POST("/asset", auth(), handler.UploadAsset)
	common.POST("/asset/upload", auth(), handler.InitPartialUpload)
	common.GET("/asset/upload/:uploadId", auth(), handler.GetPartialUpload)
	common.PUT("/asset/upload/:uploadId", auth(), handler.PutPartialUploadChunk)
	common.POST("/asset/upload/:uploadId/complete", auth(), handler.CompletePartialUpload)

	// User / profile
	common.GET("/profile", auth(), handler.GetProfile)
	common.PUT("/profile", auth(), handler.UpdateProfile)
	common.GET("/user", auth(), handler.GetUser)

	// 2FA
	common.POST("/2fa", auth(), handler.Create2FA)
	common.PUT("/2fa", auth(), handler.Enable2FA)
	common.DELETE("/2fa", auth(), handler.Disable2FA)

	// Auth sessions
	common.GET("/sessions", auth(), handler.GetSessionList)
	common.PUT("/sessions/:id", auth(), handler.UpdateSession)
	common.DELETE("/sessions/:id", auth(), handler.DeleteSession)

	// Music
	common.GET("/music", auth(), handler.GetMusic)
	common.GET("/music/search", auth(), handler.SearchMusic)
	common.GET("/music/search_by_lyric", auth(), handler.SearchMusicByLyric)
	common.GET("/music/random", auth(), handler.GetRandomMusic)

	// Artist (read)
	common.GET("/artist", auth(), handler.GetArtist)
	common.GET("/artist/search", auth(), handler.SearchArtist)

	// Lyric
	common.GET("/lyric_list", auth(), handler.GetLyricList)

	// Play records
	common.POST("/music_play_record", auth(), handler.CreateMusicPlayRecord)
	common.GET("/music_play_record_list", auth(), handler.GetMusicPlayRecordList)
	common.DELETE("/music_play_record", auth(), handler.DeleteMusicPlayRecord)

	// Musicbill
	common.GET("/musicbill_list", auth(), handler.GetMusicbillList)
	common.GET("/musicbill", auth(), handler.GetMusicbill)
	common.POST("/musicbill", auth(), handler.CreateMusicbill)
	common.PUT("/musicbill", auth(), handler.UpdateMusicbill)
	common.DELETE("/musicbill", auth(), handler.DeleteMusicbill)
	common.POST("/musicbill_music", auth(), handler.AddMusicToMusicbill)
	common.DELETE("/musicbill_music", auth(), handler.RemoveMusicFromMusicbill)
	common.GET("/musicbill/followed_artist", auth(), handler.GetMusicbillFollowedArtistList)
	common.POST("/musicbill/followed_artist", auth(), handler.AddMusicbillFollowedArtist)
	common.DELETE("/musicbill/followed_artist", auth(), handler.DeleteMusicbillFollowedArtist)

	// Shared musicbill
	common.POST("/musicbill/shared_user", auth(), handler.AddMusicbillSharedUser)
	common.DELETE("/musicbill/shared_user", auth(), handler.DeleteMusicbillSharedUser)
	common.PUT("/musicbill/owner", auth(), handler.TransferMusicbillOwner)
	common.GET("/shared_musicbill_invitation_list", auth(), handler.GetSharedMusicbillInvitationList)
	common.PUT("/shared_musicbill_invitation", auth(), handler.AcceptSharedMusicbillInvitation)

	// Public musicbill
	common.GET("/public_musicbill", auth(), handler.GetPublicMusicbill)
	common.GET("/public_musicbill/search", auth(), handler.SearchPublicMusicbill)
	common.POST("/public_musicbill/collection", auth(), handler.CollectPublicMusicbill)
	common.DELETE("/public_musicbill/collection", auth(), handler.UncollectPublicMusicbill)
	common.GET("/public_musicbill_collection_list", auth(), handler.GetPublicMusicbillCollectionList)

	// Exploration
	common.GET("/exploration", auth(), handler.GetExploration)

	// Admin (auth + admin on every route)
	adminAPI.POST("/user", auth(), admin(), handler.AdminCreateUser)
	adminAPI.PUT("/user", auth(), admin(), handler.AdminUpdateUser)
	adminAPI.PUT("/user_admin", auth(), admin(), handler.AdminUpdateUserAdmin)
	adminAPI.DELETE("/user", auth(), admin(), handler.AdminDeleteUser)
	adminAPI.GET("/dashboard", auth(), admin(), handler.AdminGetDashboard)
	adminAPI.GET("/user_list", auth(), admin(), handler.AdminGetUserList)
	adminAPI.GET("/music", auth(), admin(), handler.AdminGetMusic)
	adminAPI.POST("/music", auth(), admin(), handler.AdminCreateMusic)
	adminAPI.PUT("/music", auth(), admin(), handler.AdminUpdateMusic)
	adminAPI.DELETE("/music", auth(), admin(), handler.AdminDeleteMusic)
	adminAPI.GET("/music_list", auth(), admin(), handler.AdminGetMusicList)
	adminAPI.GET("/artist_list", auth(), admin(), handler.AdminGetArtistList)
	adminAPI.GET("/artist", auth(), admin(), handler.AdminGetArtist)
	adminAPI.POST("/artist", auth(), admin(), handler.AdminCreateArtist)
	adminAPI.PUT("/artist", auth(), admin(), handler.AdminUpdateArtist)
	adminAPI.DELETE("/artist", auth(), admin(), handler.AdminDeleteArtist)
	adminAPI.POST("/artist/photo", auth(), admin(), handler.AdminCreateArtistPhoto)
	adminAPI.PUT("/artist/photo", auth(), admin(), handler.AdminUpdateArtistPhoto)
	adminAPI.DELETE("/artist/photo", auth(), admin(), handler.AdminDeleteArtistPhoto)
	adminAPI.PUT("/artist/photo/order", auth(), admin(), handler.AdminReorderArtistPhotos)

	return r
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, HEAD, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Content-Range, x-cicada-token")
		c.Header("Access-Control-Max-Age", "86400")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}
