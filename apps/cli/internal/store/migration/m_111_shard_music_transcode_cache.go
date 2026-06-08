package migration

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
)

// Migration 110 -> 111: relocate music transcode cache from a single flat
// directory to 256 hex-prefix shards. Cache files are regeneratable on demand
// (ffmpeg re-runs the next time a track is requested), so we drop every flat
// file directly under cache/music_transcoded; any newly-created subdirectory
// (i.e. a shard) is preserved. Subsequent requests write into
// cache/music_transcoded/{shard}/ via the updated musictranscode package.
func init() {
	Register(Migration{
		From:        BaselineVersion + 10,
		To:          BaselineVersion + 11,
		Description: "drop flat music transcode cache files in favor of sharded layout",
		Destructive: true,
		Up:          upShardMusicTranscodeCache,
	})
}

func upShardMusicTranscodeCache(_ context.Context, env *Env) error {
	dir := filepath.Join(env.DataDir, "cache", "music_transcoded")
	entries, err := os.ReadDir(dir)
	if errors.Is(err, os.ErrNotExist) {
		return nil
	} else if err != nil {
		return fmt.Errorf("read music transcode dir: %w", err)
	}
	for _, entry := range entries {
		// shard 子目录由新版本继续使用, 必须保留
		if entry.IsDir() {
			continue
		}
		path := filepath.Join(dir, entry.Name())
		if err := env.Journal.Trash(path); err != nil {
			return fmt.Errorf("remove legacy music transcode cache %s: %w", entry.Name(), err)
		}
	}
	return nil
}
