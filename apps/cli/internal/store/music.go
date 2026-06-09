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
		id, err := generateShortPublicID()
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
		`DELETE FROM music_singer_relation WHERE musicId=?`,
		`DELETE FROM music_lyricist_relation WHERE musicId=?`,
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

func GetSingersInMusicIDs(musicIDs []string) ([]ArtistInMusic, error) {
	if len(musicIDs) == 0 {
		return nil, nil
	}
	q := `SELECT msr.musicId,a.id,a.name,a.aliases
		FROM music_singer_relation msr JOIN artist a ON msr.artistId=a.id
		WHERE msr.musicId IN (` + placeholders(len(musicIDs)) + `)`
	rows, err := DB().Query(q, strs2any(musicIDs)...)
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

func GetLyricistsInMusicIDs(musicIDs []string) ([]ArtistInMusic, error) {
	if len(musicIDs) == 0 {
		return nil, nil
	}
	q := `SELECT mlr.musicId,a.id,a.name,a.aliases
		FROM music_lyricist_relation mlr JOIN artist a ON mlr.artistId=a.id
		WHERE mlr.musicId IN (` + placeholders(len(musicIDs)) + `)`
	rows, err := DB().Query(q, strs2any(musicIDs)...)
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

func GetMusicsBySingerID(singerID string) ([]Music, error) {
	rows, err := DB().Query(
		`SELECT `+musicSelectColumnsWithAlias+`
		FROM music_singer_relation msr JOIN music m ON msr.musicId=m.id
		WHERE msr.artistId=? ORDER BY m.heat DESC, m.createTimestamp DESC`,
		singerID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanMusicRows(rows)
}

func GetMusicsByLyricistID(artistID string) ([]Music, error) {
	rows, err := DB().Query(
		`SELECT `+musicSelectColumnsWithAlias+`
		FROM music_lyricist_relation mlr JOIN music m ON mlr.musicId=m.id
		WHERE mlr.artistId=? ORDER BY m.heat DESC, m.createTimestamp DESC`,
		artistID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanMusicRows(rows)
}

func LinkMusicSingers(musicID string, artistIDs []string) error {
	if len(artistIDs) == 0 {
		return nil
	}
	pairs := strings.Repeat("(?,?),", len(artistIDs))
	args := make([]any, 0, len(artistIDs)*2)
	for _, artistID := range artistIDs {
		args = append(args, musicID, artistID)
	}
	_, err := DB().Exec(`INSERT OR REPLACE INTO music_singer_relation (musicId,artistId) VALUES `+pairs[:len(pairs)-1], args...)
	return err
}

func LinkMusicLyricists(musicID string, artistIDs []string) error {
	if len(artistIDs) == 0 {
		return nil
	}
	pairs := strings.Repeat("(?,?),", len(artistIDs))
	args := make([]any, 0, len(artistIDs)*2)
	for _, artistID := range artistIDs {
		args = append(args, musicID, artistID)
	}
	_, err := DB().Exec(`INSERT OR REPLACE INTO music_lyricist_relation (musicId,artistId) VALUES `+pairs[:len(pairs)-1], args...)
	return err
}

func ArtistsExist(ids []string) (bool, error) {
	if len(ids) == 0 {
		return true, nil
	}
	var count int
	err := DB().QueryRow(`SELECT COUNT(1) FROM artist WHERE id IN (`+placeholders(len(ids))+`)`, strs2any(ids)...).Scan(&count)
	return count == len(ids), err
}

func GetAllMusic() ([]Music, error) {
	rows, err := DB().Query(`SELECT ` + musicSelectColumns + ` FROM music ORDER BY createTimestamp ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanMusicRows(rows)
}

// SearchMusic searches across all users by name/alias/search keywords/singer (paginated).
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
			FROM music_singer_relation msr
			JOIN artist s ON msr.artistId=s.id
			WHERE msr.musicId=m.id AND (
				s.name LIKE ? ESCAPE '\'
				OR s.aliases LIKE ? ESCAPE '\'
				OR s.searchKeywords LIKE ? ESCAPE '\'
			)
		)
		OR EXISTS (
			SELECT 1
			FROM music_lyricist_relation mlr
			JOIN artist a ON mlr.artistId=a.id
			WHERE mlr.musicId=m.id AND (
				a.name LIKE ? ESCAPE '\'
				OR a.aliases LIKE ? ESCAPE '\'
				OR a.searchKeywords LIKE ? ESCAPE '\'
			)
		)`
	var total int
	if err := DB().QueryRow(`SELECT COUNT(1) FROM music m `+where, pat, pat, pat, pat, pat, pat, pat, pat, pat).Scan(&total); err != nil {
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
					FROM music_singer_relation msr
					JOIN artist s ON msr.artistId=s.id
					WHERE msr.musicId=m.id AND s.name = ? COLLATE NOCASE
				) THEN 70
				WHEN EXISTS (
					SELECT 1
					FROM music_singer_relation msr
					JOIN artist s ON msr.artistId=s.id
					WHERE msr.musicId=m.id AND s.name LIKE ? ESCAPE '\'
				) THEN 60
				WHEN EXISTS (
					SELECT 1
					FROM music_singer_relation msr
					JOIN artist s ON msr.artistId=s.id
					WHERE msr.musicId=m.id AND s.aliases LIKE ? ESCAPE '\'
				) THEN 50
				WHEN EXISTS (
					SELECT 1
					FROM music_singer_relation msr
					JOIN artist s ON msr.artistId=s.id
					WHERE msr.musicId=m.id AND s.searchKeywords LIKE ? ESCAPE '\'
				) THEN 45
				WHEN EXISTS (
					SELECT 1
					FROM music_lyricist_relation mlr
					JOIN artist a ON mlr.artistId=a.id
					WHERE mlr.musicId=m.id AND a.name = ? COLLATE NOCASE
				) THEN 42
				WHEN EXISTS (
					SELECT 1
					FROM music_lyricist_relation mlr
					JOIN artist a ON mlr.artistId=a.id
					WHERE mlr.musicId=m.id AND a.name LIKE ? ESCAPE '\'
				) THEN 38
				WHEN EXISTS (
					SELECT 1
					FROM music_lyricist_relation mlr
					JOIN artist a ON mlr.artistId=a.id
					WHERE mlr.musicId=m.id AND a.aliases LIKE ? ESCAPE '\'
				) THEN 34
				WHEN EXISTS (
					SELECT 1
					FROM music_lyricist_relation mlr
					JOIN artist a ON mlr.artistId=a.id
					WHERE mlr.musicId=m.id AND a.searchKeywords LIKE ? ESCAPE '\'
				) THEN 30
				ELSE 40
			END DESC,
			m.heat DESC,
			m.createTimestamp DESC,
			m.id ASC
		LIMIT ? OFFSET ?`,
		pat, pat, pat, pat, pat, pat, pat, pat, pat,
		keyword, prefixPat, pat, pat, keyword, prefixPat, pat, pat, keyword, prefixPat, pat, pat,
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
			FROM music_singer_relation msr
			JOIN artist s ON msr.artistId=s.id
			WHERE msr.musicId=m.id AND (s.id LIKE ? OR s.name LIKE ? OR s.aliases LIKE ? OR s.searchKeywords LIKE ?)
		) OR EXISTS (
			SELECT 1
			FROM music_lyricist_relation mlr
			JOIN artist a ON mlr.artistId=a.id
			WHERE mlr.musicId=m.id AND (a.id LIKE ? OR a.name LIKE ? OR a.aliases LIKE ? OR a.searchKeywords LIKE ?)
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
			args = append(args, pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern)
		default:
			where = " WHERE m.id LIKE ? OR m.name LIKE ? OR m.aliases LIKE ? OR m.searchKeywords LIKE ? OR " + artistExists
			args = append(args, pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern)
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
