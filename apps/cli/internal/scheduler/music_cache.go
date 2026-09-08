package scheduler

import (
	"cicada/internal/config"
	"cicada/internal/musictranscode"
	"cicada/internal/store"
	"context"
	"errors"
	"fmt"
	"sync"
	"time"
)

var pretranscodeMusicMu sync.Mutex

func cleanMusicTranscodeCache() (schedulerJobResult, error) {
	metrics, err := musictranscode.CleanCache(config.Get().MusicTranscode == config.MusicTranscodeLazy, time.Now())
	return schedulerJobResult{
		Summary: fmt.Sprintf("removed %d music transcode cache entries (%d expired)", metrics["removed_music_transcode_cache_entries"], metrics["removed_expired_music_transcode_cache_entries"]),
		Metrics: metrics,
	}, err
}

func pretranscodeMusic() (schedulerJobResult, error) {
	pretranscodeMusicMu.Lock()
	defer pretranscodeMusicMu.Unlock()

	musics, err := store.GetAllMusic()
	if err != nil {
		return schedulerJobResult{}, err
	}

	metrics := map[string]int64{
		"scanned_music_rows": int64(len(musics)),
	}
	var errs []error
	seen := map[string]bool{}
	for _, music := range musics {
		if music.Asset == "" {
			metrics["skipped_empty_music_asset_rows"]++
			continue
		}
		if seen[music.Asset] {
			metrics["skipped_duplicate_music_assets"]++
			continue
		}
		seen[music.Asset] = true

		for _, quality := range []musictranscode.Quality{
			musictranscode.QualitySmooth,
			musictranscode.QualitySource,
		} {
			result, err := musictranscode.EnsureBackground(context.Background(), music.Asset, quality)
			if err != nil {
				metrics["failed_music_transcode_cache_entries"]++
				errs = append(errs, fmt.Errorf("pretranscode %s %s: %w", music.Asset, quality, err))
				continue
			}
			if result.Generated {
				metrics["generated_music_transcode_cache_entries"]++
			} else {
				metrics["skipped_existing_music_transcode_cache_entries"]++
			}
		}
	}

	return schedulerJobResult{
		Summary: fmt.Sprintf(
			"generated %d music transcode cache entries",
			metrics["generated_music_transcode_cache_entries"],
		),
		Metrics: metrics,
	}, errors.Join(errs...)
}
