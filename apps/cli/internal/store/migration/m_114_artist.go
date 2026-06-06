package migration

import (
	"context"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
)

// Migration 113 -> 114: generalize singer entities to artists, preserving the
// singer relation as a music role and adding lyricist relations.
func init() {
	Register(Migration{
		From:        BaselineVersion + 13,
		To:          BaselineVersion + 14,
		Description: "rename singers to artists and add lyricist relation",
		Destructive: true,
		Up:          upArtist,
	})
}

func upArtist(ctx context.Context, env *Env) error {
	if err := moveSingerPhotoAssets(env); err != nil {
		return err
	}
	if _, err := env.Tx.ExecContext(ctx, `ALTER TABLE singer RENAME TO artist`); err != nil {
		return fmt.Errorf("rename singer to artist: %w", err)
	}
	if err := rebuildArtistPhoto(ctx, env); err != nil {
		return err
	}
	if err := rebuildMusicSingerRelation(ctx, env); err != nil {
		return err
	}
	if _, err := env.Tx.ExecContext(ctx, `CREATE TABLE IF NOT EXISTS music_lyricist_relation (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		musicId TEXT NOT NULL REFERENCES music(id),
		artistId TEXT NOT NULL REFERENCES artist(id),
		UNIQUE(musicId, artistId) ON CONFLICT REPLACE
	)`); err != nil {
		return fmt.Errorf("create music_lyricist_relation: %w", err)
	}
	if _, err := env.Tx.ExecContext(ctx,
		`CREATE INDEX IF NOT EXISTS idx_music_lyricist_relation_music ON music_lyricist_relation(musicId)`,
	); err != nil {
		return fmt.Errorf("create idx_music_lyricist_relation_music: %w", err)
	}
	if _, err := env.Tx.ExecContext(ctx,
		`CREATE INDEX IF NOT EXISTS idx_music_lyricist_relation_artist ON music_lyricist_relation(artistId)`,
	); err != nil {
		return fmt.Errorf("create idx_music_lyricist_relation_artist: %w", err)
	}
	return nil
}

func moveSingerPhotoAssets(env *Env) error {
	oldDir := filepath.Join(env.DataDir, "assets", "singer_photo")
	newDir := filepath.Join(env.DataDir, "assets", "artist_photo")
	return moveArtistPhotoAssetTree(env, oldDir, newDir)
}

func moveArtistPhotoAssetTree(env *Env, oldDir, newDir string) error {
	err := filepath.WalkDir(oldDir, func(path string, entry fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return fmt.Errorf("walk %s: %w", path, walkErr)
		}
		if entry.IsDir() {
			return nil
		}
		info, err := entry.Info()
		if err != nil {
			return fmt.Errorf("stat %s: %w", path, err)
		}
		if !info.Mode().IsRegular() {
			return nil
		}

		name := entry.Name()
		to := filepath.Join(newDir, assetShard(name), name)
		if _, err := os.Stat(to); err == nil {
			return nil
		} else if !errors.Is(err, os.ErrNotExist) {
			return fmt.Errorf("stat %s: %w", to, err)
		}
		if err := env.Journal.Rename(path, to); err != nil {
			return fmt.Errorf("move artist photo %s: %w", name, err)
		}
		return nil
	})
	if errors.Is(err, os.ErrNotExist) {
		return nil
	}
	return err
}

func moveArtistPhotoRootFilesIntoShards(env *Env) error {
	root := filepath.Join(env.DataDir, "assets", "artist_photo")
	entries, err := os.ReadDir(root)
	if errors.Is(err, os.ErrNotExist) {
		return nil
	} else if err != nil {
		return fmt.Errorf("read %s: %w", root, err)
	}
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		info, err := entry.Info()
		if err != nil {
			return fmt.Errorf("stat %s: %w", entry.Name(), err)
		}
		if !info.Mode().IsRegular() {
			continue
		}

		name := entry.Name()
		from := filepath.Join(root, name)
		to := filepath.Join(root, assetShard(name), name)
		if _, err := os.Stat(to); err == nil {
			continue
		} else if !errors.Is(err, os.ErrNotExist) {
			return fmt.Errorf("stat %s: %w", to, err)
		}
		if err := env.Journal.Rename(from, to); err != nil {
			return fmt.Errorf("shard artist photo %s: %w", name, err)
		}
	}
	return nil
}

