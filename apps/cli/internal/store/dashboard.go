package store

import "time"

type AdminDashboardMusicSummary struct {
	Total             int
	TotalAssetSize    int64
	TotalDurationMs   int64
	Created7d         int
	WithoutCoverCount int
}

type AdminDashboardSingerSummary struct {
	Total             int
	Created7d         int
	WithoutPhotoCount int
}

type AdminDashboardUserSummary struct {
	Total             int
	AdminCount        int
	ActiveUser7dCount int
}

type AdminDashboardMusicbillSummary struct {
	Total  int
	Public int
}

type AdminDashboardSummary struct {
	TodayPlayCount int
	PlayCount7d    int
	Music          AdminDashboardMusicSummary
	Singer         AdminDashboardSingerSummary
	User           AdminDashboardUserSummary
	Musicbill      AdminDashboardMusicbillSummary
}

func GetAdminDashboardSummary(now time.Time) (AdminDashboardSummary, error) {
	var summary AdminDashboardSummary

	// “今日播放”按服务器本地日期切分，保证和服务端记录时间口径一致。
	todayStart := time.Date(
		now.Year(),
		now.Month(),
		now.Day(),
		0,
		0,
		0,
		0,
		now.Location(),
	).UnixMilli()
	sevenDaysAgo := now.AddDate(0, 0, -7).UnixMilli()

	if err := DB().QueryRow(
		`SELECT COUNT(1) FROM music_play_record WHERE timestamp >= ?`,
		todayStart,
	).Scan(&summary.TodayPlayCount); err != nil {
		return summary, err
	}

	if err := DB().QueryRow(
		`SELECT COUNT(1) FROM music_play_record WHERE timestamp >= ?`,
		sevenDaysAgo,
	).Scan(&summary.PlayCount7d); err != nil {
		return summary, err
	}

	if err := DB().QueryRow(
		`SELECT
			COUNT(1),
			COALESCE(SUM(assetSize), 0),
			COALESCE(SUM(assetDurationMs), 0),
			COALESCE(SUM(CASE WHEN createTimestamp >= ? THEN 1 ELSE 0 END), 0),
			COALESCE(SUM(CASE WHEN cover = '' THEN 1 ELSE 0 END), 0)
		FROM music`,
		sevenDaysAgo,
	).Scan(
		&summary.Music.Total,
		&summary.Music.TotalAssetSize,
		&summary.Music.TotalDurationMs,
		&summary.Music.Created7d,
		&summary.Music.WithoutCoverCount,
	); err != nil {
		return summary, err
	}

	if err := DB().QueryRow(
		`SELECT
			COUNT(1),
			COALESCE(SUM(CASE WHEN createTimestamp >= ? THEN 1 ELSE 0 END), 0),
			COALESCE(SUM(CASE WHEN NOT EXISTS (
				SELECT 1 FROM singer_photo sp WHERE sp.singerId = singer.id
			) THEN 1 ELSE 0 END), 0)
		FROM singer`,
		sevenDaysAgo,
	).Scan(
		&summary.Singer.Total,
		&summary.Singer.Created7d,
		&summary.Singer.WithoutPhotoCount,
	); err != nil {
		return summary, err
	}

	if err := DB().QueryRow(
		`SELECT
			COUNT(1),
			COALESCE(SUM(CASE WHEN admin = 1 THEN 1 ELSE 0 END), 0),
			COALESCE(SUM(CASE WHEN lastActiveTimestamp >= ? THEN 1 ELSE 0 END), 0)
		FROM user`,
		sevenDaysAgo,
	).Scan(
		&summary.User.Total,
		&summary.User.AdminCount,
		&summary.User.ActiveUser7dCount,
	); err != nil {
		return summary, err
	}

	// 乐单模块只展示总量和公开数量，避免仪表盘引入明细列表。
	if err := DB().QueryRow(
		`SELECT
			COUNT(1),
			COALESCE(SUM(CASE WHEN public = 1 THEN 1 ELSE 0 END), 0)
		FROM musicbill`,
	).Scan(
		&summary.Musicbill.Total,
		&summary.Musicbill.Public,
	); err != nil {
		return summary, err
	}

	return summary, nil
}
