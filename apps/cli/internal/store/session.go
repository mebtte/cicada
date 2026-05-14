package store

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

type AuthSession struct {
	ID                string
	UserID            string
	TokenHash         string
	TokenPrefix       string
	DeviceName        string
	UserAgent         string
	CreateIP          string
	LastSeenIP        string
	CreateTimestamp   int64
	LastSeenTimestamp int64
	RevokeTimestamp   sql.NullInt64
	RevokeReason      string
}

const authSessionColumns = `id, userId, tokenHash, tokenPrefix, deviceName,
	userAgent, createIP, lastSeenIP, createTimestamp, lastSeenTimestamp, revokeTimestamp, revokeReason`

func scanAuthSession(row interface{ Scan(...any) error }) (*AuthSession, error) {
	s := &AuthSession{}
	return s, row.Scan(
		&s.ID, &s.UserID, &s.TokenHash, &s.TokenPrefix, &s.DeviceName,
		&s.UserAgent, &s.CreateIP, &s.LastSeenIP, &s.CreateTimestamp, &s.LastSeenTimestamp,
		&s.RevokeTimestamp, &s.RevokeReason,
	)
}

func CreateAuthSession(userID, tokenHash, tokenPrefix, deviceName, userAgent, ip string) (string, error) {
	id := uuid.NewString()
	now := time.Now().UnixMilli()
	_, err := DB().Exec(
		`INSERT INTO auth_session (
			id,userId,tokenHash,tokenPrefix,deviceName,userAgent,createIP,lastSeenIP,createTimestamp,lastSeenTimestamp
		) VALUES (?,?,?,?,?,?,?,?,?,?)`,
		id, userID, tokenHash, tokenPrefix, deviceName, userAgent, ip, ip, now, now,
	)
	return id, err
}

func GetActiveAuthSessionByTokenHash(tokenHash string, activeAfter int64) (*AuthSession, *User, error) {
	row := DB().QueryRow(
		`SELECT
			s.id,s.userId,s.tokenHash,s.tokenPrefix,s.deviceName,
			s.userAgent,s.createIP,s.lastSeenIP,s.createTimestamp,s.lastSeenTimestamp,s.revokeTimestamp,s.revokeReason,
			`+userColumnsWithPrefix("u")+`
		FROM auth_session s
		JOIN user u ON u.id=s.userId
		WHERE s.tokenHash=? AND s.revokeTimestamp IS NULL AND s.lastSeenTimestamp>=?
		LIMIT 1`,
		tokenHash, activeAfter,
	)

	s := &AuthSession{}
	u := &User{}
	err := row.Scan(
		&s.ID, &s.UserID, &s.TokenHash, &s.TokenPrefix, &s.DeviceName,
		&s.UserAgent, &s.CreateIP, &s.LastSeenIP, &s.CreateTimestamp, &s.LastSeenTimestamp,
		&s.RevokeTimestamp, &s.RevokeReason,
		&u.ID, &u.Username, &u.Avatar, &u.Nickname, &u.JoinTimestamp,
		&u.Admin, &u.Remark, &u.MusicbillOrdersJSON, &u.LastActiveTimestamp,
		&u.Password, &u.TwoFASecret,
	)
	if err != nil {
		return nil, nil, err
	}
	return s, u, nil
}

func userColumnsWithPrefix(prefix string) string {
	cols := []string{
		"id", "username", "avatar", "nickname", "joinTimestamp", "admin", "remark",
		"musicbillOrdersJSON", "lastActiveTimestamp", "password", "twoFASecret",
	}
	out := ""
	for i, col := range cols {
		if i > 0 {
			out += ","
		}
		out += prefix + "." + col
	}
	return out
}

func TouchAuthSession(id, ip string, now, touchBefore int64) {
	_, _ = DB().Exec(
		`UPDATE auth_session SET lastSeenTimestamp=?, lastSeenIP=? WHERE id=? AND lastSeenTimestamp<?`,
		now, ip, id, touchBefore,
	)
}

func GetActiveAuthSessionsByUserID(userID string, activeAfter int64) ([]AuthSession, error) {
	rows, err := DB().Query(
		`SELECT `+authSessionColumns+`
		FROM auth_session
		WHERE userId=? AND revokeTimestamp IS NULL AND lastSeenTimestamp>=?
		ORDER BY lastSeenTimestamp DESC`,
		userID, activeAfter,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []AuthSession
	for rows.Next() {
		s, err := scanAuthSession(rows)
		if err != nil {
			return nil, err
		}
		sessions = append(sessions, *s)
	}
	return sessions, rows.Err()
}

func UpdateAuthSessionDeviceName(userID, sessionID, name string) (bool, error) {
	res, err := DB().Exec(`UPDATE auth_session SET deviceName=? WHERE id=? AND userId=?`, name, sessionID, userID)
	return rowsChanged(res, err)
}

func RevokeAuthSession(userID, sessionID string, now int64, reason string) (bool, error) {
	res, err := DB().Exec(
		`UPDATE auth_session SET revokeTimestamp=?, revokeReason=?
		WHERE id=? AND userId=? AND revokeTimestamp IS NULL`,
		now, reason, sessionID, userID,
	)
	return rowsChanged(res, err)
}

func RevokeOtherAuthSessions(userID, currentSessionID string, now int64, reason string) (int64, error) {
	res, err := DB().Exec(
		`UPDATE auth_session SET revokeTimestamp=?, revokeReason=?
		WHERE userId=? AND id!=? AND revokeTimestamp IS NULL`,
		now, reason, userID, currentSessionID,
	)
	return sessionRowsAffected(res, err)
}

func RevokeAllAuthSessions(userID string, now int64, reason string) (int64, error) {
	res, err := DB().Exec(
		`UPDATE auth_session SET revokeTimestamp=?, revokeReason=?
		WHERE userId=? AND revokeTimestamp IS NULL`,
		now, reason, userID,
	)
	return sessionRowsAffected(res, err)
}

func DeleteOutdatedAuthSessions(revokedBefore, inactiveBefore int64) (int64, error) {
	res, err := DB().Exec(
		`DELETE FROM auth_session
		WHERE (revokeTimestamp IS NOT NULL AND revokeTimestamp<?)
			OR (revokeTimestamp IS NULL AND lastSeenTimestamp<?)`,
		revokedBefore, inactiveBefore,
	)
	return sessionRowsAffected(res, err)
}

func rowsChanged(res sql.Result, err error) (bool, error) {
	affected, err := sessionRowsAffected(res, err)
	return affected > 0, err
}

func sessionRowsAffected(res sql.Result, err error) (int64, error) {
	if err != nil {
		return 0, err
	}
	return res.RowsAffected()
}
