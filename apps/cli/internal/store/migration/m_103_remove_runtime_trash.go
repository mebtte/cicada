package migration

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
)

// Migration 102 -> 103: remove the old runtime trash directory. Deleted
// singers and unlinked assets are no longer staged under data/trash.
func init() {
	Register(Migration{
		From:        BaselineVersion + 2,
		To:          BaselineVersion + 3,
		Description: "remove runtime trash directory",
		Destructive: true,
		Up:          upRemoveRuntimeTrashDir,
	})
}

func upRemoveRuntimeTrashDir(_ context.Context, env *Env) error {
	trashDir := filepath.Join(env.DataDir, "trash")
	if _, err := os.Stat(trashDir); errors.Is(err, os.ErrNotExist) {
		return nil
	} else if err != nil {
		return fmt.Errorf("stat trash dir: %w", err)
	}

	if err := env.Journal.Trash(trashDir); err != nil {
		return fmt.Errorf("remove trash dir: %w", err)
	}
	return nil
}
