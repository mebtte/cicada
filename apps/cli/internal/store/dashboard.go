package store

import "time"

type AdminDashboardMusicSummary struct {
	Total             int
	TotalAssetSize    int64
	TotalDurationMs   int64
	Created7d         int
	WithoutCoverCount int
}

type AdminDashboardArtistSummary struct {
	Total             int
	Created7d         int
	PhotoCount        int
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
	Shared int
}

type AdminDashboardSummary struct {
	TodayPlayCount int
	PlayCount7d    int
	Music          AdminDashboardMusicSummary
	Artist         AdminDashboardArtistSummary
	User           AdminDashboardUserSummary
	Musicbill      AdminDashboardMusicbillSummary
}

func GetAdminDashboardSummary(now time.Time) (AdminDashboardSummary, error) {
	var summary AdminDashboardSummary

	// “今日播放”按服务器本地日期切分；播放时间来自客户端并在写入时做未来时间钳制。
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
		`SELECT COUNT(1) FROM music_play_record WHERE playedAt >= ?`,
		todayStart,
	).Scan(&summary.TodayPlayCount); err != nil {
		return summary, err
	}

	if err := DB().QueryRow(
		`SELECT COUNT(1) FROM music_play_record WHERE playedAt >= ?`,
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
			(SELECT COUNT(1) FROM artist_photo),
			COALESCE(SUM(CASE WHEN NOT EXISTS (
				SELECT 1 FROM artist_photo ap WHERE ap.artistId = artist.id
			) THEN 1 ELSE 0 END), 0)
		FROM artist`,
		sevenDaysAgo,
	).Scan(
		&summary.Artist.Total,
		&summary.Artist.Created7d,
		&summary.Artist.PhotoCount,
		&summary.Artist.WithoutPhotoCount,
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

	// 乐单模块只展示聚合数量；共享乐单按已接受共享的乐单去重统计。
	if err := DB().QueryRow(
		`SELECT
			COUNT(1),
			COALESCE(SUM(CASE WHEN public = 1 THEN 1 ELSE 0 END), 0),
			(
				SELECT COUNT(DISTINCT musicbillId)
				FROM shared_musicbill
				WHERE accepted = 1
			)
		FROM musicbill`,
	).Scan(
		&summary.Musicbill.Total,
		&summary.Musicbill.Public,
		&summary.Musicbill.Shared,
	); err != nil {
		return summary, err
	}

	return summary, nil
}
