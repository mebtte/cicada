package store

import (
	"database/sql"
	"fmt"
	"sort"
	"strings"
	"time"
)

const (
	maxCreateMusicIDAttempts = 20
)

type MusicType int

const (
	// Keep these values aligned with the existing database and TypeScript clients.
	MusicTypeSong         MusicType = 1
	MusicTypeInstrumental MusicType = 2
)

func (t MusicType) Valid() bool {
	return t == MusicTypeSong || t == MusicTypeInstrumental
}

type MusicArtistRole string

const (
	MusicArtistRolePerformer MusicArtistRole = "performer"
	MusicArtistRoleLyricist  MusicArtistRole = "lyricist"
	MusicArtistRoleComposer  MusicArtistRole = "composer"
)

func (r MusicArtistRole) Valid() bool {
	return r == MusicArtistRolePerformer ||
		r == MusicArtistRoleLyricist ||
		r == MusicArtistRoleComposer
}

type Music struct {
	ID              string
	Type            MusicType
	Name            string
	Aliases         string
	SearchKeywords  string
	Cover           string
	CoverThumbnail  string
	Asset           string
	Heat            int64
	CreateTimestamp int64
	Year            sql.NullInt64
	AssetSize       int64
	AssetDurationMs int64
	AssetCodec      string
	AssetBitRate    int64
}

// ArtistInMusic is returned when querying artists that belong to a music track.
type ArtistInMusic struct {
	MusicID string
	ID      string
	Name    string
	Aliases string
}

type MusicFork struct {
	MusicID  string
	ForkFrom string
}

const (
	musicSelectColumns          = `id,type,name,aliases,searchKeywords,cover,coverThumbnail,asset,heat,createTimestamp,year,assetSize,assetDurationMs,assetCodec,assetBitRate`
	musicSelectColumnsWithAlias = `m.id,m.type,m.name,m.aliases,m.searchKeywords,m.cover,m.coverThumbnail,m.asset,m.heat,m.createTimestamp,m.year,m.assetSize,m.assetDurationMs,m.assetCodec,m.assetBitRate`
)

func GetMusicByID(id string) (*Music, error) {
	m := &Music{}
	err := DB().QueryRow(
		`SELECT `+musicSelectColumns+` FROM music WHERE id=?`, id,
	).Scan(scanMusicDest(m)...)
	if err != nil {
		return nil, err
	}
	return m, nil
}

// GetRandomMusic 随机返回一首音乐, 用于电台模式.
// 排除参数 excludeID 对应的音乐, 避免连续推荐同一首; 传空串表示不排除.
func GetRandomMusic(excludeID string) (*Music, error) {
	m := &Music{}
	q := `SELECT ` + musicSelectColumns + ` FROM music`
	args := []any{}
	if excludeID != "" {
		q += ` WHERE id!=?`
		args = append(args, excludeID)
	}
	q += ` ORDER BY RANDOM() LIMIT 1`
	err := DB().QueryRow(q, args...).Scan(scanMusicDest(m)...)
	if err != nil {
		return nil, err
	}
	return m, nil
}

