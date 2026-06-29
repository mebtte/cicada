package store

func GetFollowedArtistsByMusicbill(musicbillID string) ([]Artist, error) {
	rows, err := DB().Query(
		`SELECT a.id,a.name,a.aliases,a.searchKeywords,a.createTimestamp
		FROM musicbill_followed_artist mfa
		JOIN artist a ON mfa.artistId=a.id
		WHERE mfa.musicbillId=?
		ORDER BY mfa.createTimestamp DESC`,
		musicbillID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Artist
	for rows.Next() {
		a := Artist{}
		if err := rows.Scan(&a.ID, &a.Name, &a.Aliases, &a.SearchKeywords, &a.CreateTimestamp); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, nil
}

func IsMusicbillFollowingArtist(musicbillID, artistID string) (bool, error) {
	var n int
	err := DB().QueryRow(
		`SELECT COUNT(1) FROM musicbill_followed_artist WHERE musicbillId=? AND artistId=?`,
		musicbillID, artistID,
	).Scan(&n)
	return n > 0, err
}

func AddMusicbillFollowedArtist(musicbillID, artistID string) (bool, error) {
	res, err := DB().Exec(
		`INSERT INTO musicbill_followed_artist (musicbillId,artistId,createTimestamp) VALUES (?,?,?)`,
		musicbillID, artistID, nowMs(),
	)
	if err != nil {
		return false, err
	}
	n, _ := res.RowsAffected()
	return n > 0, nil
}

func RemoveMusicbillFollowedArtist(musicbillID, artistID string) (bool, error) {
	res, err := DB().Exec(
		`DELETE FROM musicbill_followed_artist WHERE musicbillId=? AND artistId=?`,
		musicbillID, artistID,
	)
	if err != nil {
		return false, err
	}
	n, _ := res.RowsAffected()
	return n > 0, nil
}

// BackfillMusicbillWithArtist 把该艺术家关联的所有音乐 (任一角色) 一次性补入乐单.
// 已存在的跳过, 不报错.
func BackfillMusicbillWithArtist(musicbillID, artistID string) (int64, error) {
	res, err := DB().Exec(
		`INSERT OR IGNORE INTO musicbill_music (musicbillId,musicId,addTimestamp)
		SELECT ?, mar.musicId, ?
		FROM music_artist_relation mar
		WHERE mar.artistId=?
		GROUP BY mar.musicId`,
		musicbillID, nowMs(), artistID,
	)
	if err != nil {
		return 0, err
	}
	n, _ := res.RowsAffected()
	return n, nil
}

// AutoAddMusicToFollowingMusicbills 把一首音乐自动加入所有关注了该音乐任一艺术家的乐单.
// 已存在的跳过, 不报错. 一条 SQL 完成.
func AutoAddMusicToFollowingMusicbills(musicID string, artistIDs []string) (int64, error) {
	if len(artistIDs) == 0 {
		return 0, nil
	}
	args := make([]any, 0, len(artistIDs)+2)
	args = append(args, musicID, nowMs())
	args = append(args, Strs2Any(artistIDs)...)
	res, err := DB().Exec(
		`INSERT OR IGNORE INTO musicbill_music (musicbillId,musicId,addTimestamp)
		SELECT DISTINCT musicbillId, ?, ?
		FROM musicbill_followed_artist
		WHERE artistId IN (`+Placeholders(len(artistIDs))+`)`,
		args...,
	)
	if err != nil {
		return 0, err
	}
	n, _ := res.RowsAffected()
	return n, nil
}
