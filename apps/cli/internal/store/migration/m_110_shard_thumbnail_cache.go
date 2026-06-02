package migration

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
)

// Migration 109 -> 110: relocate thumbnail cache from a single flat directory
// to 256 hex-prefix shards. Cache files are regeneratable on demand, so the
// safest migration is to drop every flat file directly under cache/thumbnails;
// any newly-created subdirectory (i.e. a shard) is preserved. Subsequent
// requests will write into cache/thumbnails/{shard}/ via the updated handler.
func init() {
	Register(Migration{
		From:        BaselineVersion + 9,
		To:          BaselineVersion + 10,
		Description: "drop flat thumbnail cache files in favor of sharded layout",
		Destructive: true,
		Up:          upShardThumbnailCache,
	})
}

func upShardThumbnailCache(_ context.Context, env *Env) error {
	dir := filepath.Join(env.DataDir, "cache", "thumbnails")
	entries, err := os.ReadDir(dir)
	if errors.Is(err, os.ErrNotExist) {
		return nil
	} else if err != nil {
		return fmt.Errorf("read thumbnails dir: %w", err)
	}
	for _, entry := range entries {
		// shard 子目录由新版本继续使用, 必须保留
		if entry.IsDir() {
			continue
		}
		path := filepath.Join(dir, entry.Name())
		if err := env.Journal.Trash(path); err != nil {
			return fmt.Errorf("remove legacy thumbnail %s: %w", entry.Name(), err)
		}
	}
	return nil
}
