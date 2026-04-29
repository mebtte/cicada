package store

import (
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
