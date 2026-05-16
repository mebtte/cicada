package migration

import (
	"context"
	"fmt"
)

// Migration 101 -> 102: drop music_modify_record. The modify history was unused
// by clients and only added churn (insert on every metadata edit, daily TTL
// sweep). Same rationale as the singer_modify_record drop in m_101.
func init() {
	Register(Migration{
		From:        BaselineVersion + 1,
		To:          BaselineVersion + 2,
		Description: "drop music_modify_record",
		Destructive: true,
		Up:          upDropMusicModifyRecord,
	})
}

func upDropMusicModifyRecord(ctx context.Context, env *Env) error {
	if _, err := env.Tx.ExecContext(ctx, `DROP TABLE IF EXISTS music_modify_record`); err != nil {
		return fmt.Errorf("drop music_modify_record: %w", err)
	}
	return nil
}
