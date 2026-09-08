package migration

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
)

// The data version also gates scratch upgrades. Business data is unchanged;
// old music caches must be discarded before their mtime becomes access time,
// because some of them are hard links to uploaded originals.
func init() {
	Register(Migration{
		From:        BaselineVersion + 23,
		To:          BaselineVersion + 24,
		Description: "discard legacy music caches for independent files and access timestamps",
		Destructive: true,
		Up:          upMusicCacheAccess,
		ScratchUp:   scratchUpMusicCacheAccess,
	})
}

func upMusicCacheAccess(ctx context.Context, _ *Env) error {
	return ctx.Err()
}

func scratchUpMusicCacheAccess(ctx context.Context, env *ScratchEnv) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	path := filepath.Join(env.ScratchDir, "music_transcoded")
	if _, err := os.Lstat(path); err == nil {
		// Journal the whole directory before recreating it. Recovery removes the
		// replacement first and restores the original cache if the step fails.
		// Trash also moves a symlink itself without touching its target.
		if err := env.Journal.Trash(path); err != nil {
			return fmt.Errorf("discard legacy music cache: %w", err)
		}
	} else if !errors.Is(err, os.ErrNotExist) {
		return fmt.Errorf("inspect legacy music cache: %w", err)
	}
	return env.EnsureDir("music_transcoded")
}
