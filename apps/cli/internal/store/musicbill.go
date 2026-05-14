package store

import (
	"strings"
	"time"

	"github.com/google/uuid"
)

type Musicbill struct {
	ID              string
	UserID          string
	Cover           string
	Name            string
	Public          int
	CreateTimestamp int64
}

type MusicbillWithOwner struct {
	Musicbill
	OwnerNickname string
	OwnerAvatar   string
}

type SharedMusicbillRow struct {
	ID              int64
	MusicbillID     string
	MusicbillName   string
	SharedUserID    string
	InviteUserID    string
	InviteTimestamp int64
	Accepted        int
	UserNickname    string
	UserAvatar      string
}

type MusicInMusicbill struct {
	ID      string
	Type    MusicType
	Name    string
	Aliases string
	Cover   string
	Asset   string
}

func GetMusicbillByID(id string) (*MusicbillWithOwner, error) {
	mb := &MusicbillWithOwner{}
	err := DB().QueryRow(
		`SELECT mb.id,mb.userId,mb.cover,mb.name,mb.public,mb.createTimestamp,u.nickname,u.avatar
		FROM musicbill mb JOIN user u ON mb.userId=u.id WHERE mb.id=?`, id,
	).Scan(&mb.ID, &mb.UserID, &mb.Cover, &mb.Name, &mb.Public, &mb.CreateTimestamp, &mb.OwnerNickname, &mb.OwnerAvatar)
	return mb, err
}

