package store

import (
	"database/sql"
	"fmt"
	"time"
)

const (
	maxCreateUserIDAttempts = 20
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

func CreateUser(username, password, remark string) (string, error) {
	passwordHash, err := HashPassword(password)
	if err != nil {
		return "", err
	}
	for range maxCreateUserIDAttempts {
		id, err := generatePublicID()
		if err != nil {
			return "", err
		}

		// Public IDs can theoretically collide, so insert atomically and retry on conflict.
		result, err := DB().Exec(
			`INSERT OR IGNORE INTO user (id,username,password,nickname,joinTimestamp,remark) VALUES (?,?,?,?,?,?)`,
			id, username, passwordHash, username, time.Now().UnixMilli(), remark,
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
	return "", fmt.Errorf("create user: exhausted %d id generation attempts", maxCreateUserIDAttempts)
}

func DeleteUser(id string) error {
	_, err := DB().Exec(`DELETE FROM user WHERE id=?`, id)
	return err
}

// DeleteUserCascade 在单个事务里清理用户在所有外键引用表中的痕迹后再删除用户.
// 语义: 用户拥有的 musicbill 全部级联删除; 用户作为 sharedUser 或 inviteUser 的
// 乐单邀请、收藏、播放记录、会话也一并清掉. music / artist / artist_photo 不再
// 归属于具体用户, 因此不在此处删除.
func DeleteUserCascade(id string) error {
	tx, err := DB().Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	statements := []struct {
		sql  string
		args []any
	}{
		// 用户拥有的 musicbill 及其下游
		{`DELETE FROM shared_musicbill WHERE musicbillId IN (SELECT id FROM musicbill WHERE userId=?)`, []any{id}},
		{`DELETE FROM public_musicbill_collection WHERE musicbillId IN (SELECT id FROM musicbill WHERE userId=?)`, []any{id}},
		{`DELETE FROM musicbill_music WHERE musicbillId IN (SELECT id FROM musicbill WHERE userId=?)`, []any{id}},
		{`DELETE FROM musicbill WHERE userId=?`, []any{id}},

		// 用户直接持有的剩余行
		{`DELETE FROM auth_session WHERE userId=?`, []any{id}},
		{`DELETE FROM music_play_record WHERE userId=?`, []any{id}},
		{`DELETE FROM public_musicbill_collection WHERE userId=?`, []any{id}},
		{`DELETE FROM shared_musicbill WHERE sharedUserId=? OR inviteUserId=?`, []any{id, id}},

		{`DELETE FROM user WHERE id=?`, []any{id}},
	}
	for _, s := range statements {
		if _, err := tx.Exec(s.sql, s.args...); err != nil {
			return err
		}
	}
	return tx.Commit()
}
