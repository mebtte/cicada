package store

import (
	"database/sql"
	"strings"
	"time"

	"github.com/google/uuid"
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

func GetMusicByID(id string) (*Music, error) {
	m := &Music{}
	err := DB().QueryRow(
		`SELECT id,type,name,aliases,cover,asset,heat,createUserId,createTimestamp,year FROM music WHERE id=?`, id,
	).Scan(&m.ID, &m.Type, &m.Name, &m.Aliases, &m.Cover, &m.Asset, &m.Heat, &m.CreateUserID, &m.CreateTimestamp, &m.Year)
	if err != nil {
		return nil, err
	}
	return m, nil
}

func GetMusicsByIDs(ids []string) ([]Music, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	q := `SELECT id,type,name,aliases,cover,asset,heat,createUserId,createTimestamp,year FROM music WHERE id IN (` + placeholders(len(ids)) + `)`
	rows, err := DB().Query(q, strs2any(ids)...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Music
	for rows.Next() {
		m := Music{}
		if err := rows.Scan(&m.ID, &m.Type, &m.Name, &m.Aliases, &m.Cover, &m.Asset, &m.Heat, &m.CreateUserID, &m.CreateTimestamp, &m.Year); err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	return out, nil
}

func CreateMusic(name string, t MusicType, createUserID, asset string) (string, error) {
	id := uuid.New().String()
	_, err := DB().Exec(
		`INSERT INTO music (id,type,name,asset,createUserId,createTimestamp) VALUES (?,?,?,?,?,?)`,
		id, int(t), name, asset, createUserID, time.Now().UnixMilli(),
	)
	return id, err
}

func UpdateMusic(id, field string, value any) error {
	_, err := DB().Exec(`UPDATE music SET `+field+`=? WHERE id=?`, value, id)
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
		`SELECT m.id,m.type,m.name,m.aliases,m.cover,m.asset,m.heat,m.createUserId,m.createTimestamp,m.year
		FROM music_singer_relation msr JOIN music m ON msr.musicId=m.id
		WHERE msr.singerId=? ORDER BY m.createTimestamp DESC`,
		singerID,
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

func CountTodayMusicByUser(userID string, dayStartMs int64) (int, error) {
	var count int
	err := DB().QueryRow(`SELECT COUNT(1) FROM music WHERE createUserId=? AND createTimestamp>?`, userID, dayStartMs).Scan(&count)
	return count, err
}

func GetAllMusic() ([]Music, error) {
	rows, err := DB().Query(`SELECT id,type,name,aliases,cover,asset,heat,createUserId,createTimestamp,year FROM music ORDER BY createTimestamp ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanMusicRows(rows)
}

// SearchMusic searches across all users by name/alias/singer (paginated).
func SearchMusic(keyword string, page, pageSize int) (int, []Music, error) {
	if keyword == "" {
		return searchMusicRandom(pageSize)
	}
	pat := "%" + keyword + "%"
	q := `SELECT id,type,name,aliases,cover,asset,heat,createUserId,createTimestamp,year FROM music
		WHERE id IN (SELECT id FROM music WHERE name LIKE ? OR aliases LIKE ?)
		   OR id IN (SELECT msr.musicId FROM music_singer_relation msr JOIN singer s ON msr.singerId=s.id WHERE s.name LIKE ? OR s.aliases LIKE ?)
		ORDER BY heat DESC LIMIT ? OFFSET ?`
	var total int
	DB().QueryRow(strings.Replace(q, "SELECT id,type,name,aliases,cover,asset,heat,createUserId,createTimestamp,year FROM music", "SELECT COUNT(1) FROM music", 1),
		pat, pat, pat, pat).Scan(&total) // rough count
	rows, err := DB().Query(q, pat, pat, pat, pat, pageSize, (page-1)*pageSize)
	if err != nil {
		return 0, nil, err
	}
	defer rows.Close()
	musics, err2 := scanMusicRows(rows)
	return total, musics, err2
}

func searchMusicRandom(pageSize int) (int, []Music, error) {
	var total int
	DB().QueryRow(`SELECT COUNT(1) FROM music`).Scan(&total)
	if total > pageSize {
		total = pageSize
	}
	rows, err := DB().Query(`SELECT id,type,name,aliases,cover,asset,heat,createUserId,createTimestamp,year FROM music ORDER BY random() LIMIT ?`, pageSize)
	if err != nil {
		return 0, nil, err
	}
	defer rows.Close()
	musics, err := scanMusicRows(rows)
	return total, musics, err
}

func scanMusicRows(rows *sql.Rows) ([]Music, error) {
	var out []Music
	for rows.Next() {
		m := Music{}
		if err := rows.Scan(&m.ID, &m.Type, &m.Name, &m.Aliases, &m.Cover, &m.Asset, &m.Heat, &m.CreateUserID, &m.CreateTimestamp, &m.Year); err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	return out, nil
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