func GetMusicbillsByUserID(userID string) ([]Musicbill, error) {
	rows, err := DB().Query(
		`SELECT id,userId,cover,name,public,createTimestamp FROM musicbill WHERE userId=? ORDER BY createTimestamp DESC`, userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Musicbill
	for rows.Next() {
		mb := Musicbill{}
		rows.Scan(&mb.ID, &mb.UserID, &mb.Cover, &mb.Name, &mb.Public, &mb.CreateTimestamp)
		out = append(out, mb)
	}
	return out, nil
}

func CreateMusicbill(userID, name string) (string, error) {
	id := uuid.New().String()
	_, err := DB().Exec(
		`INSERT INTO musicbill (id,userId,name,createTimestamp) VALUES (?,?,?,?)`,
		id, userID, name, time.Now().UnixMilli(),
	)
	return id, err
}

func UpdateMusicbill(id, field string, value any) error {
	_, err := DB().Exec(`UPDATE musicbill SET `+field+`=? WHERE id=?`, value, id)
	return err
}

func DeleteMusicbill(id string) error {
	tx, err := DB().Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	for _, q := range []string{
		`DELETE FROM musicbill_music WHERE musicbillId=?`,
		`DELETE FROM shared_musicbill WHERE musicbillId=?`,
		`DELETE FROM public_musicbill_collection WHERE musicbillId=?`,
		`DELETE FROM musicbill WHERE id=?`,
	} {
		if _, err := tx.Exec(q, id); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func CountUserMusicbills(userID string) (int, error) {
	var n int
	err := DB().QueryRow(`SELECT COUNT(1) FROM musicbill WHERE userId=?`, userID).Scan(&n)
	return n, err
}

func GetMusicsInMusicbill(musicbillID string) ([]MusicInMusicbill, error) {
	rows, err := DB().Query(
		`SELECT m.id,m.type,m.name,m.aliases,m.cover,m.asset
		FROM musicbill_music mm LEFT JOIN music m ON mm.musicId=m.id
		WHERE mm.musicbillId=? ORDER BY mm.addTimestamp DESC`, musicbillID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []MusicInMusicbill
	for rows.Next() {
		m := MusicInMusicbill{}
		rows.Scan(&m.ID, &m.Type, &m.Name, &m.Aliases, &m.Cover, &m.Asset)
		out = append(out, m)
	}
	return out, nil
}

func AddMusicToMusicbill(musicbillID, musicID string) error {
	_, err := DB().Exec(
		`INSERT OR REPLACE INTO musicbill_music (musicbillId,musicId,addTimestamp) VALUES (?,?,?)`,
		musicbillID, musicID, time.Now().UnixMilli(),
	)
	return err
}

func RemoveMusicFromMusicbill(musicbillID, musicID string) (bool, error) {
	res, err := DB().Exec(`DELETE FROM musicbill_music WHERE musicbillId=? AND musicId=?`, musicbillID, musicID)
	if err != nil {
		return false, err
	}
	n, _ := res.RowsAffected()
	return n > 0, nil
}

func MusicExistsInMusicbill(musicbillID, musicID string) (bool, error) {
	var n int
	err := DB().QueryRow(`SELECT COUNT(1) FROM musicbill_music WHERE musicbillId=? AND musicId=?`, musicbillID, musicID).Scan(&n)
	return n > 0, err
}

// Shared musicbill

func GetSharedUsersInMusicbill(musicbillID string) ([]SharedMusicbillRow, error) {
	rows, err := DB().Query(
		`SELECT smb.id,smb.musicbillId,smb.sharedUserId,smb.inviteUserId,smb.inviteTimestamp,smb.accepted,u.nickname,u.avatar
		FROM shared_musicbill smb JOIN user u ON smb.sharedUserId=u.id WHERE smb.musicbillId=?`, musicbillID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []SharedMusicbillRow
	for rows.Next() {
		r := SharedMusicbillRow{}
		rows.Scan(&r.ID, &r.MusicbillID, &r.SharedUserID, &r.InviteUserID, &r.InviteTimestamp, &r.Accepted, &r.UserNickname, &r.UserAvatar)
		out = append(out, r)
	}
	return out, nil
}

func AddMusicbillSharedUser(musicbillID, sharedUserID, inviteUserID string) error {
	_, err := DB().Exec(
		`INSERT OR REPLACE INTO shared_musicbill (musicbillId,sharedUserId,inviteUserId,inviteTimestamp) VALUES (?,?,?,?)`,
		musicbillID, sharedUserID, inviteUserID, time.Now().UnixMilli(),
	)
	return err
}

func RemoveMusicbillSharedUser(musicbillID, sharedUserID string) (bool, error) {
	res, err := DB().Exec(`DELETE FROM shared_musicbill WHERE musicbillId=? AND sharedUserId=?`, musicbillID, sharedUserID)
	if err != nil {
		return false, err
	}
	n, _ := res.RowsAffected()
	return n > 0, nil
}

func GetPendingInvitationsForUser(userID string) ([]SharedMusicbillRow, error) {
	rows, err := DB().Query(
		`SELECT smb.id,smb.musicbillId,mb.name,smb.sharedUserId,smb.inviteUserId,smb.inviteTimestamp,smb.accepted,u.nickname,u.avatar
		FROM shared_musicbill smb
		JOIN user u ON smb.inviteUserId=u.id
		JOIN musicbill mb ON smb.musicbillId=mb.id
		WHERE smb.sharedUserId=? AND smb.accepted=0`, userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []SharedMusicbillRow
	for rows.Next() {
		r := SharedMusicbillRow{}
		rows.Scan(&r.ID, &r.MusicbillID, &r.MusicbillName, &r.SharedUserID, &r.InviteUserID, &r.InviteTimestamp, &r.Accepted, &r.UserNickname, &r.UserAvatar)
		out = append(out, r)
	}
	return out, nil
}

func AcceptInvitation(id int64, userID string) (bool, error) {
	res, err := DB().Exec(`UPDATE shared_musicbill SET accepted=1 WHERE id=? AND sharedUserId=?`, id, userID)
	if err != nil {
		return false, err
	}
	n, _ := res.RowsAffected()
	return n > 0, nil
}

// Public musicbill collection

func GetPublicMusicbillByID(id string) (*MusicbillWithOwner, error) {
	mb := &MusicbillWithOwner{}
	err := DB().QueryRow(
		`SELECT mb.id,mb.userId,mb.cover,mb.name,mb.public,mb.createTimestamp,u.nickname,u.avatar
		FROM musicbill mb JOIN user u ON mb.userId=u.id WHERE mb.id=? AND mb.public=1`, id,
	).Scan(&mb.ID, &mb.UserID, &mb.Cover, &mb.Name, &mb.Public, &mb.CreateTimestamp, &mb.OwnerNickname, &mb.OwnerAvatar)
	return mb, err
}

func SearchPublicMusicbills(keyword string, page, pageSize int) (int, []MusicbillWithOwner, error) {
	keyword = strings.TrimSpace(keyword)
	if keyword == "" {
		return 0, []MusicbillWithOwner{}, nil
	}
	pat := "%" + keyword + "%"
	var total int
	DB().QueryRow(`SELECT COUNT(1) FROM musicbill WHERE public=1 AND name LIKE ?`, pat).Scan(&total)
	rows, err := DB().Query(
		`SELECT mb.id,mb.userId,mb.cover,mb.name,mb.public,mb.createTimestamp,u.nickname,u.avatar
		FROM musicbill mb JOIN user u ON mb.userId=u.id
		WHERE mb.public=1 AND mb.name LIKE ?
		ORDER BY mb.createTimestamp DESC LIMIT ? OFFSET ?`,
		pat, pageSize, (page-1)*pageSize,
	)
	if err != nil {
		return 0, nil, err
	}
	defer rows.Close()
	var out []MusicbillWithOwner
	for rows.Next() {
		mb := MusicbillWithOwner{}
		rows.Scan(&mb.ID, &mb.UserID, &mb.Cover, &mb.Name, &mb.Public, &mb.CreateTimestamp, &mb.OwnerNickname, &mb.OwnerAvatar)
		out = append(out, mb)
	}
	return total, out, nil
}

func CollectPublicMusicbill(musicbillID, userID string) error {
	_, err := DB().Exec(
		`INSERT OR REPLACE INTO public_musicbill_collection (musicbillId,userId,collectTimestamp) VALUES (?,?,?)`,
		musicbillID, userID, time.Now().UnixMilli(),
	)
	return err
}

func UncollectPublicMusicbill(musicbillID, userID string) (bool, error) {
	res, err := DB().Exec(`DELETE FROM public_musicbill_collection WHERE musicbillId=? AND userId=?`, musicbillID, userID)
	if err != nil {
		return false, err
	}
	n, _ := res.RowsAffected()
	return n > 0, nil
}

func IsPublicMusicbillCollected(musicbillID, userID string) bool {
	var n int
	DB().QueryRow(`SELECT COUNT(1) FROM public_musicbill_collection WHERE musicbillId=? AND userId=?`, musicbillID, userID).Scan(&n)
	return n > 0
}

func GetCollectedPublicMusicbillIDs(userID string) ([]string, error) {
	rows, err := DB().Query(
		`SELECT musicbillId FROM public_musicbill_collection WHERE userId=? ORDER BY collectTimestamp DESC`, userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var ids []string
	for rows.Next() {
		var id string
		rows.Scan(&id)
		ids = append(ids, id)
	}
	return ids, nil
}
