package migration

import (
	"context"
	"database/sql"
	"fmt"
)

// Migration 116 -> 117: drop createUserId from artist/music and addUserId from
// artist_photo. The "who created this resource" column is no longer surfaced
// anywhere in the API and the user-deletion flow no longer relies on it.
//
// SQLite refuses ALTER TABLE DROP COLUMN when the column carries an inline
// REFERENCES clause, so we rebuild each table via the standard
// "create new -> copy -> drop old -> rename" procedure documented at
// https://sqlite.org/lang_altertable.html#otheralter. That procedure requires
// foreign_keys to be OFF for the whole transaction; the WithoutForeignKeys
// flag tells the runner to toggle the connection-level pragma around the tx.
//
// After the rebuild, foreign_key_check verifies no orphans remain before the
// runner re-enables FK enforcement.
func init() {
	Register(Migration{
		From:               BaselineVersion + 16,
		To:                 BaselineVersion + 17,
		Description:        "drop createUserId / addUserId columns from resource tables",
		Destructive:        true,
		WithoutForeignKeys: true,
		Up:                 upDropResourceUserColumns,
	})
}

func upDropResourceUserColumns(ctx context.Context, env *Env) error {
	if err := rebuildArtistWithoutCreateUser(ctx, env.Tx); err != nil {
		return err
	}
	if err := rebuildMusicWithoutCreateUser(ctx, env.Tx); err != nil {
		return err
	}
	if err := rebuildArtistPhotoWithoutAddUser(ctx, env.Tx); err != nil {
		return err
	}
	return verifyForeignKeysIntact(ctx, env.Tx)
}

func verifyForeignKeysIntact(ctx context.Context, tx *sql.Tx) error {
	rows, err := tx.QueryContext(ctx, `PRAGMA foreign_key_check`)
	if err != nil {
		return fmt.Errorf("foreign_key_check: %w", err)
	}
	defer rows.Close()
	var violations []string
	for rows.Next() {
		var table, rowid, parent, fkid sql.NullString
		if err := rows.Scan(&table, &rowid, &parent, &fkid); err != nil {
			return fmt.Errorf("scan fk_check: %w", err)
		}
		violations = append(violations, fmt.Sprintf(
			"table=%s rowid=%s parent=%s fkid=%s",
			table.String, rowid.String, parent.String, fkid.String,
		))
	}
	if len(violations) > 0 {
		return fmt.Errorf("foreign key check failed: %v", violations)
	}
	return nil
}

func rebuildArtistWithoutCreateUser(ctx context.Context, tx *sql.Tx) error {
	exists, err := migrationColumnExists(ctx, tx, "artist", "createUserId")
	if err != nil {
		return err
	}
	if !exists {
		return nil
	}
	stmts := []string{
		`CREATE TABLE __artist_new_v117 (
			id TEXT PRIMARY KEY NOT NULL,
			name TEXT NOT NULL,
			aliases TEXT NOT NULL DEFAULT '',
			searchKeywords TEXT NOT NULL DEFAULT '',
			createTimestamp INTEGER NOT NULL
		)`,
		`INSERT INTO __artist_new_v117 (id,name,aliases,searchKeywords,createTimestamp)
			SELECT id,name,aliases,searchKeywords,createTimestamp FROM artist`,
		`DROP TABLE artist`,
		`ALTER TABLE __artist_new_v117 RENAME TO artist`,
	}
	for _, s := range stmts {
		if _, err := tx.ExecContext(ctx, s); err != nil {
			return fmt.Errorf("rebuild artist: %w", err)
		}
	}
	return nil
}

func rebuildMusicWithoutCreateUser(ctx context.Context, tx *sql.Tx) error {
	exists, err := migrationColumnExists(ctx, tx, "music", "createUserId")
	if err != nil {
		return err
	}
	if !exists {
		return nil
	}
	stmts := []string{
		`CREATE TABLE __music_new_v117 (
			id TEXT PRIMARY KEY NOT NULL,
			type INTEGER NOT NULL,
			name TEXT NOT NULL,
			year INTEGER DEFAULT NULL,
			aliases TEXT NOT NULL DEFAULT '',
			searchKeywords TEXT NOT NULL DEFAULT '',
			cover TEXT NOT NULL DEFAULT '',
			coverThumbnail TEXT NOT NULL DEFAULT '',
			asset TEXT NOT NULL,
			assetSize INTEGER NOT NULL DEFAULT 0,
			assetDurationMs INTEGER NOT NULL DEFAULT 0,
			assetCodec TEXT NOT NULL DEFAULT '',
			assetBitRate INTEGER NOT NULL DEFAULT 0,
			heat INTEGER NOT NULL DEFAULT 0,
			createTimestamp INTEGER NOT NULL
		)`,
		`INSERT INTO __music_new_v117 (
			id,type,name,year,aliases,searchKeywords,cover,coverThumbnail,asset,
			assetSize,assetDurationMs,assetCodec,assetBitRate,heat,createTimestamp
		) SELECT
			id,type,name,year,aliases,searchKeywords,cover,coverThumbnail,asset,
			assetSize,assetDurationMs,assetCodec,assetBitRate,heat,createTimestamp
		FROM music`,
		`DROP TABLE music`,
		`ALTER TABLE __music_new_v117 RENAME TO music`,
	}
	for _, s := range stmts {
		if _, err := tx.ExecContext(ctx, s); err != nil {
			return fmt.Errorf("rebuild music: %w", err)
		}
	}
	return nil
}

func rebuildArtistPhotoWithoutAddUser(ctx context.Context, tx *sql.Tx) error {
	exists, err := migrationColumnExists(ctx, tx, "artist_photo", "addUserId")
	if err != nil {
		return err
	}
	if !exists {
		return nil
	}
	stmts := []string{
		`CREATE TABLE __artist_photo_new_v117 (
			id TEXT PRIMARY KEY NOT NULL,
			artistId TEXT NOT NULL REFERENCES artist(id),
			asset TEXT NOT NULL,
			thumbnail TEXT NOT NULL DEFAULT '',
			position INTEGER NOT NULL,
			description TEXT NOT NULL DEFAULT '',
			addTimestamp INTEGER NOT NULL
		)`,
		`INSERT INTO __artist_photo_new_v117 (id,artistId,asset,thumbnail,position,description,addTimestamp)
			SELECT id,artistId,asset,thumbnail,position,description,addTimestamp FROM artist_photo`,
		`DROP TABLE artist_photo`,
		`ALTER TABLE __artist_photo_new_v117 RENAME TO artist_photo`,
		`CREATE INDEX IF NOT EXISTS idx_artist_photo_artist ON artist_photo(artistId, position)`,
	}
	for _, s := range stmts {
		if _, err := tx.ExecContext(ctx, s); err != nil {
			return fmt.Errorf("rebuild artist_photo: %w", err)
		}
	}
	return nil
}
