package migration

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"

	"cicada/internal/config"
)

// Migration 111 -> 112: shard data/assets/{type}/ into 256 hex-prefix buckets
// by filename[:2], and drop the now-unused .hashes/ dedup index. The DB still
// references assets by bare filename; resolution happens via config.AssetPath
// in code, so the public URL space is unaffected by the layout change.
//
// Behaviour:
//   - For each asset type, any plain file directly under assets/{type}/ is
//     os.Rename'd into assets/{type}/{filename[:2]}/. Same filesystem → O(1).
//   - assets/{type}/.hashes/ (the legacy sha256→filename marker tree) is
//     trashed wholesale; with .hashes removed the chunked-upload "秒传"
//     short-circuit no longer exists. Disk-level dedup is still provided by
//     the md5+ext filename rule and the os.Stat reuse check in FinaliseChunkedUpload.
//   - Pre-existing 2-hex shard subdirs are kept untouched (idempotent re-run).
//   - On crash mid-migration the next boot resumes: still-flat files are
//     processed, already-sharded files are skipped, and the dropped .hashes/
//     tree (already in the journal trash) is restored on rollback.
func init() {
	Register(Migration{
		From:        BaselineVersion + 11,
		To:          BaselineVersion + 12,
		Description: "shard assets by 2-hex prefix and remove .hashes dedup index",
		Destructive: true,
		Up:          upShardAssets,
	})
}

func upShardAssets(_ context.Context, env *Env) error {
	for _, at := range config.AllAssetTypes {
		root := filepath.Join(env.DataDir, "assets", string(at))

		hashesDir := filepath.Join(root, ".hashes")
		if info, err := os.Stat(hashesDir); err == nil && info.IsDir() {
			if err := env.Journal.Trash(hashesDir); err != nil {
				return fmt.Errorf("trash %s/.hashes: %w", at, err)
			}
		} else if err != nil && !errors.Is(err, os.ErrNotExist) {
			return fmt.Errorf("stat %s/.hashes: %w", at, err)
		}

		entries, err := os.ReadDir(root)
		if errors.Is(err, os.ErrNotExist) {
			continue
		} else if err != nil {
			return fmt.Errorf("read assets/%s: %w", at, err)
		}

		for _, entry := range entries {
			if entry.IsDir() {
				// 已存在的 shard 子目录或其它子目录(如 .hashes 已经在上面 trash 了, 此处不会再看到)一律跳过
				continue
			}
			name := entry.Name()
			shard := "00"
			if len(name) >= 2 {
				shard = name[:2]
			}
			from := filepath.Join(root, name)
			to := filepath.Join(root, shard, name)
			if err := env.Journal.Rename(from, to); err != nil {
				return fmt.Errorf("move %s/%s into shard: %w", at, name, err)
			}
		}
	}
	return nil
}
