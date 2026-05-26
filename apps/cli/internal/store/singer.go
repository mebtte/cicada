package store

import (
	"database/sql"
	"fmt"
	"strings"
	"time"
)

const (
	maxCreateSingerIDAttempts = 20
)

type Singer struct {
	ID              string
	Name            string
	Aliases         string
	CreateUserID    string
	CreateTimestamp int64
}

type AdminSinger struct {
	ID                 string
	Name               string
	Aliases            string
	CreateUserID       string
	CreateUserUsername string
	CreateUserNickname string
	CreateTimestamp    int64
}

func GetSingerByID(id string) (*Singer, error) {
	s := &Singer{}
	err := DB().QueryRow(
		`SELECT id,name,aliases,createUserId,createTimestamp FROM singer WHERE id=?`, id,
	).Scan(&s.ID, &s.Name, &s.Aliases, &s.CreateUserID, &s.CreateTimestamp)
	return s, err
}

func GetSingersByIDs(ids []string) ([]Singer, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	rows, err := DB().Query(
		`SELECT id,name,aliases,createUserId,createTimestamp FROM singer WHERE id IN (`+placeholders(len(ids))+`)`,
		strs2any(ids)...,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Singer
	for rows.Next() {
		s := Singer{}
		rows.Scan(&s.ID, &s.Name, &s.Aliases, &s.CreateUserID, &s.CreateTimestamp)
		out = append(out, s)
	}
	return out, nil
}

func SingerNameExists(name string) (bool, error) {
	var count int
	if err := DB().QueryRow(`SELECT COUNT(1) FROM singer WHERE name=?`, name).Scan(&count); err != nil {
		return false, err
	}
	return count > 0, nil
}

func SearchSingers(keyword string, page, pageSize int) (int, []Singer, error) {
	keyword = strings.TrimSpace(keyword)
	if keyword == "" {
		return 0, []Singer{}, nil
	}
	pat := containsLikePattern(keyword)
	prefixPat := prefixLikePattern(keyword)
	var total int
	DB().QueryRow(
		`SELECT COUNT(1) FROM singer WHERE name LIKE ? ESCAPE '\' OR aliases LIKE ? ESCAPE '\'`,
		pat, pat,
	).Scan(&total)
	rows, err := DB().Query(
		`SELECT id,name,aliases,createUserId,createTimestamp
		FROM singer
		WHERE name LIKE ? ESCAPE '\' OR aliases LIKE ? ESCAPE '\'
		ORDER BY
			CASE
				WHEN name = ? COLLATE NOCASE THEN 100
				WHEN name LIKE ? ESCAPE '\' THEN 90
				WHEN aliases LIKE ? ESCAPE '\' THEN 80
				ELSE 70
			END DESC,
			createTimestamp DESC,
			id ASC
		LIMIT ? OFFSET ?`,
		pat, pat, keyword, prefixPat, pat, pageSize, (page-1)*pageSize,
	)
	if err != nil {
		return 0, nil, err
	}
	defer rows.Close()
	var singers []Singer
	for rows.Next() {
		s := Singer{}
		rows.Scan(&s.ID, &s.Name, &s.Aliases, &s.CreateUserID, &s.CreateTimestamp)
		singers = append(singers, s)
	}
	return total, singers, nil
}

func GetMusicCountsBySingerIDs(singerIDs []string) (map[string]int, error) {
	counts := make(map[string]int, len(singerIDs))
	if len(singerIDs) == 0 {
		return counts, nil
	}

	// 批量统计搜索结果内歌手关联的音乐数量，避免逐项查询。
	rows, err := DB().Query(
		`SELECT singerId,COUNT(1)
		FROM music_singer_relation
		WHERE singerId IN (`+placeholders(len(singerIDs))+`)
		GROUP BY singerId`,
		strs2any(singerIDs)...,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var singerID string
		var count int
		if err := rows.Scan(&singerID, &count); err != nil {
			return nil, err
		}
		counts[singerID] = count
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return counts, nil
}

func GetAdminSingerList(keyword, filterKey string, page, pageSize int) (int, []AdminSinger, error) {
	where := ""
	args := []any{}
	trimmedKeyword := strings.TrimSpace(keyword)
	if trimmedKeyword != "" {
		pattern := "%" + trimmedKeyword + "%"
		switch filterKey {
		case "id":
			where = " WHERE s.id LIKE ?"
			args = append(args, pattern)
		case "name":
			where = " WHERE s.name LIKE ?"
			args = append(args, pattern)
		case "alias":
			where = " WHERE s.aliases LIKE ?"
			args = append(args, pattern)
		default:
			where = " WHERE s.id LIKE ? OR s.name LIKE ? OR s.aliases LIKE ?"
			args = append(args, pattern, pattern, pattern)
		}
	}

	var total int
	if err := DB().QueryRow(`SELECT COUNT(1) FROM singer s`+where, args...).Scan(&total); err != nil {
		return 0, nil, err
	}

	listArgs := append([]any{}, args...)
	listArgs = append(listArgs, pageSize, (page-1)*pageSize)
	rows, err := DB().Query(
		`SELECT s.id,s.name,s.aliases,s.createUserId,s.createTimestamp,u.username,u.nickname
		FROM singer s
		LEFT JOIN user u ON u.id=s.createUserId`+where+`
		ORDER BY s.createTimestamp DESC, s.id DESC
		LIMIT ? OFFSET ?`,
		listArgs...,
	)
	if err != nil {
		return 0, nil, err
	}
	defer rows.Close()

	var singers []AdminSinger
	for rows.Next() {
		var username sql.NullString
		var nickname sql.NullString
		s := AdminSinger{}
		if err := rows.Scan(
			&s.ID,
			&s.Name,
			&s.Aliases,
			&s.CreateUserID,
			&s.CreateTimestamp,
			&username,
			&nickname,
		); err != nil {
			return 0, nil, err
		}
		s.CreateUserUsername = username.String
		s.CreateUserNickname = nickname.String
		singers = append(singers, s)
	}
	if err := rows.Err(); err != nil {
		return 0, nil, err
	}
	return total, singers, nil
}

func CreateSinger(name, createUserID string) (string, error) {
	for range maxCreateSingerIDAttempts {
		id, err := generateShortPublicID()
		if err != nil {
			return "", err
		}

		// Short public IDs can theoretically collide, so insert atomically and retry on conflict.
		result, err := DB().Exec(
			`INSERT OR IGNORE INTO singer (id,name,createUserId,createTimestamp) VALUES (?,?,?,?)`,
			id, name, createUserID, time.Now().UnixMilli(),
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
	return "", fmt.Errorf("create singer: exhausted %d id generation attempts", maxCreateSingerIDAttempts)
}

func UpdateSinger(id, field string, value any) error {
	_, err := DB().Exec(`UPDATE singer SET `+field+`=? WHERE id=?`, value, id)
	return err
}

// GetMusicCountBySingerID 返回歌手关联的音乐数量，用于判定能否删除歌手。
func GetMusicCountBySingerID(id string) (int, error) {
	var count int
	if err := DB().QueryRow(
		`SELECT COUNT(1) FROM music_singer_relation WHERE singerId=?`, id,
	).Scan(&count); err != nil {
		return 0, err
	}
	return count, nil
}

// DeleteSingerCascade 删除歌手以及其所有照片记录。照片对应的资源文件由
// removeUnlinkedAsset 在下一次调度运行时清理。调用方需保证该歌手已无关联音乐。
func DeleteSingerCascade(id string) error {
	tx, err := DB().Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	for _, del := range []string{
		`DELETE FROM singer_photo WHERE singerId=?`,
		`DELETE FROM singer WHERE id=?`,
	} {
		if _, err := tx.Exec(del, id); err != nil {
			return err
		}
	}
	return tx.Commit()
}
