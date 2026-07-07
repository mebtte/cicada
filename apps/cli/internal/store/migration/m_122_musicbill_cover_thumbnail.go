package migration

import (
	"context"
	"database/sql"
	"fmt"
)

// Migration 121 -> 122: persist tiny data-URL thumbnails for musicbill covers
// so clients can show the same immediate placeholder behavior used by music.
func init() {
	Register(Migration{
		From:        BaselineVersion + 21,
		To:          BaselineVersion + 22,
		Description: "add tiny image thumbnails to musicbill covers",
		Up:          upMusicbillCoverThumbnails,
	})
}

func upMusicbillCoverThumbnails(ctx context.Context, env *Env) error {
	if err := addMusicbillCoverThumbnailColumn(ctx, env.Tx); err != nil {
		return err
	}
	return backfillMusicbillCoverThumbnails(ctx, env)
}

func addMusicbillCoverThumbnailColumn(ctx context.Context, tx *sql.Tx) error {
	exists, err := migrationColumnExists(ctx, tx, "musicbill", "coverThumbnail")
	if err != nil {
		return err
	}
	if exists {
		return nil
	}
	if _, err := tx.ExecContext(ctx, `ALTER TABLE musicbill ADD COLUMN coverThumbnail TEXT NOT NULL DEFAULT ''`); err != nil {
		return fmt.Errorf("add musicbill.coverThumbnail: %w", err)
	}
	return nil
}

func backfillMusicbillCoverThumbnails(ctx context.Context, env *Env) error {
	rows, err := env.Tx.QueryContext(ctx, `SELECT id,cover FROM musicbill WHERE cover!='' AND coverThumbnail=''`)
	if err != nil {
		return fmt.Errorf("read musicbill covers: %w", err)
	}

	type musicbillCoverRow struct {
		ID    string
		Cover string
	}
	var covers []musicbillCoverRow
	for rows.Next() {
		var row musicbillCoverRow
		if err := rows.Scan(&row.ID, &row.Cover); err != nil {
			rows.Close()
			return fmt.Errorf("scan musicbill cover: %w", err)
		}
		covers = append(covers, row)
	}
	if err := rows.Close(); err != nil {
		return fmt.Errorf("close musicbill cover rows: %w", err)
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("iterate musicbill covers: %w", err)
	}

	for _, row := range covers {
		if err := ctx.Err(); err != nil {
			return err
		}
		thumbnail := thumbnailFromMigratedAsset(env.DataDir, "musicbill_cover", row.Cover)
		if thumbnail == "" {
			continue
		}
		if _, err := env.Tx.ExecContext(ctx, `UPDATE musicbill SET coverThumbnail=? WHERE id=?`, thumbnail, row.ID); err != nil {
			return fmt.Errorf("backfill musicbill cover thumbnail %s: %w", row.ID, err)
		}
	}
	return nil
}
