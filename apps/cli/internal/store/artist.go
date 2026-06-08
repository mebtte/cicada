package store

import (
	"database/sql"
	"fmt"
	"strings"
	"time"
)

const (
	maxCreateArtistIDAttempts = 20
)

type Artist struct {
	ID              string
	Name            string
	Aliases         string
	SearchKeywords  string
	CreateUserID    string
	CreateTimestamp int64
}

type AdminArtist struct {
	ID                 string
	Name               string
	Aliases            string
	SearchKeywords     string
	CreateUserID       string
	CreateUserUsername string
	CreateUserNickname string
	CreateTimestamp    int64
}

func GetArtistByID(id string) (*Artist, error) {
	a := &Artist{}
	err := DB().QueryRow(
		`SELECT id,name,aliases,searchKeywords,createUserId,createTimestamp FROM artist WHERE id=?`, id,
	).Scan(&a.ID, &a.Name, &a.Aliases, &a.SearchKeywords, &a.CreateUserID, &a.CreateTimestamp)
	return a, err
}

func GetArtistsByIDs(ids []string) ([]Artist, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	rows, err := DB().Query(
		`SELECT id,name,aliases,searchKeywords,createUserId,createTimestamp FROM artist WHERE id IN (`+placeholders(len(ids))+`)`,
		strs2any(ids)...,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Artist
	for rows.Next() {
		a := Artist{}
		rows.Scan(&a.ID, &a.Name, &a.Aliases, &a.SearchKeywords, &a.CreateUserID, &a.CreateTimestamp)
		out = append(out, a)
	}
	return out, nil
}

func ArtistNameExists(name string) (bool, error) {
	var count int
	if err := DB().QueryRow(`SELECT COUNT(1) FROM artist WHERE name=?`, name).Scan(&count); err != nil {
		return false, err
	}
	return count > 0, nil
}

func SearchArtists(keyword string, page, pageSize int) (int, []Artist, error) {
	keyword = strings.TrimSpace(keyword)
	if keyword == "" {
		return 0, []Artist{}, nil
	}
	pat := containsLikePattern(keyword)
	prefixPat := prefixLikePattern(keyword)
	var total int
	DB().QueryRow(
		`SELECT COUNT(1) FROM artist WHERE name LIKE ? ESCAPE '\' OR aliases LIKE ? ESCAPE '\' OR searchKeywords LIKE ? ESCAPE '\'`,
		pat, pat, pat,
	).Scan(&total)
	rows, err := DB().Query(
		`SELECT id,name,aliases,searchKeywords,createUserId,createTimestamp
		FROM artist
		WHERE name LIKE ? ESCAPE '\' OR aliases LIKE ? ESCAPE '\' OR searchKeywords LIKE ? ESCAPE '\'
		ORDER BY
			CASE
				WHEN name = ? COLLATE NOCASE THEN 100
				WHEN name LIKE ? ESCAPE '\' THEN 90
				WHEN aliases LIKE ? ESCAPE '\' THEN 80
				WHEN searchKeywords LIKE ? ESCAPE '\' THEN 70
				ELSE 60
			END DESC,
			createTimestamp DESC,
			id ASC
		LIMIT ? OFFSET ?`,
		pat, pat, pat, keyword, prefixPat, pat, pat, pageSize, (page-1)*pageSize,
	)
	if err != nil {
		return 0, nil, err
	}
	defer rows.Close()
	var artists []Artist
	for rows.Next() {
		a := Artist{}
		rows.Scan(&a.ID, &a.Name, &a.Aliases, &a.SearchKeywords, &a.CreateUserID, &a.CreateTimestamp)
		artists = append(artists, a)
	}
	return total, artists, nil
}

func GetMusicCountsByArtistIDs(artistIDs []string) (map[string]int, error) {
	counts := make(map[string]int, len(artistIDs))
	if len(artistIDs) == 0 {
		return counts, nil
	}

	rows, err := DB().Query(
		`SELECT artistId,COUNT(DISTINCT musicId)
		FROM (
			SELECT artistId,musicId FROM music_singer_relation
			UNION ALL
			SELECT artistId,musicId FROM music_lyricist_relation
		)
		WHERE artistId IN (`+placeholders(len(artistIDs))+`)
		GROUP BY artistId`,
		strs2any(artistIDs)...,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var artistID string
		var count int
		if err := rows.Scan(&artistID, &count); err != nil {
			return nil, err
		}
		counts[artistID] = count
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return counts, nil
}

func GetAdminArtistList(keyword, filterKey string, page, pageSize int) (int, []AdminArtist, error) {
	where := ""
	args := []any{}
	trimmedKeyword := strings.TrimSpace(keyword)
	if trimmedKeyword != "" {
		pattern := "%" + trimmedKeyword + "%"
		switch filterKey {
		case "id":
			where = " WHERE a.id LIKE ?"
			args = append(args, pattern)
		case "name":
			where = " WHERE a.name LIKE ?"
			args = append(args, pattern)
		case "alias":
			where = " WHERE a.aliases LIKE ?"
			args = append(args, pattern)
		default:
			where = " WHERE a.id LIKE ? OR a.name LIKE ? OR a.aliases LIKE ? OR a.searchKeywords LIKE ?"
			args = append(args, pattern, pattern, pattern, pattern)
		}
	}

	var total int
	if err := DB().QueryRow(`SELECT COUNT(1) FROM artist a`+where, args...).Scan(&total); err != nil {
		return 0, nil, err
	}

	listArgs := append([]any{}, args...)
	listArgs = append(listArgs, pageSize, (page-1)*pageSize)
	rows, err := DB().Query(
		`SELECT a.id,a.name,a.aliases,a.searchKeywords,a.createUserId,a.createTimestamp,u.username,u.nickname
		FROM artist a
		LEFT JOIN user u ON u.id=a.createUserId`+where+`
		ORDER BY a.createTimestamp DESC, a.id DESC
		LIMIT ? OFFSET ?`,
		listArgs...,
	)
	if err != nil {
		return 0, nil, err
	}
	defer rows.Close()

	var artists []AdminArtist
	for rows.Next() {
		var username sql.NullString
		var nickname sql.NullString
		a := AdminArtist{}
		if err := rows.Scan(
			&a.ID,
			&a.Name,
			&a.Aliases,
			&a.SearchKeywords,
			&a.CreateUserID,
			&a.CreateTimestamp,
			&username,
			&nickname,
		); err != nil {
			return 0, nil, err
		}
		a.CreateUserUsername = username.String
		a.CreateUserNickname = nickname.String
		artists = append(artists, a)
	}
	if err := rows.Err(); err != nil {
		return 0, nil, err
	}
	return total, artists, nil
}

func CreateArtist(name, createUserID string) (string, error) {
	for range maxCreateArtistIDAttempts {
		id, err := generateShortPublicID()
		if err != nil {
			return "", err
		}

		// Short public IDs can theoretically collide, so insert atomically and retry on conflict.
		result, err := DB().Exec(
			`INSERT OR IGNORE INTO artist (id,name,createUserId,createTimestamp) VALUES (?,?,?,?)`,
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
	return "", fmt.Errorf("create artist: exhausted %d id generation attempts", maxCreateArtistIDAttempts)
}

func UpdateArtist(id, field string, value any) error {
	_, err := DB().Exec(`UPDATE artist SET `+field+`=? WHERE id=?`, value, id)
	return err
}

func GetMusicCountByArtistID(id string) (int, error) {
	counts, err := GetMusicCountsByArtistIDs([]string{id})
	if err != nil {
		return 0, err
	}
	return counts[id], nil
}

func DeleteArtistCascade(id string) error {
	tx, err := DB().Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	for _, del := range []string{
		`DELETE FROM artist_photo WHERE artistId=?`,
		`DELETE FROM artist WHERE id=?`,
	} {
		if _, err := tx.Exec(del, id); err != nil {
			return err
		}
	}
	return tx.Commit()
}
