package migration

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	"cicada/internal/imagethumb"
)

// Migration 115 -> 116: persist tiny data-URL thumbnails for music covers and
// artist photos so clients can show an immediate placeholder before the real
// image loads.
func init() {
	Register(Migration{
		From:        BaselineVersion + 15,
		To:          BaselineVersion + 16,
		Description: "add tiny image thumbnails to music and artist photos",
		Up:          upTinyImageThumbnails,
	})
}

func upTinyImageThumbnails(ctx context.Context, env *Env) error {
	if err := addTinyThumbnailColumns(ctx, env.Tx); err != nil {
		return err
	}
	if err := backfillMusicCoverThumbnails(ctx, env); err != nil {
		return err
	}
	return backfillArtistPhotoThumbnails(ctx, env)
}

func addTinyThumbnailColumns(ctx context.Context, tx *sql.Tx) error {
	for _, column := range []struct {
		Table string
		Name  string
		DDL   string
	}{
		{Table: "music", Name: "coverThumbnail", DDL: "coverThumbnail TEXT NOT NULL DEFAULT ''"},
		{Table: "artist_photo", Name: "thumbnail", DDL: "thumbnail TEXT NOT NULL DEFAULT ''"},
	} {
		exists, err := migrationColumnExists(ctx, tx, column.Table, column.Name)
		if err != nil {
			return err
		}
		if exists {
			continue
		}
		if _, err := tx.ExecContext(ctx, fmt.Sprintf(`ALTER TABLE %s ADD COLUMN %s`, column.Table, column.DDL)); err != nil {
			return fmt.Errorf("add %s.%s: %w", column.Table, column.Name, err)
		}
	}
	return nil
}

func backfillMusicCoverThumbnails(ctx context.Context, env *Env) error {
	rows, err := env.Tx.QueryContext(ctx, `SELECT id,cover FROM music WHERE cover!='' AND coverThumbnail=''`)
	if err != nil {
		return fmt.Errorf("read music covers: %w", err)
	}

	type musicCoverRow struct {
		ID    string
		Cover string
	}
	var covers []musicCoverRow
	for rows.Next() {
		var row musicCoverRow
		if err := rows.Scan(&row.ID, &row.Cover); err != nil {
			rows.Close()
			return fmt.Errorf("scan music cover: %w", err)
		}
		covers = append(covers, row)
	}
	if err := rows.Close(); err != nil {
		return fmt.Errorf("close music cover rows: %w", err)
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("iterate music covers: %w", err)
	}

	for _, row := range covers {
		if err := ctx.Err(); err != nil {
			return err
		}
		thumbnail := thumbnailFromMigratedAsset(env.DataDir, "music_cover", row.Cover)
		if thumbnail == "" {
			continue
		}
		if _, err := env.Tx.ExecContext(ctx, `UPDATE music SET coverThumbnail=? WHERE id=?`, thumbnail, row.ID); err != nil {
			return fmt.Errorf("backfill music cover thumbnail %s: %w", row.ID, err)
		}
	}
	return nil
}

func backfillArtistPhotoThumbnails(ctx context.Context, env *Env) error {
	rows, err := env.Tx.QueryContext(ctx, `SELECT id,asset FROM artist_photo WHERE asset!='' AND thumbnail=''`)
	if err != nil {
		return fmt.Errorf("read artist photos: %w", err)
	}

	type artistPhotoRow struct {
		ID    string
		Asset string
	}
	var photos []artistPhotoRow
	for rows.Next() {
		var row artistPhotoRow
		if err := rows.Scan(&row.ID, &row.Asset); err != nil {
			rows.Close()
			return fmt.Errorf("scan artist photo: %w", err)
		}
		photos = append(photos, row)
	}
	if err := rows.Close(); err != nil {
		return fmt.Errorf("close artist photo rows: %w", err)
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("iterate artist photos: %w", err)
	}

	for _, row := range photos {
		if err := ctx.Err(); err != nil {
			return err
		}
		thumbnail := thumbnailFromMigratedAsset(env.DataDir, "artist_photo", row.Asset)
		if thumbnail == "" {
			continue
		}
		if _, err := env.Tx.ExecContext(ctx, `UPDATE artist_photo SET thumbnail=? WHERE id=?`, thumbnail, row.ID); err != nil {
			return fmt.Errorf("backfill artist photo thumbnail %s: %w", row.ID, err)
		}
	}
	return nil
}

func thumbnailFromMigratedAsset(dataDir, assetType, filename string) string {
	for _, path := range []string{
		filepath.Join(dataDir, "assets", assetType, assetShard(filename), filename),
		filepath.Join(dataDir, "assets", assetType, filename),
	} {
		if _, err := os.Stat(path); os.IsNotExist(err) {
			continue
		} else if err != nil {
			fmt.Fprintf(os.Stderr, "data: stat tiny image thumbnail source %s: %v\n", filename, err)
			return ""
		}
		thumbnail, err := imagethumb.DataURLFromFile(path)
		if err == nil {
			return thumbnail
		}
		fmt.Fprintf(os.Stderr, "data: backfill tiny image thumbnail %s: %v\n", filename, err)
		return ""
	}
	return ""
}
