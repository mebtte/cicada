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

	// Asset upload
	api.POST("/asset", auth(), handler.UploadAsset)
	api.POST("/asset/upload", auth(), handler.InitPartialUpload)
	api.GET("/asset/upload/:uploadId", auth(), handler.GetPartialUpload)
	api.PUT("/asset/upload/:uploadId", auth(), handler.PutPartialUploadChunk)
	api.POST("/asset/upload/:uploadId/complete", auth(), handler.CompletePartialUpload)

	// Base routes (public)
	base := r.Group("/base")
	base.GET("/metadata", handler.GetMetadata)
	base.GET("/captcha", handler.GetCaptcha)
	base.POST("/login", handler.Login)
	base.POST("/login_with_2fa", handler.LoginWith2FA)

	// API routes

	// User / profile
	api.GET("/profile", auth(), handler.GetProfile)
	api.PUT("/profile", auth(), handler.UpdateProfile)
	api.GET("/user", auth(), handler.GetUser)

	// 2FA
	api.POST("/2fa", auth(), handler.Create2FA)
	api.PUT("/2fa", auth(), handler.Enable2FA)
	api.DELETE("/2fa", auth(), handler.Disable2FA)

	// Auth sessions
	api.GET("/sessions", auth(), handler.GetSessionList)
	api.PUT("/sessions/:id", auth(), handler.UpdateSession)
	api.DELETE("/sessions/:id", auth(), handler.DeleteSession)

	// Music
	api.GET("/music", auth(), handler.GetMusic)
	api.GET("/music/search", auth(), handler.SearchMusic)
	api.GET("/music/search_by_lyric", auth(), handler.SearchMusicByLyric)
	api.GET("/music/random", auth(), handler.GetRandomMusic)

	// Artist (read)
	api.GET("/artist", auth(), handler.GetArtist)
	api.GET("/artist/search", auth(), handler.SearchArtist)

	// Lyric
	api.GET("/lyric_list", auth(), handler.GetLyricList)

	// Play records
	api.POST("/music_play_record", auth(), handler.CreateMusicPlayRecord)
	api.GET("/music_play_record_list", auth(), handler.GetMusicPlayRecordList)
	api.DELETE("/music_play_record", auth(), handler.DeleteMusicPlayRecord)

	// Musicbill
	api.GET("/musicbill_list", auth(), handler.GetMusicbillList)
	api.GET("/musicbill", auth(), handler.GetMusicbill)
	api.POST("/musicbill", auth(), handler.CreateMusicbill)
	api.PUT("/musicbill", auth(), handler.UpdateMusicbill)
	api.DELETE("/musicbill", auth(), handler.DeleteMusicbill)
	api.POST("/musicbill_music", auth(), handler.AddMusicToMusicbill)
	api.DELETE("/musicbill_music", auth(), handler.RemoveMusicFromMusicbill)
	api.GET("/musicbill/followed_artist", auth(), handler.GetMusicbillFollowedArtistList)
	api.POST("/musicbill/followed_artist", auth(), handler.AddMusicbillFollowedArtist)
	api.DELETE("/musicbill/followed_artist", auth(), handler.DeleteMusicbillFollowedArtist)

	// Shared musicbill
	api.POST("/musicbill/shared_user", auth(), handler.AddMusicbillSharedUser)
	api.DELETE("/musicbill/shared_user", auth(), handler.DeleteMusicbillSharedUser)
	api.PUT("/musicbill/owner", auth(), handler.TransferMusicbillOwner)
	api.GET("/shared_musicbill_invitation_list", auth(), handler.GetSharedMusicbillInvitationList)
	api.PUT("/shared_musicbill_invitation", auth(), handler.AcceptSharedMusicbillInvitation)

	// Public musicbill
	api.GET("/public_musicbill", auth(), handler.GetPublicMusicbill)
	api.GET("/public_musicbill/search", auth(), handler.SearchPublicMusicbill)
	api.POST("/public_musicbill/collection", auth(), handler.CollectPublicMusicbill)
	api.DELETE("/public_musicbill/collection", auth(), handler.UncollectPublicMusicbill)
	api.GET("/public_musicbill_collection_list", auth(), handler.GetPublicMusicbillCollectionList)

	// Exploration
	api.GET("/exploration", auth(), handler.GetExploration)

	// Admin (auth + admin on every route)
	api.POST("/admin/user", auth(), admin(), handler.AdminCreateUser)
	api.PUT("/admin/user", auth(), admin(), handler.AdminUpdateUser)
	api.PUT("/admin/user_admin", auth(), admin(), handler.AdminUpdateUserAdmin)
	api.DELETE("/admin/user", auth(), admin(), handler.AdminDeleteUser)
	api.GET("/admin/dashboard", auth(), admin(), handler.AdminGetDashboard)
	api.GET("/admin/user_list", auth(), admin(), handler.AdminGetUserList)
	api.GET("/admin/music", auth(), admin(), handler.AdminGetMusic)
	api.POST("/admin/music", auth(), admin(), handler.AdminCreateMusic)
	api.PUT("/admin/music", auth(), admin(), handler.AdminUpdateMusic)
	api.DELETE("/admin/music", auth(), admin(), handler.AdminDeleteMusic)
	api.GET("/admin/music_list", auth(), admin(), handler.AdminGetMusicList)
	api.GET("/admin/artist_list", auth(), admin(), handler.AdminGetArtistList)
	api.GET("/admin/artist", auth(), admin(), handler.AdminGetArtist)
	api.POST("/admin/artist", auth(), admin(), handler.AdminCreateArtist)
	api.PUT("/admin/artist", auth(), admin(), handler.AdminUpdateArtist)
	api.DELETE("/admin/artist", auth(), admin(), handler.AdminDeleteArtist)
	api.POST("/admin/artist/photo", auth(), admin(), handler.AdminCreateArtistPhoto)
	api.PUT("/admin/artist/photo", auth(), admin(), handler.AdminUpdateArtistPhoto)
	api.DELETE("/admin/artist/photo", auth(), admin(), handler.AdminDeleteArtistPhoto)
	api.PUT("/admin/artist/photo/order", auth(), admin(), handler.AdminReorderArtistPhotos)

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
