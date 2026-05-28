package migration

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
)

// Migration 108 -> 109: remove loose files left directly under the logs and
// cache root directories by old versions. Current binaries only write logs and
// cache into managed subdirectories (logs/access, logs/scheduler,
// cache/thumbnails, cache/music_transcoded), so any plain file sitting in the
// roots is stale. Subdirectories are preserved; only regular files are removed.
func init() {
	Register(Migration{
		From:        BaselineVersion + 8,
		To:          BaselineVersion + 9,
		Description: "remove legacy files under logs and cache roots",
		Destructive: true,
		Up:          upRemoveLegacyRootFiles,
	})
}

func upRemoveLegacyRootFiles(_ context.Context, env *Env) error {
	// 仅清理 logs / cache 根目录下散落的旧版本文件; 子目录(access、scheduler、
	// thumbnails、music_transcoded)由当前版本继续使用, 必须保留。
	for _, name := range []string{"logs", "cache"} {
		dir := filepath.Join(env.DataDir, name)
		entries, err := os.ReadDir(dir)
		if errors.Is(err, os.ErrNotExist) {
			continue
		} else if err != nil {
			return fmt.Errorf("read %s dir: %w", name, err)
		}
		for _, entry := range entries {
			// 跳过子目录, 只移除根目录下的普通文件
			if entry.IsDir() {
				continue
			}
			path := filepath.Join(dir, entry.Name())
			// 通过 Journal 移入 upgrade.trash, 迁移失败时可回滚
			if err := env.Journal.Trash(path); err != nil {
				return fmt.Errorf("remove legacy %s file %s: %w", name, entry.Name(), err)
			}
		}
	}
	return nil
}
