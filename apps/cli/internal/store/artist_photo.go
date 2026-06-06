package store

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type ArtistPhoto struct {
	ID           string
	ArtistID     string
	Asset        string
	Thumbnail    string
	Position     int64
	Description  string
	AddUserID    string
	AddTimestamp int64
}

const artistPhotoColumns = `id,artistId,asset,thumbnail,position,description,addUserId,addTimestamp`

func scanArtistPhoto(s scanner, p *ArtistPhoto) error {
	return s.Scan(&p.ID, &p.ArtistID, &p.Asset, &p.Thumbnail, &p.Position, &p.Description, &p.AddUserID, &p.AddTimestamp)
}

type scanner interface {
	Scan(dest ...any) error
}

func GetArtistPhoto(id string) (*ArtistPhoto, error) {
	p := &ArtistPhoto{}
	if err := scanArtistPhoto(
		DB().QueryRow(`SELECT `+artistPhotoColumns+` FROM artist_photo WHERE id=?`, id),
		p,
	); err != nil {
		return nil, err
	}
	return p, nil
}

func ListArtistPhotos(artistID string) ([]ArtistPhoto, error) {
	rows, err := DB().Query(
		`SELECT `+artistPhotoColumns+` FROM artist_photo WHERE artistId=? ORDER BY position ASC`,
		artistID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []ArtistPhoto
	for rows.Next() {
		p := ArtistPhoto{}
		if err := scanArtistPhoto(rows, &p); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, nil
}

func ListArtistPhotosByArtistIDs(artistIDs []string) ([]ArtistPhoto, error) {
	if len(artistIDs) == 0 {
		return nil, nil
	}
	rows, err := DB().Query(
		`SELECT `+artistPhotoColumns+` FROM artist_photo WHERE artistId IN (`+placeholders(len(artistIDs))+`) ORDER BY artistId,position ASC`,
		strs2any(artistIDs)...,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []ArtistPhoto
	for rows.Next() {
		p := ArtistPhoto{}
		if err := scanArtistPhoto(rows, &p); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, nil
}

// CreateArtistPhoto prepends a photo to the front (position = min-1, or 0 for
// the first photo of the artist) so the newest addition appears first in
// ListArtistPhotos and becomes the artist avatar. Returns the new photo id.
func CreateArtistPhoto(artistID, asset, description, addUserID string) (string, error) {
	return CreateArtistPhotoWithThumbnail(artistID, asset, "", description, addUserID)
}

func CreateArtistPhotoWithThumbnail(artistID, asset, thumbnail, description, addUserID string) (string, error) {
	var minPos sql.NullInt64
	if err := DB().QueryRow(
		`SELECT MIN(position) FROM artist_photo WHERE artistId=?`, artistID,
	).Scan(&minPos); err != nil {
		return "", err
	}
	next := int64(0)
	if minPos.Valid {
		next = minPos.Int64 - 1
	}
	id := uuid.New().String()
	_, err := DB().Exec(
		`INSERT INTO artist_photo (`+artistPhotoColumns+`) VALUES (?,?,?,?,?,?,?,?)`,
		id, artistID, asset, thumbnail, next, description, addUserID, time.Now().UnixMilli(),
	)
	if err != nil {
		return "", err
	}
	return id, nil
}

func UpdateArtistPhotoDescription(id, description string) error {
	_, err := DB().Exec(`UPDATE artist_photo SET description=? WHERE id=?`, description, id)
	return err
}

func DeleteArtistPhoto(id string) error {
	_, err := DB().Exec(`DELETE FROM artist_photo WHERE id=?`, id)
	return err
}

// ReorderArtistPhotos rewrites positions to match the order of ids (0..N-1).
// ids must be exactly the set of photo ids belonging to artistID; partial or
// foreign ids are rejected.
func ReorderArtistPhotos(artistID string, ids []string) error {
	rows, err := DB().Query(`SELECT id FROM artist_photo WHERE artistId=?`, artistID)
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
			return fmt.Errorf("reorder: id %s does not belong to artist %s", id, artistID)
		}
		seen[id] = true
	}

	tx, err := DB().Begin()
	if err != nil {
		return err
	}
	for i, id := range ids {
		if _, err := tx.Exec(
			`UPDATE artist_photo SET position=? WHERE id=? AND artistId=?`,
			int64(i), id, artistID,
		); err != nil {
			tx.Rollback()
			return err
		}
	}
	return tx.Commit()
}
