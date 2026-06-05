package migration

import "context"

// Migration 112 -> 113: add admin-maintained hidden search keyword fields for
// music and singers. These fields are plain text and only participate in search.
func init() {
	Register(Migration{
		From:        BaselineVersion + 12,
		To:          BaselineVersion + 13,
		Description: "add hidden search keywords for music and singers",
		Up:          upSearchKeywords,
	})
}

func upSearchKeywords(_ context.Context, env *Env) error {
	if _, err := env.Tx.Exec(`ALTER TABLE music ADD COLUMN searchKeywords TEXT NOT NULL DEFAULT ''`); err != nil {
		return err
	}
	if _, err := env.Tx.Exec(`ALTER TABLE singer ADD COLUMN searchKeywords TEXT NOT NULL DEFAULT ''`); err != nil {
		return err
	}
	return nil
}