func assetShard(filename string) string {
	if len(filename) >= 2 {
		return filename[:2]
	}
	return "00"
}

func rebuildArtistPhoto(ctx context.Context, env *Env) error {
	if _, err := env.Tx.ExecContext(ctx, `ALTER TABLE singer_photo RENAME TO singer_photo_legacy`); err != nil {
		return fmt.Errorf("rename singer_photo: %w", err)
	}
	if _, err := env.Tx.ExecContext(ctx, `CREATE TABLE artist_photo (
		id TEXT PRIMARY KEY NOT NULL,
		artistId TEXT NOT NULL REFERENCES artist(id),
		asset TEXT NOT NULL,
		position INTEGER NOT NULL,
		description TEXT NOT NULL DEFAULT '',
		addUserId TEXT NOT NULL REFERENCES user(id),
		addTimestamp INTEGER NOT NULL
	)`); err != nil {
		return fmt.Errorf("create artist_photo: %w", err)
	}
	if _, err := env.Tx.ExecContext(ctx, `INSERT INTO artist_photo
		(id, artistId, asset, position, description, addUserId, addTimestamp)
		SELECT id, singerId, asset, position, description, addUserId, addTimestamp
		FROM singer_photo_legacy`); err != nil {
		return fmt.Errorf("copy artist_photo: %w", err)
	}
	if _, err := env.Tx.ExecContext(ctx, `DROP TABLE singer_photo_legacy`); err != nil {
		return fmt.Errorf("drop singer_photo_legacy: %w", err)
	}
	if _, err := env.Tx.ExecContext(ctx,
		`CREATE INDEX IF NOT EXISTS idx_artist_photo_artist ON artist_photo(artistId, position)`,
	); err != nil {
		return fmt.Errorf("create idx_artist_photo_artist: %w", err)
	}
	return nil
}

func rebuildMusicSingerRelation(ctx context.Context, env *Env) error {
	if _, err := env.Tx.ExecContext(ctx, `ALTER TABLE music_singer_relation RENAME TO music_singer_relation_legacy`); err != nil {
		return fmt.Errorf("rename music_singer_relation: %w", err)
	}
	if _, err := env.Tx.ExecContext(ctx, `CREATE TABLE music_singer_relation (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		musicId TEXT NOT NULL REFERENCES music(id),
		artistId TEXT NOT NULL REFERENCES artist(id),
		UNIQUE(musicId, artistId) ON CONFLICT REPLACE
	)`); err != nil {
		return fmt.Errorf("create music_singer_relation: %w", err)
	}
	if _, err := env.Tx.ExecContext(ctx, `INSERT INTO music_singer_relation
		(id, musicId, artistId)
		SELECT id, musicId, singerId
		FROM music_singer_relation_legacy`); err != nil {
		return fmt.Errorf("copy music_singer_relation: %w", err)
	}
	if _, err := env.Tx.ExecContext(ctx, `DROP TABLE music_singer_relation_legacy`); err != nil {
		return fmt.Errorf("drop music_singer_relation_legacy: %w", err)
	}
	if _, err := env.Tx.ExecContext(ctx,
		`CREATE INDEX IF NOT EXISTS idx_music_singer_relation_music ON music_singer_relation(musicId)`,
	); err != nil {
		return fmt.Errorf("create idx_music_singer_relation_music: %w", err)
	}
	if _, err := env.Tx.ExecContext(ctx,
		`CREATE INDEX IF NOT EXISTS idx_music_singer_relation_artist ON music_singer_relation(artistId)`,
	); err != nil {
		return fmt.Errorf("create idx_music_singer_relation_artist: %w", err)
	}
	return nil
}
