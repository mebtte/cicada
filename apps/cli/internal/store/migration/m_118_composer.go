package migration

import (
	"context"
	"fmt"
)

// Migration 117 -> 118: add music_composer_relation table to record the
// composer role alongside the existing singer and lyricist relations.
func init() {
	Register(Migration{
		From:        BaselineVersion + 17,
		To:          BaselineVersion + 18,
		Description: "add music_composer_relation table",
		Up:          upComposer,
	})
}

func upComposer(ctx context.Context, env *Env) error {
	if _, err := env.Tx.ExecContext(ctx, `CREATE TABLE IF NOT EXISTS music_composer_relation (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		musicId TEXT NOT NULL REFERENCES music(id),
		artistId TEXT NOT NULL REFERENCES artist(id),
		UNIQUE(musicId, artistId) ON CONFLICT REPLACE
	)`); err != nil {
		return fmt.Errorf("create music_composer_relation: %w", err)
	}
	if _, err := env.Tx.ExecContext(ctx,
		`CREATE INDEX IF NOT EXISTS idx_music_composer_relation_music ON music_composer_relation(musicId)`,
	); err != nil {
		return fmt.Errorf("create idx_music_composer_relation_music: %w", err)
	}
	if _, err := env.Tx.ExecContext(ctx,
		`CREATE INDEX IF NOT EXISTS idx_music_composer_relation_artist ON music_composer_relation(artistId)`,
	); err != nil {
		return fmt.Errorf("create idx_music_composer_relation_artist: %w", err)
	}
	return nil
}
