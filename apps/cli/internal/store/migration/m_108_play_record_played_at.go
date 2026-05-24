package migration

import (
	"context"
	"fmt"
)

// Migration 107 -> 108: clarify that play-record time is when playback
// happened on the client, not when the server received the upload.
func init() {
	Register(Migration{
		From:        BaselineVersion + 7,
		To:          BaselineVersion + 8,
		Description: "rename play record timestamp to playedAt",
		Up:          upPlayRecordPlayedAt,
	})
}

func upPlayRecordPlayedAt(ctx context.Context, env *Env) error {
	playedAtExists, err := migrationColumnExists(ctx, env.Tx, "music_play_record", "playedAt")
	if err != nil {
		return err
	}
	if playedAtExists {
		return nil
	}
	timestampExists, err := migrationColumnExists(ctx, env.Tx, "music_play_record", "timestamp")
	if err != nil {
		return err
	}
	if !timestampExists {
		return fmt.Errorf("music_play_record timestamp column does not exist")
	}
	if _, err := env.Tx.ExecContext(ctx, `ALTER TABLE music_play_record RENAME COLUMN timestamp TO playedAt`); err != nil {
		return fmt.Errorf("rename music_play_record.timestamp: %w", err)
	}
	return nil
}
