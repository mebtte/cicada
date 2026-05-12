package migration

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
)

// Migration 103 -> 104: replace JWT/tokenIdentifier auth with server-side
// auth sessions. This is a breaking auth upgrade; old JWTs are intentionally
// invalid after the upgrade.
func init() {
	Register(Migration{
		From:        BaselineVersion + 3,
		To:          BaselineVersion + 4,
		Description: "replace jwt auth with auth sessions",
		Destructive: true,
		Up:          upAuthSession,
	})
}

func upAuthSession(ctx context.Context, env *Env) error {
	if _, err := env.Tx.ExecContext(ctx, `CREATE TABLE IF NOT EXISTS auth_session (
		id TEXT PRIMARY KEY NOT NULL,
		userId TEXT NOT NULL REFERENCES user(id),
		tokenHash TEXT NOT NULL UNIQUE,
		tokenPrefix TEXT NOT NULL DEFAULT '',
		deviceName TEXT NOT NULL DEFAULT '',
		userAgent TEXT NOT NULL DEFAULT '',
		createIP TEXT NOT NULL DEFAULT '',
		lastSeenIP TEXT NOT NULL DEFAULT '',
		createTimestamp INTEGER NOT NULL,
		lastSeenTimestamp INTEGER NOT NULL,
		revokeTimestamp INTEGER DEFAULT NULL,
		revokeReason TEXT NOT NULL DEFAULT ''
	)`); err != nil {
		return fmt.Errorf("create auth_session: %w", err)
	}
	if _, err := env.Tx.ExecContext(ctx, `CREATE INDEX IF NOT EXISTS idx_auth_session_user
		ON auth_session(userId, revokeTimestamp, lastSeenTimestamp)`); err != nil {
		return fmt.Errorf("create auth_session user index: %w", err)
	}
	if _, err := env.Tx.ExecContext(ctx, `CREATE INDEX IF NOT EXISTS idx_auth_session_cleanup
		ON auth_session(revokeTimestamp, lastSeenTimestamp)`); err != nil {
		return fmt.Errorf("create auth_session cleanup index: %w", err)
	}

	exists, err := migrationColumnExists(ctx, env.Tx, "user", "tokenIdentifier")
	if err != nil {
		return err
	}
	if exists {
		if _, err := env.Tx.ExecContext(ctx, `ALTER TABLE user DROP COLUMN tokenIdentifier`); err != nil {
			return fmt.Errorf("drop user.tokenIdentifier: %w", err)
		}
	}

	_ = os.Remove(filepath.Join(env.DataDir, "jwt_secret"))
	return nil
}

func migrationColumnExists(ctx context.Context, tx *sql.Tx, table, col string) (bool, error) {
	rows, err := tx.QueryContext(ctx, fmt.Sprintf("PRAGMA table_info(%s)", table))
	if err != nil {
		return false, fmt.Errorf("pragma table_info(%s): %w", table, err)
	}
	defer rows.Close()
	for rows.Next() {
		var cid int
		var name, ctype string
		var notnull, pk int
		var dflt sql.NullString
		if err := rows.Scan(&cid, &name, &ctype, &notnull, &dflt, &pk); err != nil {
			return false, fmt.Errorf("scan table_info(%s): %w", table, err)
		}
		if name == col {
			return true, nil
		}
	}
	return false, rows.Err()
}
