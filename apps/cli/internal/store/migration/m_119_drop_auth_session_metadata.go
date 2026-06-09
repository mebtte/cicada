package migration

import (
	"context"
	"fmt"
)

// Migration 118 -> 119: drop the userAgent, createIP and lastSeenIP columns
// from auth_session. The fields are no longer surfaced anywhere in the API and
// keeping IP/UA on every authenticated request is unnecessary metadata.
//
// None of the dropped columns carry a REFERENCES clause, so a plain
// ALTER TABLE DROP COLUMN is enough (no table rebuild required).
func init() {
	Register(Migration{
		From:        BaselineVersion + 18,
		To:          BaselineVersion + 19,
		Description: "drop auth_session userAgent / createIP / lastSeenIP columns",
		Destructive: true,
		Up:          upDropAuthSessionMetadata,
	})
}

func upDropAuthSessionMetadata(ctx context.Context, env *Env) error {
	for _, column := range []string{"userAgent", "createIP", "lastSeenIP"} {
		exists, err := migrationColumnExists(ctx, env.Tx, "auth_session", column)
		if err != nil {
			return err
		}
		if !exists {
			continue
		}
		if _, err := env.Tx.ExecContext(ctx, fmt.Sprintf(`ALTER TABLE auth_session DROP COLUMN %s`, column)); err != nil {
			return fmt.Errorf("drop auth_session.%s: %w", column, err)
		}
	}
	return nil
}
