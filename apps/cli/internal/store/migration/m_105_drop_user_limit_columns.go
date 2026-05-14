package migration

import (
	"context"
	"fmt"
)

// Migration 104 -> 105: remove per-user limit/retention settings. Musicbills
// now use a fixed service-side cap, music creation has no daily cap, and play
// records are no longer cleaned by a per-user retention value.
func init() {
	Register(Migration{
		From:        BaselineVersion + 4,
		To:          BaselineVersion + 5,
		Description: "drop obsolete user limit columns",
		Destructive: true,
		Up:          upDropUserLimitColumns,
	})
}

func upDropUserLimitColumns(ctx context.Context, env *Env) error {
	for _, column := range []string{
		"musicbillMaxAmount",
		"createMusicMaxAmountPerDay",
		"musicPlayRecordIndate",
	} {
		exists, err := migrationColumnExists(ctx, env.Tx, "user", column)
		if err != nil {
			return err
		}
		if !exists {
			continue
		}
		if _, err := env.Tx.ExecContext(ctx, fmt.Sprintf(`ALTER TABLE user DROP COLUMN %s`, column)); err != nil {
			return fmt.Errorf("drop user.%s: %w", column, err)
		}
	}
	return nil
}