func GetMusicsByIDs(ids []string) ([]Music, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	q := `SELECT ` + musicSelectColumns + ` FROM music WHERE id IN (` + placeholders(len(ids)) + `)`
	rows, err := DB().Query(q, strs2any(ids)...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Music
	for rows.Next() {
		m := Music{}
		if err := rows.Scan(scanMusicDest(&m)...); err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	// WHERE IN 不保证返回顺序; 搜索/关联结果需要保持调用方传入的排序。
	order := make(map[string]int, len(ids))
	for i, id := range ids {
		order[id] = i
	}
	sort.SliceStable(out, func(i, j int) bool {
		return order[out[i].ID] < order[out[j].ID]
	})
	return out, nil
}

func CreateMusic(name string, t MusicType, asset string) (string, error) {
	for range maxCreateMusicIDAttempts {
		id, err := generatePublicID()
		if err != nil {
			return "", err
		}

		// Short public IDs can theoretically collide, so insert atomically and retry on conflict.
		result, err := DB().Exec(
			`INSERT OR IGNORE INTO music (id,type,name,asset,createTimestamp) VALUES (?,?,?,?,?)`,
			id, int(t), name, asset, time.Now().UnixMilli(),
		)
		if err != nil {
			return "", err
		}
		affected, err := result.RowsAffected()
		if err != nil {
			return "", err
		}
		if affected > 0 {
			return id, nil
		}
	}
	return "", fmt.Errorf("create music: exhausted %d id generation attempts", maxCreateMusicIDAttempts)
}

func UpdateMusic(id, field string, value any) error {
	_, err := DB().Exec(`UPDATE music SET `+field+`=? WHERE id=?`, value, id)
	return err
}

func UpdateMusicCover(id, cover, coverThumbnail string) error {
	_, err := DB().Exec(`UPDATE music SET cover=?,coverThumbnail=? WHERE id=?`, cover, coverThumbnail, id)
	return err
}

func UpdateMusicAssetInfo(id string, size, durationMs int64, codec string, bitRate int64) error {
	_, err := DB().Exec(
		`UPDATE music SET assetSize=?, assetDurationMs=?, assetCodec=?, assetBitRate=? WHERE id=?`,
		size, durationMs, codec, bitRate, id,
	)
	return err
}

func DeleteMusicCascade(id string, isSong bool) error {
	tx, err := DB().Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if isSong {
		tx.Exec(`DELETE FROM lyric WHERE musicId=?`, id)
	}
	for _, del := range []string{
		`DELETE FROM music_fork WHERE musicId=?`,
		`DELETE FROM music_play_record WHERE musicId=?`,
		`DELETE FROM music_artist_relation WHERE musicId=?`,
		`DELETE FROM musicbill_music WHERE musicId=?`,
		`DELETE FROM music WHERE id=?`,
	} {
		if _, err := tx.Exec(del, id); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func GetMusicForks(musicID string) ([]MusicFork, error) {
	rows, err := DB().Query(`SELECT musicId,forkFrom FROM music_fork WHERE forkFrom=?`, musicID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []MusicFork
	for rows.Next() {
		f := MusicFork{}
		rows.Scan(&f.MusicID, &f.ForkFrom)
		out = append(out, f)
	}
	return out, nil
}

func GetMusicForkFroms(musicID string) ([]MusicFork, error) {
	rows, err := DB().Query(`SELECT musicId,forkFrom FROM music_fork WHERE musicId=?`, musicID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []MusicFork
	for rows.Next() {
		f := MusicFork{}
		rows.Scan(&f.MusicID, &f.ForkFrom)
		out = append(out, f)
	}
	return out, nil
}

func GetArtistsInMusicIDsByRole(musicIDs []string, role MusicArtistRole) ([]ArtistInMusic, error) {
	if len(musicIDs) == 0 {
		return nil, nil
	}
	if !role.Valid() {
		return nil, fmt.Errorf("invalid music artist role %q", role)
	}

	q := `SELECT mar.musicId,a.id,a.name,a.aliases
		FROM music_artist_relation mar
		JOIN artist a ON mar.artistId=a.id`
	where := ` WHERE mar.musicId IN (` + placeholders(len(musicIDs)) + `) AND mar.role=?`
	args := append(strs2any(musicIDs), string(role))
	if role == MusicArtistRoleLyricist {
		q += ` JOIN music m ON mar.musicId=m.id`
		where += ` AND m.type=?`
		args = append(args, int(MusicTypeSong))
	}
	q += where + ` ORDER BY mar.musicId, mar.position, mar.id`
	rows, err := DB().Query(q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []ArtistInMusic
	for rows.Next() {
		a := ArtistInMusic{}
		rows.Scan(&a.MusicID, &a.ID, &a.Name, &a.Aliases)
		out = append(out, a)
	}
	return out, nil
}

func ArtistsExist(ids []string) (bool, error) {
	if len(ids) == 0 {
		return true, nil
	}
	var count int
	err := DB().QueryRow(`SELECT COUNT(1) FROM artist WHERE id IN (`+placeholders(len(ids))+`)`, strs2any(ids)...).Scan(&count)
	return count == len(ids), err
}

func GetMusicsByArtistIDAndRole(artistID string, role MusicArtistRole) ([]Music, error) {
	if !role.Valid() {
		return nil, fmt.Errorf("invalid music artist role %q", role)
	}
	q := `SELECT ` + musicSelectColumnsWithAlias + `
		FROM music_artist_relation mar JOIN music m ON mar.musicId=m.id
		WHERE mar.artistId=? AND mar.role=?`
	args := []any{artistID, string(role)}
	if role == MusicArtistRoleLyricist {
		q += ` AND m.type=?`
		args = append(args, int(MusicTypeSong))
	}
	q += ` ORDER BY m.heat DESC, m.createTimestamp DESC`
	rows, err := DB().Query(q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanMusicRows(rows)
}

func ReplaceMusicArtistsByRole(musicID string, role MusicArtistRole, artistIDs []string) error {
	if !role.Valid() {
		return fmt.Errorf("invalid music artist role %q", role)
	}
	tx, err := DB().Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err := tx.Exec(`DELETE FROM music_artist_relation WHERE musicId=? AND role=?`, musicID, string(role)); err != nil {
		return err
	}
	if len(artistIDs) == 0 {
		return tx.Commit()
	}

	pairs := strings.Repeat("(?,?,?,?),", len(artistIDs))
	args := make([]any, 0, len(artistIDs)*4)
	for position, artistID := range artistIDs {
		args = append(args, musicID, artistID, string(role), position)
	}
	if _, err := tx.Exec(
		`INSERT OR REPLACE INTO music_artist_relation (musicId,artistId,role,position) VALUES `+pairs[:len(pairs)-1],
		args...,
	); err != nil {
		return err
	}
	return tx.Commit()
}

func GetAllMusic() ([]Music, error) {
	rows, err := DB().Query(`SELECT ` + musicSelectColumns + ` FROM music ORDER BY createTimestamp ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanMusicRows(rows)
}

// SearchMusic searches across all users by name/alias/search keywords/artist (paginated).
func SearchMusic(keyword string, page, pageSize int) (int, []Music, error) {
	keyword = strings.TrimSpace(keyword)
	if keyword == "" {
		return 0, []Music{}, nil
	}
	pat := containsLikePattern(keyword)
	prefixPat := prefixLikePattern(keyword)
	where := `WHERE m.name LIKE ? ESCAPE '\' OR m.aliases LIKE ? ESCAPE '\' OR m.searchKeywords LIKE ? ESCAPE '\'
		OR EXISTS (
			SELECT 1
			FROM music_artist_relation mar
			JOIN artist a ON mar.artistId=a.id
			WHERE mar.musicId=m.id
				AND (mar.role!='lyricist' OR m.type=1)
				AND (
					a.name LIKE ? ESCAPE '\'
					OR a.aliases LIKE ? ESCAPE '\'
					OR a.searchKeywords LIKE ? ESCAPE '\'
				)
			)`
	var total int
	if err := DB().QueryRow(`SELECT COUNT(1) FROM music m `+where, pat, pat, pat, pat, pat, pat).Scan(&total); err != nil {
		return 0, nil, err
	}
	rows, err := DB().Query(
		`SELECT `+musicSelectColumnsWithAlias+`
		FROM music m `+where+`
		ORDER BY
			CASE
				WHEN m.name = ? COLLATE NOCASE THEN 100
				WHEN m.name LIKE ? ESCAPE '\' THEN 90
				WHEN m.aliases LIKE ? ESCAPE '\' THEN 80
				WHEN m.searchKeywords LIKE ? ESCAPE '\' THEN 75
				WHEN EXISTS (
					SELECT 1
					FROM music_artist_relation mar
					JOIN artist p ON mar.artistId=p.id
					WHERE mar.musicId=m.id AND mar.role='performer' AND p.name = ? COLLATE NOCASE
				) THEN 70
				WHEN EXISTS (
					SELECT 1
					FROM music_artist_relation mar
					JOIN artist p ON mar.artistId=p.id
					WHERE mar.musicId=m.id AND mar.role='performer' AND p.name LIKE ? ESCAPE '\'
				) THEN 60
					WHEN EXISTS (
						SELECT 1
						FROM music_artist_relation mar
						JOIN artist p ON mar.artistId=p.id
						WHERE mar.musicId=m.id AND mar.role='performer' AND p.aliases LIKE ? ESCAPE '\'
					) THEN 50
					WHEN EXISTS (
						SELECT 1
						FROM music_artist_relation mar
						JOIN artist p ON mar.artistId=p.id
						WHERE mar.musicId=m.id AND mar.role='performer' AND p.searchKeywords LIKE ? ESCAPE '\'
					) THEN 45
					WHEN m.type=1 AND EXISTS (
						SELECT 1
						FROM music_artist_relation mar
						JOIN artist a ON mar.artistId=a.id
						WHERE mar.musicId=m.id AND mar.role='lyricist' AND a.name = ? COLLATE NOCASE
					) THEN 42
					WHEN m.type=1 AND EXISTS (
						SELECT 1
						FROM music_artist_relation mar
						JOIN artist a ON mar.artistId=a.id
						WHERE mar.musicId=m.id AND mar.role='lyricist' AND a.name LIKE ? ESCAPE '\'
					) THEN 38
					WHEN m.type=1 AND EXISTS (
						SELECT 1
						FROM music_artist_relation mar
						JOIN artist a ON mar.artistId=a.id
						WHERE mar.musicId=m.id AND mar.role='lyricist' AND a.aliases LIKE ? ESCAPE '\'
					) THEN 34
					WHEN m.type=1 AND EXISTS (
						SELECT 1
						FROM music_artist_relation mar
						JOIN artist a ON mar.artistId=a.id
						WHERE mar.musicId=m.id AND mar.role='lyricist' AND a.searchKeywords LIKE ? ESCAPE '\'
					) THEN 30
				WHEN EXISTS (
					SELECT 1
					FROM music_artist_relation mar
					JOIN artist c ON mar.artistId=c.id
					WHERE mar.musicId=m.id AND mar.role='composer' AND c.name = ? COLLATE NOCASE
				) THEN 28
				WHEN EXISTS (
					SELECT 1
					FROM music_artist_relation mar
					JOIN artist c ON mar.artistId=c.id
					WHERE mar.musicId=m.id AND mar.role='composer' AND c.name LIKE ? ESCAPE '\'
				) THEN 24
				WHEN EXISTS (
					SELECT 1
					FROM music_artist_relation mar
					JOIN artist c ON mar.artistId=c.id
					WHERE mar.musicId=m.id AND mar.role='composer' AND c.aliases LIKE ? ESCAPE '\'
				) THEN 20
				WHEN EXISTS (
					SELECT 1
					FROM music_artist_relation mar
					JOIN artist c ON mar.artistId=c.id
					WHERE mar.musicId=m.id AND mar.role='composer' AND c.searchKeywords LIKE ? ESCAPE '\'
				) THEN 16
				ELSE 40
			END DESC,
			m.heat DESC,
			m.createTimestamp DESC,
			m.id ASC
		LIMIT ? OFFSET ?`,
		pat, pat, pat, pat, pat, pat,
		keyword, prefixPat, pat, pat, keyword, prefixPat, pat, pat, keyword, prefixPat, pat, pat, keyword, prefixPat, pat, pat,
		pageSize, (page-1)*pageSize,
	)
	if err != nil {
		return 0, nil, err
	}
	defer rows.Close()
	musics, err2 := scanMusicRows(rows)
	return total, musics, err2
}

func GetAdminMusicList(keyword, filterKey, sortBy, sortOrder string, page, pageSize int) (int, []Music, error) {
	where := ""
	args := []any{}
	trimmedKeyword := strings.TrimSpace(keyword)
	if trimmedKeyword != "" {
		pattern := "%" + trimmedKeyword + "%"
		artistExists := `(EXISTS (
			SELECT 1
			FROM music_artist_relation mar
			JOIN artist a ON mar.artistId=a.id
			WHERE mar.musicId=m.id
				AND (mar.role!='lyricist' OR m.type=1)
				AND (a.id LIKE ? OR a.name LIKE ? OR a.aliases LIKE ? OR a.searchKeywords LIKE ?)
		))`
		switch filterKey {
		case "id":
			where = " WHERE m.id LIKE ?"
			args = append(args, pattern)
		case "name":
			where = " WHERE m.name LIKE ?"
			args = append(args, pattern)
		case "alias":
			where = " WHERE m.aliases LIKE ?"
			args = append(args, pattern)
		case "artist":
			where = " WHERE " + artistExists
			args = append(args, pattern, pattern, pattern, pattern)
		default:
			where = " WHERE m.id LIKE ? OR m.name LIKE ? OR m.aliases LIKE ? OR m.searchKeywords LIKE ? OR " + artistExists
			args = append(args, pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern)
		}
	}

	var total int
	if err := DB().QueryRow(`SELECT COUNT(1) FROM music m`+where, args...).Scan(&total); err != nil {
		return 0, nil, err
	}

	direction := "DESC"
	if sortOrder == "asc" {
		direction = "ASC"
	}
	orderColumn := "m.createTimestamp"
	if sortBy == "heat" {
		orderColumn = "m.heat"
	}
	orderBy := orderColumn + " " + direction + ", m.id DESC"

	listArgs := append([]any{}, args...)
	listArgs = append(listArgs, pageSize, (page-1)*pageSize)
	rows, err := DB().Query(
		`SELECT `+musicSelectColumnsWithAlias+`
		FROM music m`+where+`
		ORDER BY `+orderBy+`
		LIMIT ? OFFSET ?`,
		listArgs...,
	)
	if err != nil {
		return 0, nil, err
	}
	defer rows.Close()
	musics, err := scanMusicRows(rows)
	if err != nil {
		return 0, nil, err
	}
	return total, musics, nil
}

func scanMusicRows(rows *sql.Rows) ([]Music, error) {
	var out []Music
	for rows.Next() {
		m := Music{}
		if err := rows.Scan(scanMusicDest(&m)...); err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	return out, rows.Err()
}

func scanMusicDest(m *Music) []any {
	return []any{
		&m.ID,
		&m.Type,
		&m.Name,
		&m.Aliases,
		&m.SearchKeywords,
		&m.Cover,
		&m.CoverThumbnail,
		&m.Asset,
		&m.Heat,
		&m.CreateTimestamp,
		&m.Year,
		&m.AssetSize,
		&m.AssetDurationMs,
		&m.AssetCodec,
		&m.AssetBitRate,
	}
}

// helpers
func placeholders(n int) string {
	return strings.TrimRight(strings.Repeat("?,", n), ",")
}

func strs2any(s []string) []any {
	a := make([]any, len(s))
	for i, v := range s {
		a[i] = v
	}
	return a
}
