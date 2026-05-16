package store

import (
	"database/sql"
	"errors"
)

var ErrPlayRecordClientIDConflict = errors.New("play record client id conflicts with another music")

type PlayRecord struct {
	ID        int64
	UserID    string
	MusicID   string
	ClientID  string
	Percent   float64
	Timestamp int64
	// Joined fields
	MusicName    string
	MusicAliases string
	MusicCover   string
	MusicAsset   string
	MusicType    MusicType
}

func GetPlayRecords(userID string, page, pageSize int) (int, []PlayRecord, error) {
	var total int
	DB().QueryRow(`SELECT COUNT(1) FROM music_play_record WHERE userId=?`, userID).Scan(&total)
	rows, err := DB().Query(
		`SELECT pr.id,pr.userId,pr.musicId,pr.percent,pr.timestamp,m.name,m.aliases,m.cover,m.asset,m.type
		FROM music_play_record pr JOIN music m ON pr.musicId=m.id
		WHERE pr.userId=? ORDER BY pr.timestamp DESC LIMIT ? OFFSET ?`,
		userID, pageSize, (page-1)*pageSize,
	)
	if err != nil {
		return 0, nil, err
	}
	defer rows.Close()
	var out []PlayRecord
	for rows.Next() {
		r := PlayRecord{}
		rows.Scan(&r.ID, &r.UserID, &r.MusicID, &r.Percent, &r.Timestamp,
			&r.MusicName, &r.MusicAliases, &r.MusicCover, &r.MusicAsset, &r.MusicType)
		out = append(out, r)
	}
	return total, out, nil
}

func DeletePlayRecord(id int64, userID string) (bool, error) {
	res, err := DB().Exec(`DELETE FROM music_play_record WHERE id=? AND userId=?`, id, userID)
	if err != nil {
		return false, err
	}
	n, _ := res.RowsAffected()
	return n > 0, nil
}

func AddPlayRecord(userID, musicID string, percent float64) {
	DB().Exec(`INSERT INTO music_play_record (userId,musicId,percent,timestamp) VALUES (?,?,?,?)`,
		userID, musicID, percent, nowMs())
}

func SavePlayRecord(userID, musicID, clientRecordID string, percent, effectivePercent float64) error {
	tx, err := DB().Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	heatCounted := percent >= effectivePercent
	now := nowMs()
	if clientRecordID == "" {
		if _, err := tx.Exec(
			`INSERT INTO music_play_record (userId,musicId,percent,timestamp,heatCounted) VALUES (?,?,?,?,?)`,
			userID, musicID, percent, now, boolInt(heatCounted),
		); err != nil {
			return err
		}
		if heatCounted {
			if _, err := tx.Exec(`UPDATE music SET heat=heat+1 WHERE id=?`, musicID); err != nil {
				return err
			}
		}
		return tx.Commit()
	}

	var existing struct {
		ID          int64
		MusicID     string
		Percent     float64
		HeatCounted int
	}
	err = tx.QueryRow(
		`SELECT id,musicId,percent,heatCounted FROM music_play_record WHERE userId=? AND clientRecordId=?`,
		userID, clientRecordID,
	).Scan(&existing.ID, &existing.MusicID, &existing.Percent, &existing.HeatCounted)
	if errors.Is(err, sql.ErrNoRows) {
		if _, err := tx.Exec(
			`INSERT INTO music_play_record (userId,musicId,clientRecordId,percent,timestamp,heatCounted) VALUES (?,?,?,?,?,?)`,
			userID, musicID, clientRecordID, percent, now, boolInt(heatCounted),
		); err != nil {
			return err
		}
		if heatCounted {
			if _, err := tx.Exec(`UPDATE music SET heat=heat+1 WHERE id=?`, musicID); err != nil {
				return err
			}
		}
		return tx.Commit()
	}
	if err != nil {
		return err
	}
	if existing.MusicID != musicID {
		return ErrPlayRecordClientIDConflict
	}

	nextPercent := max(existing.Percent, percent)
	nextHeatCounted := existing.HeatCounted == 1
	if !nextHeatCounted && nextPercent >= effectivePercent {
		nextHeatCounted = true
		if _, err := tx.Exec(`UPDATE music SET heat=heat+1 WHERE id=?`, musicID); err != nil {
			return err
		}
	}
	if _, err := tx.Exec(
		`UPDATE music_play_record SET percent=?, timestamp=?, heatCounted=? WHERE id=?`,
		nextPercent, now, boolInt(nextHeatCounted), existing.ID,
	); err != nil {
		return err
	}
	return tx.Commit()
}

func IncrMusicHeat(musicID string) {
	DB().Exec(`UPDATE music SET heat=heat+1 WHERE id=?`, musicID)
}

func boolInt(v bool) int {
	if v {
		return 1
	}
	return 0
}
