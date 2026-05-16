package store

import (
	"database/sql"
	"fmt"
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
	Cover           string
	Asset           string
	Heat            int64
	CreateUserID    string
	CreateTimestamp int64
	Year            sql.NullInt64
	AssetSize       int64
	AssetDurationMs int64
	AssetCodec      string
	AssetBitRate    int64
}

type AdminMusic struct {
	Music
	CreateUserUsername string
	CreateUserNickname string
}

// SingerInMusic is returned when querying singers that belong to a music track.
type SingerInMusic struct {
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
	musicSelectColumns          = `id,type,name,aliases,cover,asset,heat,createUserId,createTimestamp,year,assetSize,assetDurationMs,assetCodec,assetBitRate`
	musicSelectColumnsWithAlias = `m.id,m.type,m.name,m.aliases,m.cover,m.asset,m.heat,m.createUserId,m.createTimestamp,m.year,m.assetSize,m.assetDurationMs,m.assetCodec,m.assetBitRate`
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
	return out, nil
}

func CreateMusic(name string, t MusicType, createUserID, asset string) (string, error) {
	for range maxCreateMusicIDAttempts {
		id, err := generateShortPublicID()
		if err != nil {
			return "", err
		}

		// Short public IDs can theoretically collide, so insert atomically and retry on conflict.
		result, err := DB().Exec(
			`INSERT OR IGNORE INTO music (id,type,name,asset,createUserId,createTimestamp) VALUES (?,?,?,?,?,?)`,
			id, int(t), name, asset, createUserID, time.Now().UnixMilli(),
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

func GetSingersInMusicIDs(musicIDs []string) ([]SingerInMusic, error) {
	if len(musicIDs) == 0 {
		return nil, nil
	}
	q := `SELECT msr.musicId,s.id,s.name,s.aliases
		FROM music_singer_relation msr JOIN singer s ON msr.singerId=s.id
		WHERE msr.musicId IN (` + placeholders(len(musicIDs)) + `)`
	rows, err := DB().Query(q, strs2any(musicIDs)...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []SingerInMusic
	for rows.Next() {
		s := SingerInMusic{}
		rows.Scan(&s.MusicID, &s.ID, &s.Name, &s.Aliases)
		out = append(out, s)
	}
	return out, nil
}

func GetMusicsBySingerID(singerID string) ([]Music, error) {
	rows, err := DB().Query(
		`SELECT `+musicSelectColumnsWithAlias+`
		FROM music_singer_relation msr JOIN music m ON msr.musicId=m.id
		WHERE msr.singerId=? ORDER BY m.heat DESC, m.createTimestamp DESC`,
		singerID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanMusicRows(rows)
}

func GetMusicsByCreateUserID(userID string) ([]Music, error) {
	rows, err := DB().Query(
		`SELECT `+musicSelectColumns+`
		FROM music WHERE createUserId=? ORDER BY createTimestamp DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanMusicRows(rows)
}

func LinkMusicSingers(musicID string, singerIDs []string) error {
	if len(singerIDs) == 0 {
		return nil
	}
	pairs := strings.Repeat("(?,?),", len(singerIDs))
	args := make([]any, 0, len(singerIDs)*2)
	for _, sid := range singerIDs {
		args = append(args, musicID, sid)
	}
	_, err := DB().Exec(`INSERT OR REPLACE INTO music_singer_relation (musicId,singerId) VALUES `+pairs[:len(pairs)-1], args...)
	return err
}

func SingersExist(ids []string) (bool, error) {
	if len(ids) == 0 {
		return false, nil
	}
	var count int
	err := DB().QueryRow(`SELECT COUNT(1) FROM singer WHERE id IN (`+placeholders(len(ids))+`)`, strs2any(ids)...).Scan(&count)
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

// SearchMusic searches across all users by name/alias/singer (paginated).
func SearchMusic(keyword string, page, pageSize int) (int, []Music, error) {
	keyword = strings.TrimSpace(keyword)
	if keyword == "" {
		return 0, []Music{}, nil
	}
	pat := "%" + keyword + "%"
	where := `WHERE m.name LIKE ? OR m.aliases LIKE ?
		OR EXISTS (
			SELECT 1
			FROM music_singer_relation msr
			JOIN singer s ON msr.singerId=s.id
			WHERE msr.musicId=m.id AND (s.name LIKE ? OR s.aliases LIKE ?)
		)`
	var total int
	if err := DB().QueryRow(`SELECT COUNT(1) FROM music m `+where, pat, pat, pat, pat).Scan(&total); err != nil {
		return 0, nil, err
	}
	rows, err := DB().Query(
		`SELECT `+musicSelectColumnsWithAlias+`
		FROM music m `+where+`
		ORDER BY m.heat DESC LIMIT ? OFFSET ?`,
		pat, pat, pat, pat, pageSize, (page-1)*pageSize,
	)
	if err != nil {
		return 0, nil, err
	}
	defer rows.Close()
	musics, err2 := scanMusicRows(rows)
	return total, musics, err2
}

func GetAdminMusicList(keyword, filterKey, sortBy, sortOrder string, page, pageSize int) (int, []AdminMusic, error) {
	where := ""
	args := []any{}
	trimmedKeyword := strings.TrimSpace(keyword)
	if trimmedKeyword != "" {
		pattern := "%" + trimmedKeyword + "%"
		singerExists := `EXISTS (
			SELECT 1
			FROM music_singer_relation msr
			JOIN singer s ON msr.singerId=s.id
			WHERE msr.musicId=m.id AND (s.id LIKE ? OR s.name LIKE ? OR s.aliases LIKE ?)
		)`
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
		case "singer":
			where = " WHERE " + singerExists
			args = append(args, pattern, pattern, pattern)
		default:
			where = " WHERE m.id LIKE ? OR m.name LIKE ? OR m.aliases LIKE ? OR " + singerExists
			args = append(args, pattern, pattern, pattern, pattern, pattern, pattern)
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
		`SELECT `+musicSelectColumnsWithAlias+`,u.username,u.nickname
		FROM music m
		LEFT JOIN user u ON u.id=m.createUserId`+where+`
		ORDER BY `+orderBy+`
		LIMIT ? OFFSET ?`,
		listArgs...,
	)
	if err != nil {
		return 0, nil, err
	}
	defer rows.Close()

	var musics []AdminMusic
	for rows.Next() {
		var username sql.NullString
		var nickname sql.NullString
		m := AdminMusic{}
		if err := rows.Scan(append(scanMusicDest(&m.Music), &username, &nickname)...); err != nil {
			return 0, nil, err
		}
		m.CreateUserUsername = username.String
		m.CreateUserNickname = nickname.String
		musics = append(musics, m)
	}
	if err := rows.Err(); err != nil {
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
	return out, nil
}

func scanMusicDest(m *Music) []any {
	return []any{
		&m.ID,
		&m.Type,
		&m.Name,
		&m.Aliases,
		&m.Cover,
		&m.Asset,
		&m.Heat,
		&m.CreateUserID,
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
