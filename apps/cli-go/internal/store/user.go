package store

import (
	"database/sql"
	"time"
)

type User struct {
	ID                         string
	Username                   string
	Avatar                     string
	Nickname                   string
	JoinTimestamp              int64
	Admin                      int
	Remark                     string
	MusicbillOrdersJSON        sql.NullString
	MusicbillMaxAmount         int
	CreateMusicMaxAmountPerDay int
	LastActiveTimestamp        int64
	MusicPlayRecordIndate      int64
	Password                   string
	TokenIdentifier            string
	TwoFASecret                sql.NullString
}

const userColumns = `id, username, avatar, nickname, joinTimestamp, admin, remark,
	musicbillOrdersJSON, musicbillMaxAmount, createMusicMaxAmountPerDay,
	lastActiveTimestamp, musicPlayRecordIndate, password, tokenIdentifier, twoFASecret`

func scanUser(row interface{ Scan(...any) error }) (*User, error) {
	u := &User{}
	return u, row.Scan(
		&u.ID, &u.Username, &u.Avatar, &u.Nickname, &u.JoinTimestamp,
		&u.Admin, &u.Remark, &u.MusicbillOrdersJSON, &u.MusicbillMaxAmount,
		&u.CreateMusicMaxAmountPerDay, &u.LastActiveTimestamp,
		&u.MusicPlayRecordIndate, &u.Password, &u.TokenIdentifier, &u.TwoFASecret,
	)
}

func GetUserByID(id string) (*User, error) {
	return scanUser(DB().QueryRow(`SELECT `+userColumns+` FROM user WHERE id=?`, id))
}

func GetUserByUsername(username string) (*User, error) {
	return scanUser(DB().QueryRow(`SELECT `+userColumns+` FROM user WHERE username=?`, username))
}

func UpdateUser(id, field string, value any) error {
	_, err := DB().Exec(`UPDATE user SET `+field+`=? WHERE id=?`, value, id)
	return err
}

func TouchUser(id string) {
	_, _ = DB().Exec(`UPDATE user SET lastActiveTimestamp=? WHERE id=?`, time.Now().UnixMilli(), id)
}

func GetAllUsers() ([]User, error) {
	rows, err := DB().Query(`SELECT ` + userColumns + ` FROM user ORDER BY joinTimestamp`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var users []User
	for rows.Next() {
		u, err := scanUser(rows)
		if err != nil {
			return nil, err
		}
		users = append(users, *u)
	}
	return users, nil
}

func CreateUser(id, username, password, remark string) error {
	_, err := DB().Exec(
		`INSERT INTO user (id,username,password,nickname,joinTimestamp,remark) VALUES (?,?,?,?,?,?)`,
		id, username, DoubleMD5(password), username, time.Now().UnixMilli(), remark,
	)
	return err
}

func DeleteUser(id string) error {
	_, err := DB().Exec(`DELETE FROM user WHERE id=?`, id)
	return err
}
