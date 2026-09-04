package migration

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
)

// Migration 122 -> 123 discards the former device-local directories. Their
// contents are recreated in scratch; uploaded assets and the database stay put.
func init() {
	Register(Migration{
		From:        BaselineVersion + 22,
		To:          BaselineVersion + 23,
		Description: "remove legacy cache, partial uploads and logs for scratch layout",
		Destructive: true,
		Up:          upScratchLayout,
	})
}

func upScratchLayout(ctx context.Context, env *Env) error {
	for _, name := range []string{"cache", "partial_uploads", "logs"} {
		if err := ctx.Err(); err != nil {
			return err
		}
		path := filepath.Join(env.DataDir, name)
		// Lstat includes dangling links. Trash moves the link itself, never its
		// target, and preserves the entry until the whole upgrade commits.
		if _, err := os.Lstat(path); errors.Is(err, os.ErrNotExist) {
			continue
		} else if err != nil {
			return fmt.Errorf("inspect legacy %s: %w", path, err)
		}
		if err := env.Journal.Trash(path); err != nil {
			return fmt.Errorf("remove legacy %s: %w", path, err)
		}
	}
	return nil
}
