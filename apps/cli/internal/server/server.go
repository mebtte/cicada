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
	r.Use(middleware.Recovery())
	r.Use(corsMiddleware())
	apidoc.Register(r)

	// Asset serving (no auth)
	for _, at := range config.AllAssetTypes {
		r.GET(fmt.Sprintf("/asset/%s/:filename", at), handler.ServeAsset(at))
	}

	// Form: asset upload (auth required)
	form := r.Group("/form")
	form.Use(middleware.Auth())
	form.POST("/asset", handler.UploadAsset)

	// Base routes (no auth)
	base := r.Group("/base")
	base.GET("/metadata", handler.GetMetadata)
	base.GET("/captcha", handler.GetCaptcha)
	base.POST("/login", handler.Login)
	base.POST("/login_with_2fa", handler.LoginWith2FA)
	base.POST("/music_play_record", handler.CreateMusicPlayRecordBeacon)

	// API routes (auth required)
	api := r.Group("/api")
	api.Use(middleware.Auth())

	// User / profile
	api.GET("/profile", handler.GetProfile)
	api.PUT("/profile", handler.UpdateProfile)
	api.GET("/user", handler.GetUser)

	// 2FA
	api.POST("/2fa", handler.Create2FA)
	api.PUT("/2fa", handler.Enable2FA)
	api.DELETE("/2fa", handler.Disable2FA)

	// Music
	api.GET("/music", handler.GetMusic)
	api.POST("/music", handler.CreateMusic)
	api.PUT("/music", handler.UpdateMusic)
	api.DELETE("/music", handler.DeleteMusic)
	api.GET("/music/search", handler.SearchMusic)
	api.GET("/music/search_by_lyric", handler.SearchMusicByLyric)
	api.GET("/music_list", handler.GetMusicList)

	// Singer
	api.GET("/singer", handler.GetSinger)
	api.POST("/singer", handler.CreateSinger)
	api.PUT("/singer", handler.UpdateSinger)
	api.GET("/singer/search", handler.SearchSinger)
	api.GET("/singer_modify_record_list", handler.GetSingerModifyRecordList)

	// Lyric
	api.GET("/lyric_list", handler.GetLyricList)

	// Play records
	api.GET("/music_play_record_list", handler.GetMusicPlayRecordList)
	api.DELETE("/music_play_record", handler.DeleteMusicPlayRecord)

	// Musicbill
	api.GET("/musicbill_list", handler.GetMusicbillList)
	api.GET("/musicbill", handler.GetMusicbill)
	api.POST("/musicbill", handler.CreateMusicbill)
	api.PUT("/musicbill", handler.UpdateMusicbill)
	api.DELETE("/musicbill", handler.DeleteMusicbill)
	api.POST("/musicbill_music", handler.AddMusicToMusicbill)
	api.DELETE("/musicbill_music", handler.RemoveMusicFromMusicbill)

	// Shared musicbill
	api.POST("/musicbill/shared_user", handler.AddMusicbillSharedUser)
	api.DELETE("/musicbill/shared_user", handler.DeleteMusicbillSharedUser)
	api.GET("/shared_musicbill_invitation_list", handler.GetSharedMusicbillInvitationList)
	api.PUT("/shared_musicbill_invitation", handler.AcceptSharedMusicbillInvitation)

	// Public musicbill
	api.GET("/public_musicbill", handler.GetPublicMusicbill)
	api.GET("/public_musicbill/search", handler.SearchPublicMusicbill)
	api.POST("/public_musicbill/collection", handler.CollectPublicMusicbill)
	api.DELETE("/public_musicbill/collection", handler.UncollectPublicMusicbill)
	api.GET("/public_musicbill_collection_list", handler.GetPublicMusicbillCollectionList)

	// Exploration
	api.GET("/exploration", handler.GetExploration)

	// Admin
	admin := api.Group("/admin")
	admin.Use(middleware.Admin())
	admin.POST("/user", handler.AdminCreateUser)
	admin.PUT("/user", handler.AdminUpdateUser)
	admin.PUT("/user_admin", handler.AdminUpdateUserAdmin)
	admin.DELETE("/user", handler.AdminDeleteUser)
	admin.GET("/user_list", handler.AdminGetUserList)

	return r
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, x-cicada-token")
		c.Header("Access-Control-Max-Age", "86400")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}
