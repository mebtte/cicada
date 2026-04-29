package store

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type SingerPhoto struct {
	ID           string
	SingerID     string
	Asset        string
	Position     int64
	Description  string
	AddUserID    string
	AddTimestamp int64
}

const singerPhotoColumns = `id,singerId,asset,position,description,addUserId,addTimestamp`

func scanSingerPhoto(s scanner, p *SingerPhoto) error {
	return s.Scan(&p.ID, &p.SingerID, &p.Asset, &p.Position, &p.Description, &p.AddUserID, &p.AddTimestamp)
}

type scanner interface {
	Scan(dest ...any) error
}

func GetSingerPhoto(id string) (*SingerPhoto, error) {
	p := &SingerPhoto{}
	if err := scanSingerPhoto(
		DB().QueryRow(`SELECT `+singerPhotoColumns+` FROM singer_photo WHERE id=?`, id),
		p,
	); err != nil {
		return nil, err
	}
	return p, nil
}

func ListSingerPhotos(singerID string) ([]SingerPhoto, error) {
	rows, err := DB().Query(
		`SELECT `+singerPhotoColumns+` FROM singer_photo WHERE singerId=? ORDER BY position ASC`,
		singerID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []SingerPhoto
	for rows.Next() {
		p := SingerPhoto{}
		if err := scanSingerPhoto(rows, &p); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, nil
}

func ListSingerPhotosBySingerIDs(singerIDs []string) ([]SingerPhoto, error) {
	if len(singerIDs) == 0 {
		return nil, nil
	}
	rows, err := DB().Query(
		`SELECT `+singerPhotoColumns+` FROM singer_photo WHERE singerId IN (`+placeholders(len(singerIDs))+`) ORDER BY singerId,position ASC`,
		strs2any(singerIDs)...,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []SingerPhoto
	for rows.Next() {
		p := SingerPhoto{}
		if err := scanSingerPhoto(rows, &p); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, nil
}

// CreateSingerPhoto appends a photo to the end (position = max+1, or 0 for the
// first photo of the singer). Returns the new photo id.
func CreateSingerPhoto(singerID, asset, description, addUserID string) (string, error) {
	var maxPos sql.NullInt64
	if err := DB().QueryRow(
		`SELECT MAX(position) FROM singer_photo WHERE singerId=?`, singerID,
	).Scan(&maxPos); err != nil {
		return "", err
	}
	next := int64(0)
	if maxPos.Valid {
		next = maxPos.Int64 + 1
	}
	id := uuid.New().String()
	_, err := DB().Exec(
		`INSERT INTO singer_photo (`+singerPhotoColumns+`) VALUES (?,?,?,?,?,?,?)`,
		id, singerID, asset, next, description, addUserID, time.Now().UnixMilli(),
	)
	if err != nil {
		return "", err
	}
	return id, nil
}

func UpdateSingerPhotoDescription(id, description string) error {
	_, err := DB().Exec(`UPDATE singer_photo SET description=? WHERE id=?`, description, id)
	return err
}

func DeleteSingerPhoto(id string) error {
	_, err := DB().Exec(`DELETE FROM singer_photo WHERE id=?`, id)
	return err
}

// ReorderSingerPhotos rewrites positions to match the order of ids (0..N-1).
// ids must be exactly the set of photo ids belonging to singerID — partial or
// foreign ids are rejected.
func ReorderSingerPhotos(singerID string, ids []string) error {
	rows, err := DB().Query(`SELECT id FROM singer_photo WHERE singerId=?`, singerID)
	if err != nil {
		return err
	}
	current := map[string]bool{}
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			rows.Close()
			return err
		}
		current[id] = true
	}
	rows.Close()

	if len(ids) != len(current) {
		return fmt.Errorf("reorder: id count mismatch (got %d, expected %d)", len(ids), len(current))
	}
	seen := map[string]bool{}
	for _, id := range ids {
		if seen[id] {
			return errors.New("reorder: duplicate id")
		}
		if !current[id] {
			return fmt.Errorf("reorder: id %s does not belong to singer %s", id, singerID)
		}
		seen[id] = true
	}

	tx, err := DB().Begin()
	if err != nil {
		return err
	}
	for i, id := range ids {
		if _, err := tx.Exec(
			`UPDATE singer_photo SET position=? WHERE id=? AND singerId=?`,
			int64(i), id, singerID,
		); err != nil {
			tx.Rollback()
			return err
		}
	}
	return tx.Commit()
}
