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

	// Form: asset upload
	form := r.Group("/form")
	form.POST("/asset", auth(), handler.UploadAsset)

	// Base routes (public)
	base := r.Group("/base")
	base.GET("/metadata", handler.GetMetadata)
	base.GET("/captcha", handler.GetCaptcha)
	base.POST("/login", handler.Login)
	base.POST("/login_with_2fa", handler.LoginWith2FA)
	base.POST("/music_play_record", handler.CreateMusicPlayRecordBeacon)

	// API routes
	api := r.Group("/api")

	// User / profile
	api.GET("/profile", auth(), handler.GetProfile)
	api.PUT("/profile", auth(), handler.UpdateProfile)
	api.GET("/user", auth(), handler.GetUser)

	// 2FA
	api.POST("/2fa", auth(), handler.Create2FA)
	api.PUT("/2fa", auth(), handler.Enable2FA)
	api.DELETE("/2fa", auth(), handler.Disable2FA)

	// Music
	api.GET("/music", auth(), handler.GetMusic)
	api.POST("/music", auth(), handler.CreateMusic)
	api.PUT("/music", auth(), handler.UpdateMusic)
	api.DELETE("/music", auth(), handler.DeleteMusic)
	api.GET("/music/search", auth(), handler.SearchMusic)
	api.GET("/music/search_by_lyric", auth(), handler.SearchMusicByLyric)

	// Singer (read)
	api.GET("/singer", auth(), handler.GetSinger)
	api.GET("/singer/search", auth(), handler.SearchSinger)

	// Lyric
	api.GET("/lyric_list", auth(), handler.GetLyricList)

	// Play records
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

	// Shared musicbill
	api.POST("/musicbill/shared_user", auth(), handler.AddMusicbillSharedUser)
	api.DELETE("/musicbill/shared_user", auth(), handler.DeleteMusicbillSharedUser)
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
	api.GET("/admin/user_list", auth(), admin(), handler.AdminGetUserList)
	api.GET("/admin/singer_list", auth(), admin(), handler.AdminGetSingerList)
	api.GET("/admin/singer", auth(), admin(), handler.AdminGetSinger)
	api.POST("/admin/singer", auth(), admin(), handler.AdminCreateSinger)
	api.PUT("/admin/singer", auth(), admin(), handler.AdminUpdateSinger)
	api.POST("/admin/singer/photo", auth(), admin(), handler.AdminCreateSingerPhoto)
	api.PUT("/admin/singer/photo", auth(), admin(), handler.AdminUpdateSingerPhoto)
	api.DELETE("/admin/singer/photo", auth(), admin(), handler.AdminDeleteSingerPhoto)
	api.PUT("/admin/singer/photo/order", auth(), admin(), handler.AdminReorderSingerPhotos)

	return r
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, HEAD, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, x-cicada-token")
		c.Header("Access-Control-Max-Age", "86400")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}
