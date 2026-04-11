package store

type Lyric struct {
	ID         int64
	MusicID    string
	LRC        string
	LRCContent string
}

func GetLyricsByMusicID(musicID string) ([]Lyric, error) {
	rows, err := DB().Query(`SELECT id,musicId,lrc,lrcContent FROM lyric WHERE musicId=?`, musicID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Lyric
	for rows.Next() {
		l := Lyric{}
		rows.Scan(&l.ID, &l.MusicID, &l.LRC, &l.LRCContent)
		out = append(out, l)
	}
	return out, nil
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
