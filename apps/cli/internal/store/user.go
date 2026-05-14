package store

import (
	"database/sql"
	"time"
)

type User struct {
	ID                  string
	Username            string
	Avatar              string
	Nickname            string
	JoinTimestamp       int64
	Admin               int
	Remark              string
	MusicbillOrdersJSON sql.NullString
	LastActiveTimestamp int64
	Password            string
	TwoFASecret         sql.NullString
}

const userColumns = `id, username, avatar, nickname, joinTimestamp, admin, remark,
	musicbillOrdersJSON, lastActiveTimestamp, password, twoFASecret`

func scanUser(row interface{ Scan(...any) error }) (*User, error) {
	u := &User{}
	return u, row.Scan(
		&u.ID, &u.Username, &u.Avatar, &u.Nickname, &u.JoinTimestamp,
		&u.Admin, &u.Remark, &u.MusicbillOrdersJSON, &u.LastActiveTimestamp,
		&u.Password, &u.TwoFASecret,
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

func ResetUserPasswordAndDisable2FA(id, passwordHash string, now int64, revokeReason string) error {
	tx, err := DB().Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec(
		`UPDATE user SET password=?, twoFASecret=NULL WHERE id=?`,
		passwordHash, id,
	); err != nil {
		return err
	}
	if _, err := tx.Exec(
		`UPDATE auth_session SET revokeTimestamp=?, revokeReason=?
		WHERE userId=? AND revokeTimestamp IS NULL`,
		now, revokeReason, id,
	); err != nil {
		return err
	}
	return tx.Commit()
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
	passwordHash, err := HashPassword(password)
	if err != nil {
		return err
	}
	_, err = DB().Exec(
		`INSERT INTO user (id,username,password,nickname,joinTimestamp,remark) VALUES (?,?,?,?,?,?)`,
		id, username, passwordHash, username, time.Now().UnixMilli(), remark,
	)
	return err
}

func DeleteUser(id string) error {
	_, err := DB().Exec(`DELETE FROM user WHERE id=?`, id)
	return err
}
