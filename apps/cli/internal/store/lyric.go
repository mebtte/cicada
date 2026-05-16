package store

import (
	"regexp"
	"strings"
)

type Lyric struct {
	ID         int64
	MusicID    string
	LRC        string
	LRCContent string
}

var leadingLRCTagRE = regexp.MustCompile(`^\s*\[[^\]\r\n]*\]`)

func GetLyricsByMusicID(musicID string) ([]Lyric, error) {
	rows, err := DB().Query(`SELECT id,musicId,lrc,lrcContent FROM lyric WHERE musicId=? ORDER BY id`, musicID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Lyric
	for rows.Next() {
		l := Lyric{}
		if err := rows.Scan(&l.ID, &l.MusicID, &l.LRC, &l.LRCContent); err != nil {
			return nil, err
		}
		out = append(out, l)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return out, nil
}

func UpdateLyricsByMusicID(musicID string, lrcs []string) error {
	tx, err := DB().Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`DELETE FROM lyric WHERE musicId=?`, musicID); err != nil {
		return err
	}
	for _, lrc := range lrcs {
		if _, err := tx.Exec(
			`INSERT INTO lyric (musicId,lrc,lrcContent) VALUES (?,?,?)`,
			musicID,
			lrc,
			LRCContent(lrc),
		); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func LRCContent(lrc string) string {
	lines := strings.Split(lrc, "\n")
	contents := make([]string, 0, len(lines))
	for _, line := range lines {
		line = strings.TrimSpace(line)
		for {
			next := leadingLRCTagRE.ReplaceAllString(line, "")
			if next == line {
				break
			}
			line = strings.TrimSpace(next)
		}
		if line != "" {
			contents = append(contents, line)
		}
	}
	return strings.Join(contents, "\n")
}

func SearchMusicIDsByLyric(keyword string, page, pageSize int) (int, []string, error) {
	pat := "%" + keyword + "%"
	var total int
	DB().QueryRow(`SELECT COUNT(DISTINCT musicId) FROM lyric WHERE lrcContent LIKE ?`, pat).Scan(&total)
	rows, err := DB().Query(
		`SELECT DISTINCT musicId FROM lyric WHERE lrcContent LIKE ? LIMIT ? OFFSET ?`,
		pat, pageSize, (page-1)*pageSize,
	)
	if err != nil {
		return 0, nil, err
	}
	defer rows.Close()
	var ids []string
	for rows.Next() {
		var id string
		rows.Scan(&id)
		ids = append(ids, id)
	}
	return total, ids, nil
}
