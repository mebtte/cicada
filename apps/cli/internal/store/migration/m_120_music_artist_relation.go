package migration

import (
	"context"
	"fmt"
)

// Migration 119 -> 120: merge per-role music artist relation tables into a
// single relation table keyed by role.
func init() {
	Register(Migration{
		From:        BaselineVersion + 19,
		To:          BaselineVersion + 20,
		Description: "merge music artist role relations",
		Destructive: true,
		Up:          upMusicArtistRelation,
	})
}

func upMusicArtistRelation(ctx context.Context, env *Env) error {
	if _, err := env.Tx.ExecContext(ctx, `CREATE TABLE IF NOT EXISTS music_artist_relation (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		musicId TEXT NOT NULL REFERENCES music(id),
		artistId TEXT NOT NULL REFERENCES artist(id),
		role TEXT NOT NULL CHECK(role IN ('performer','lyricist','composer')),
		position INTEGER NOT NULL DEFAULT 0,
		UNIQUE(musicId, role, artistId) ON CONFLICT REPLACE
	)`); err != nil {
		return fmt.Errorf("create music_artist_relation: %w", err)
	}

	if err := copyMusicArtistRole(ctx, env, "music_singer_relation", "performer"); err != nil {
		return err
	}
	if err := copyMusicArtistRole(ctx, env, "music_lyricist_relation", "lyricist"); err != nil {
		return err
	}
	if err := copyMusicArtistRole(ctx, env, "music_composer_relation", "composer"); err != nil {
		return err
	}

	for _, table := range []string{
		"music_singer_relation",
		"music_lyricist_relation",
		"music_composer_relation",
	} {
		if _, err := env.Tx.ExecContext(ctx, `DROP TABLE IF EXISTS `+table); err != nil {
			return fmt.Errorf("drop %s: %w", table, err)
		}
	}

	if _, err := env.Tx.ExecContext(ctx,
		`CREATE INDEX IF NOT EXISTS idx_music_artist_relation_music_role ON music_artist_relation(musicId, role, position)`,
	); err != nil {
		return fmt.Errorf("create idx_music_artist_relation_music_role: %w", err)
	}
	if _, err := env.Tx.ExecContext(ctx,
		`CREATE INDEX IF NOT EXISTS idx_music_artist_relation_artist_role ON music_artist_relation(artistId, role, position)`,
	); err != nil {
		return fmt.Errorf("create idx_music_artist_relation_artist_role: %w", err)
	}
	return nil
}

func copyMusicArtistRole(ctx context.Context, env *Env, table, role string) error {
	if _, err := env.Tx.ExecContext(ctx, `INSERT OR REPLACE INTO music_artist_relation
		(musicId, artistId, role, position)
		SELECT musicId, artistId, ?, id
		FROM `+table+`
		ORDER BY id`, role); err != nil {
		return fmt.Errorf("copy %s into music_artist_relation: %w", table, err)
	}
	return nil
}
