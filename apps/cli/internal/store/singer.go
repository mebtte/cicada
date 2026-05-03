package store

import (
	"database/sql"
	"strings"
	"time"

	"github.com/google/uuid"
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

func SearchSingers(keyword string, page, pageSize int) (int, []Singer, error) {
	pat := "%" + keyword + "%"
	var total int
	DB().QueryRow(`SELECT COUNT(1) FROM singer WHERE name LIKE ? OR aliases LIKE ?`, pat, pat).Scan(&total)
	rows, err := DB().Query(
		`SELECT id,name,aliases,createUserId,createTimestamp FROM singer WHERE name LIKE ? OR aliases LIKE ? ORDER BY createTimestamp DESC LIMIT ? OFFSET ?`,
		pat, pat, pageSize, (page-1)*pageSize,
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
	id := uuid.New().String()
	_, err := DB().Exec(
		`INSERT INTO singer (id,name,createUserId,createTimestamp) VALUES (?,?,?,?)`,
		id, name, createUserID, time.Now().UnixMilli(),
	)
	return id, err
}

func UpdateSinger(id, field string, value any) error {
	_, err := DB().Exec(`UPDATE singer SET `+field+`=? WHERE id=?`, value, id)
	return err
}
