package migration

import (
	"context"
	"fmt"
)

// Migration 106 -> 107: add client-side play session identity so repeated
// playback progress uploads can be merged without duplicate records or heat.
func init() {
	Register(Migration{
		From:        BaselineVersion + 6,
		To:          BaselineVersion + 7,
		Description: "add idempotent play record uploads",
		Up:          upPlayRecordIdempotency,
	})
}

func upPlayRecordIdempotency(ctx context.Context, env *Env) error {
	for _, column := range []struct {
		Name string
		DDL  string
	}{
		{Name: "clientRecordId", DDL: "clientRecordId TEXT NOT NULL DEFAULT ''"},
		{Name: "heatCounted", DDL: "heatCounted INTEGER NOT NULL DEFAULT 0"},
	} {
		exists, err := migrationColumnExists(ctx, env.Tx, "music_play_record", column.Name)
		if err != nil {
			return err
		}
		if exists {
			continue
		}
		if _, err := env.Tx.ExecContext(ctx, fmt.Sprintf(`ALTER TABLE music_play_record ADD COLUMN %s`, column.DDL)); err != nil {
			return fmt.Errorf("add music_play_record.%s: %w", column.Name, err)
		}
	}

	if _, err := env.Tx.ExecContext(ctx, `CREATE UNIQUE INDEX IF NOT EXISTS idx_music_play_record_client_record
		ON music_play_record(userId, clientRecordId)
		WHERE clientRecordId != ''`); err != nil {
		return fmt.Errorf("create music_play_record client record index: %w", err)
	}
	return nil
}
