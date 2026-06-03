package handler

import (
	"context"
	"log"
	"time"

	"cicada/internal/config"
	"cicada/internal/musicasset"
	"cicada/internal/store"
)

const musicAssetInfoReadTimeout = time.Minute

func syncMusicAssetInfo(musicID string) {
	m, err := store.GetMusicByID(musicID)
	if err != nil {
		log.Printf("sync music asset info: get music %s: %v", musicID, err)
		return
	}

	_, sourcePath := config.AssetPath(config.AssetTypeMusic, m.Asset)
	ctx, cancel := context.WithTimeout(context.Background(), musicAssetInfoReadTimeout)
	info, inspectErr := musicasset.Inspect(ctx, sourcePath)
	cancel()
	if inspectErr != nil {
		log.Printf("sync music asset info: inspect %s: %v", sourcePath, inspectErr)
	}
	if err := store.UpdateMusicAssetInfo(musicID, info.Size, info.DurationMs, info.Codec, info.BitRate); err != nil {
		log.Printf("sync music asset info: update music %s: %v", musicID, err)
	}
}
