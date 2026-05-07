package migration

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"github.com/google/uuid"
)

// Migration 100 -> 101: introduce a dedicated singer_photo table so a singer
// can have multiple photos (with the first one acting as the avatar). The old
// singer.avatar column and singer_modify_record table are dropped, and the
// asset directory is renamed singer_avatar -> singer_photo.
func init() {
	Register(Migration{
		From:        BaselineVersion,
		To:          BaselineVersion + 1,
		Description: "introduce singer_photo table; drop singer.avatar and singer_modify_record",
		Destructive: true,
		Up:          upSingerPhoto,
	})
}

func upSingerPhoto(ctx context.Context, env *Env) error {
	// Phase 1 — move legacy asset files from singer_avatar/ into singer_photo/.
	// Initialize() pre-creates assets/singer_photo/ before migrations run, so we
	// can't os.Rename the directory itself; move each file individually instead.
	oldDir := filepath.Join(env.DataDir, "assets", "singer_avatar")
	newDir := filepath.Join(env.DataDir, "assets", "singer_photo")
	entries, err := os.ReadDir(oldDir)
	if err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("read %s: %w", oldDir, err)
	}
	if len(entries) > 0 {
		if err := os.MkdirAll(newDir, 0755); err != nil {
			return fmt.Errorf("mkdir %s: %w", newDir, err)
		}
		for _, e := range entries {
			if e.IsDir() {
				continue
			}
			from := filepath.Join(oldDir, e.Name())
			to := filepath.Join(newDir, e.Name())
			if err := env.Journal.Rename(from, to); err != nil {
				return fmt.Errorf("move %s: %w", e.Name(), err)
			}
		}
	}
	// Best-effort cleanup of the (now empty) legacy dir; ignore failures since
	// a non-empty dir is benign (next removeUnlinkedAsset run will sweep).
	if err == nil {
		_ = os.Remove(oldDir)
	}

	// Phase 2 — create singer_photo table + index.
	if _, err := env.Tx.ExecContext(ctx, `CREATE TABLE IF NOT EXISTS singer_photo (
		id TEXT PRIMARY KEY NOT NULL,
		singerId TEXT NOT NULL REFERENCES singer(id),
		asset TEXT NOT NULL,
		position INTEGER NOT NULL,
		description TEXT NOT NULL DEFAULT '',
		addUserId TEXT NOT NULL REFERENCES user(id),
		addTimestamp INTEGER NOT NULL
	)`); err != nil {
		return fmt.Errorf("create singer_photo: %w", err)
	}
	if _, err := env.Tx.ExecContext(ctx,
		`CREATE INDEX IF NOT EXISTS idx_singer_photo_singer ON singer_photo(singerId, position)`,
	); err != nil {
		return fmt.Errorf("create idx_singer_photo_singer: %w", err)
	}

	// Phase 3 — backfill from singer.avatar (only when the legacy column is
	// still present — guards against re-runs in dev).
	hasAvatar, err := singerHasAvatarColumn(ctx, env)
	if err != nil {
		return err
	}
	if hasAvatar {
		srcRows, err := env.Tx.QueryContext(ctx,
			`SELECT id, avatar, createUserId, createTimestamp FROM singer WHERE avatar != ''`,
		)
		if err != nil {
			return fmt.Errorf("read singers: %w", err)
		}
		type singerRow struct {
			ID, Avatar, CreateUserID string
			CreateTimestamp          int64
		}
		var srs []singerRow
		for srcRows.Next() {
			var sr singerRow
			if err := srcRows.Scan(&sr.ID, &sr.Avatar, &sr.CreateUserID, &sr.CreateTimestamp); err != nil {
				srcRows.Close()
				return fmt.Errorf("scan singer row: %w", err)
			}
			srs = append(srs, sr)
		}
		srcRows.Close()

		for _, sr := range srs {
			if _, err := env.Tx.ExecContext(ctx,
				`INSERT INTO singer_photo (id, singerId, asset, position, description, addUserId, addTimestamp) VALUES (?,?,?,0,'',?,?)`,
				uuid.New().String(), sr.ID, sr.Avatar, sr.CreateUserID, sr.CreateTimestamp,
			); err != nil {
				return fmt.Errorf("backfill photo for singer %s: %w", sr.ID, err)
			}
		}

		// Phase 4 — drop the now-superseded singer.avatar column.
		if _, err := env.Tx.ExecContext(ctx, `ALTER TABLE singer DROP COLUMN avatar`); err != nil {
			return fmt.Errorf("drop singer.avatar: %w", err)
		}
	}

	// Phase 5 — drop singer_modify_record entirely; modify history was unused
	// and complicates the schema.
	if _, err := env.Tx.ExecContext(ctx, `DROP TABLE IF EXISTS singer_modify_record`); err != nil {
		return fmt.Errorf("drop singer_modify_record: %w", err)
	}
	return nil
}

func singerHasAvatarColumn(ctx context.Context, env *Env) (bool, error) {
	rows, err := env.Tx.QueryContext(ctx, `PRAGMA table_info(singer)`)
	if err != nil {
		return false, fmt.Errorf("pragma table_info(singer): %w", err)
	}
	defer rows.Close()
	for rows.Next() {
		var cid int
		var name, ctype string
		var notnull, pk int
		var dflt any
		if err := rows.Scan(&cid, &name, &ctype, &notnull, &dflt, &pk); err != nil {
			return false, err
		}
		if name == "avatar" {
			return true, nil
		}
	}
	return false, nil
}
