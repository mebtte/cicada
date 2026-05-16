package handler

import (
	"cicada/internal/api"
	"cicada/internal/api/apperr"
	"cicada/internal/store"
	"time"

	"github.com/gin-gonic/gin"
)

func AdminGetDashboard(c *gin.Context) {
	now := time.Now()
	summary, err := store.GetAdminDashboardSummary(now)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}

	api.OK(c, gin.H{
		"generatedTimestamp": now.UnixMilli(),
		"todayPlayCount":     summary.TodayPlayCount,
		"playCount7d":        summary.PlayCount7d,
		"music": gin.H{
			"total":             summary.Music.Total,
			"totalAssetSize":    summary.Music.TotalAssetSize,
			"totalDurationMs":   summary.Music.TotalDurationMs,
			"created7d":         summary.Music.Created7d,
			"withoutCoverCount": summary.Music.WithoutCoverCount,
		},
		"singer": gin.H{
			"total":             summary.Singer.Total,
			"created7d":         summary.Singer.Created7d,
			"photoCount":        summary.Singer.PhotoCount,
			"withoutPhotoCount": summary.Singer.WithoutPhotoCount,
		},
		"user": gin.H{
			"total":             summary.User.Total,
			"adminCount":        summary.User.AdminCount,
			"activeUser7dCount": summary.User.ActiveUser7dCount,
		},
		"musicbill": gin.H{
			"total":  summary.Musicbill.Total,
			"public": summary.Musicbill.Public,
			"shared": summary.Musicbill.Shared,
		},
	})
}
