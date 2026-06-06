package migration

import "context"

// Migration 114 -> 115: repair artist photo files that were left in legacy
// singer_photo shards or directly under artist_photo by the initial artist
// rename migration.
func init() {
	Register(Migration{
		From:        BaselineVersion + 14,
		To:          BaselineVersion + 15,
		Description: "repair artist photo asset locations",
		Destructive: true,
		Up:          upRepairArtistPhotoAssets,
	})
}

func upRepairArtistPhotoAssets(_ context.Context, env *Env) error {
	if err := moveArtistPhotoRootFilesIntoShards(env); err != nil {
		return err
	}
	return moveSingerPhotoAssets(env)
}
