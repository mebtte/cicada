package migration

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"cicada/internal/musicasset"
)

// Migration 105 -> 106: persist basic source music file information so
// clients can display it without issuing HEAD requests against raw assets.
func init() {
	Register(Migration{
		From:        BaselineVersion + 5,
		To:          BaselineVersion + 6,
		Description: "add music asset info columns",
		Up:          upMusicAssetInfo,
	})
}

func upMusicAssetInfo(ctx context.Context, env *Env) error {
	for _, column := range []struct {
		Name string
		DDL  string
	}{
		{Name: "assetSize", DDL: "assetSize INTEGER NOT NULL DEFAULT 0"},
		{Name: "assetDurationMs", DDL: "assetDurationMs INTEGER NOT NULL DEFAULT 0"},
		{Name: "assetCodec", DDL: "assetCodec TEXT NOT NULL DEFAULT ''"},
		{Name: "assetBitRate", DDL: "assetBitRate INTEGER NOT NULL DEFAULT 0"},
	} {
		exists, err := migrationColumnExists(ctx, env.Tx, "music", column.Name)
		if err != nil {
			return err
		}
		if exists {
			continue
		}
		if _, err := env.Tx.ExecContext(ctx, fmt.Sprintf(`ALTER TABLE music ADD COLUMN %s`, column.DDL)); err != nil {
			return fmt.Errorf("add music.%s: %w", column.Name, err)
		}
	}

	rows, err := env.Tx.QueryContext(ctx, `SELECT id, asset FROM music WHERE asset != ''`)
	if err != nil {
		return fmt.Errorf("read music assets: %w", err)
	}
	type musicRow struct {
		ID    string
		Asset string
	}
	var musics []musicRow
	for rows.Next() {
		var m musicRow
		if err := rows.Scan(&m.ID, &m.Asset); err != nil {
			rows.Close()
			return fmt.Errorf("scan music asset row: %w", err)
		}
		musics = append(musics, m)
	}
	if err := rows.Close(); err != nil {
		return fmt.Errorf("close music asset rows: %w", err)
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("iterate music asset rows: %w", err)
	}

	for _, m := range musics {
		if err := ctx.Err(); err != nil {
			return err
		}
		path := filepath.Join(env.DataDir, "assets", "music", m.Asset)
		inspectCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
		info, inspectErr := musicasset.Inspect(inspectCtx, path)
		cancel()
		if inspectErr != nil {
			fmt.Fprintf(os.Stderr, "data: backfill music asset info %s: %v\n", m.ID, inspectErr)
		}
		if info.Size == 0 && inspectErr != nil {
			continue
		}
		if _, err := env.Tx.ExecContext(
			ctx,
			`UPDATE music SET assetSize=?, assetDurationMs=?, assetCodec=?, assetBitRate=? WHERE id=?`,
			info.Size, info.DurationMs, info.Codec, info.BitRate, m.ID,
		); err != nil {
			return fmt.Errorf("backfill music asset info %s: %w", m.ID, err)
		}
	}
	return nil
}
