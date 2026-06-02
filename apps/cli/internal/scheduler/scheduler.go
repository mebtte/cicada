package scheduler

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"runtime/debug"
	"sync"
	"time"

	"cicada/internal/auth"
	"cicada/internal/config"
	"cicada/internal/musicasset"
	"cicada/internal/musictranscode"
	"cicada/internal/store"

	"github.com/robfig/cron/v3"
)

type schedulerJobResult struct {
	Summary string
	Metrics map[string]int64
}

type schedulerJobFunc func() (schedulerJobResult, error)

func Start() {
	c := cron.New()
	logger := newSchedulerLogger(config.SchedulerLogDir())

	// Daily jobs spread from 04:00, every 5 minutes apart
	jobs := []struct {
		name string
		fn   schedulerJobFunc
	}{
		{"remove_outdated_db", removeOutdatedDB},
		{"remove_unlinked_asset", removeUnlinkedAsset},
		{"clean_music_transcode_cache", cleanMusicTranscodeCache},
		{"pretranscode_music", pretranscodeMusic},
		{"decrease_music_heat", decreaseMusicHeat},
		{"remove_outdated_shared_invitation", removeOutdatedSharedInvitation},
		{"remove_outdated_auth_session", removeOutdatedAuthSession},
		{"clean_outdated_file", cleanOutdatedFile},
		{"clean_outdated_access_log", cleanOutdatedAccessLog},
		{"clean_outdated_scheduler_log", cleanOutdatedSchedulerLog},
		{"clean_outdated_partial_upload", cleanOutdatedPartialUpload},
	}

	hour, min := 4, 0
	for _, job := range jobs {
		job := job // capture
		schedule := fmt.Sprintf("%d %d * * *", min, hour)
		c.AddFunc(schedule, func() {
			runScheduledJob(logger, job.name, job.fn)
		})
		min += 5
		if min >= 60 {
			min = 0
			hour++
		}
	}

	c.Start()
}

var pretranscodeMusicMu sync.Mutex

func runScheduledJob(logger *schedulerLogger, name string, fn schedulerJobFunc) {
	start := time.Now()
	_ = logger.write(schedulerLogRecord{
		Time:   start.Format(time.RFC3339Nano),
		Job:    name,
		Status: "start",
	})
	defer func() {
		if r := recover(); r != nil {
			_ = logger.write(schedulerLogRecord{
				Time:       time.Now().Format(time.RFC3339Nano),
				Job:        name,
				Status:     "panic",
				DurationMS: time.Since(start).Milliseconds(),
				Error:      fmt.Sprintf("%v\n%s", r, debug.Stack()),
			})
		}
	}()

	result, err := fn()
	if err != nil {
		_ = logger.write(schedulerLogRecord{
			Time:       time.Now().Format(time.RFC3339Nano),
			Job:        name,
			Status:     "error",
			DurationMS: time.Since(start).Milliseconds(),
			Summary:    result.Summary,
			Metrics:    result.Metrics,
			Error:      err.Error(),
		})
		return
	}
	_ = logger.write(schedulerLogRecord{
		Time:       time.Now().Format(time.RFC3339Nano),
		Job:        name,
		Status:     "finish",
		DurationMS: time.Since(start).Milliseconds(),
		Summary:    result.Summary,
		Metrics:    result.Metrics,
	})
}

// removeOutdatedDB deletes expired captcha records.
func removeOutdatedDB() (schedulerJobResult, error) {
	now := time.Now().UnixMilli()
	tables := []struct {
		table     string
		col       string
		ttlMillis int64
	}{
		{"captcha", "createTimestamp", int64(3 * 24 * time.Hour / time.Millisecond)},
	}
	metrics := map[string]int64{}
	var errs []error
	for _, t := range tables {
		affected, err := execRowsAffected(
			fmt.Sprintf(`DELETE FROM %s WHERE %s <= ?`, t.table, t.col),
			now-t.ttlMillis,
		)
		metrics["deleted_"+t.table] = affected
		if err != nil {
			errs = append(errs, fmt.Errorf("delete outdated rows from %s: %w", t.table, err))
		}
	}
	return schedulerJobResult{
		Summary: "deleted expired database rows",
		Metrics: metrics,
	}, errors.Join(errs...)
}

// removeUnlinkedAsset removes asset files not referenced by the DB.
func removeUnlinkedAsset() (schedulerJobResult, error) {
	type assetQuery struct {
		assetType config.AssetType
		query     string
	}
	queries := []assetQuery{
		{config.AssetTypeUserAvatar, `SELECT DISTINCT avatar FROM user WHERE avatar != ''`},
		{config.AssetTypeMusicbillCover, `SELECT DISTINCT cover FROM musicbill WHERE cover != ''`},
		{config.AssetTypeSingerPhoto, `SELECT DISTINCT asset FROM singer_photo WHERE asset != ''`},
		{config.AssetTypeMusicCover, `SELECT DISTINCT cover FROM music WHERE cover != ''`},
		{config.AssetTypeMusic, `SELECT DISTINCT asset FROM music WHERE asset != ''`},
	}

	metrics := map[string]int64{}
	var errs []error
	var totalRemoved int64
	for _, aq := range queries {
		prefix := string(aq.assetType)
		rows, err := store.DB().Query(aq.query)
		if err != nil {
			errs = append(errs, fmt.Errorf("query linked %s assets: %w", aq.assetType, err))
			continue
		}
		linked := map[string]bool{}
		scanFailed := false
		for rows.Next() {
			var v string
			if err := rows.Scan(&v); err != nil {
				errs = append(errs, fmt.Errorf("scan linked %s asset: %w", aq.assetType, err))
				scanFailed = true
				break
			}
			if v != "" {
				linked[v] = true
			}
		}
		if err := rows.Err(); err != nil {
			errs = append(errs, fmt.Errorf("iterate linked %s assets: %w", aq.assetType, err))
			scanFailed = true
		}
		rows.Close()
		metrics[prefix+"_linked_files"] = int64(len(linked))
		if scanFailed {
			continue
		}

		dir := config.AssetDir(aq.assetType)
		entries, err := os.ReadDir(dir)
		if err != nil {
			errs = append(errs, fmt.Errorf("read %s asset dir: %w", aq.assetType, err))
			continue
		}
		metrics[prefix+"_scanned_files"] = int64(len(entries))

		var unlinked []string
		for _, e := range entries {
			if !e.IsDir() && !linked[e.Name()] {
				unlinked = append(unlinked, e.Name())
			}
		}
		if len(unlinked) == 0 {
			continue
		}

		var removed int64
		for _, name := range unlinked {
			if err := os.Remove(filepath.Join(dir, name)); err != nil {
				errs = append(errs, fmt.Errorf("remove unlinked %s asset %s: %w", aq.assetType, name, err))
				continue
			}
			removed++
		}
		metrics[prefix+"_unlinked_files"] = int64(len(unlinked))
		metrics[prefix+"_removed_files"] = removed
		totalRemoved += removed
	}
	metrics["removed_files"] = totalRemoved
	return schedulerJobResult{
		Summary: fmt.Sprintf("removed %d unlinked asset files", totalRemoved),
		Metrics: metrics,
	}, errors.Join(errs...)
}

func cleanMusicTranscodeCache() (schedulerJobResult, error) {
	dir := config.MusicTranscodeCacheDir()
	entries, err := os.ReadDir(dir)
	if err != nil {
		if os.IsNotExist(err) {
			return schedulerJobResult{
				Summary: "removed 0 invalid music transcode cache entries",
				Metrics: map[string]int64{"removed_music_transcode_cache_entries": 0},
			}, nil
		}
		return schedulerJobResult{}, err
	}

	entryNames := map[string]bool{}
	for _, entry := range entries {
		entryNames[entry.Name()] = true
	}

	metrics := map[string]int64{
		"scanned_music_transcode_cache_entries": int64(len(entries)),
	}
	var errs []error
	var totalRemoved int64
	removeEntry := func(name, metric string) {
		if err := os.RemoveAll(filepath.Join(dir, name)); err != nil {
			errs = append(errs, fmt.Errorf("remove music transcode cache %s: %w", name, err))
			return
		}
		delete(entryNames, name)
		metrics[metric]++
		totalRemoved++
	}

	for _, entry := range entries {
		name := entry.Name()
		if !entry.Type().IsRegular() {
			removeEntry(name, "removed_invalid_music_transcode_cache_entries")
			continue
		}

		cacheEntry, ok := musictranscode.ParseCacheFilename(name)
		if !ok {
			removeEntry(name, "removed_invalid_music_transcode_cache_entries")
			continue
		}

		sourcePath := filepath.Join(config.AssetDir(config.AssetTypeMusic), cacheEntry.Asset)
		if _, err := os.Stat(sourcePath); err != nil {
			if os.IsNotExist(err) {
				removeEntry(name, "removed_missing_source_music_transcode_cache_entries")
				continue
			}
			errs = append(errs, fmt.Errorf("stat music transcode source %s: %w", cacheEntry.Asset, err))
			continue
		}

		if cacheEntry.Quality != musictranscode.QualitySource {
			continue
		}

		audioName := musictranscode.CacheName(cacheEntry.Asset, musictranscode.QualitySource)
		metaName := musictranscode.SourceCacheMetadataName(cacheEntry.Asset)
		if cacheEntry.Sidecar {
			if !entryNames[audioName] {
				removeEntry(name, "removed_orphan_music_transcode_cache_metadata")
				continue
			}
			if _, err := musictranscode.ReadSourceCacheMetadata(cacheEntry.Asset); err != nil {
				removeEntry(name, "removed_invalid_music_transcode_cache_metadata")
			}
			continue
		}

		// source 缓存依赖 sidecar 响应头元数据; 缺失或损坏时删除音频缓存, 让后续请求重新生成。
		if !entryNames[metaName] {
			removeEntry(name, "removed_incomplete_music_transcode_cache_entries")
			continue
		}
		if _, err := musictranscode.ReadSourceCacheMetadata(cacheEntry.Asset); err != nil {
			removeEntry(name, "removed_incomplete_music_transcode_cache_entries")
		}
	}

	metrics["removed_music_transcode_cache_entries"] = totalRemoved
	return schedulerJobResult{
		Summary: fmt.Sprintf("removed %d invalid music transcode cache entries", totalRemoved),
		Metrics: metrics,
	}, errors.Join(errs...)
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

func decreaseMusicHeat() (schedulerJobResult, error) {
	updated, err := execRowsAffected(
		`UPDATE music
		SET heat = CASE WHEN heat > 0 THEN heat - 1 ELSE 0 END
		WHERE heat != 0`,
	)
	return schedulerJobResult{
		Summary: fmt.Sprintf("decreased heat for %d music rows", updated),
		Metrics: map[string]int64{"updated_music_heat_rows": updated},
	}, err
}

// removeOutdatedSharedInvitation removes unanswered shared musicbill invitations older than 3 days.
func removeOutdatedSharedInvitation() (schedulerJobResult, error) {
	threshold := time.Now().Add(-3 * 24 * time.Hour).UnixMilli()
	deleted, err := execRowsAffected(
		`DELETE FROM shared_musicbill WHERE inviteTimestamp <= ? AND accepted=0`,
		threshold,
	)
	return schedulerJobResult{
		Summary: fmt.Sprintf("deleted %d unanswered shared musicbill invitations older than 3 days", deleted),
		Metrics: map[string]int64{"deleted_shared_invitations": deleted},
	}, err
}

func removeOutdatedAuthSession() (schedulerJobResult, error) {
	now := time.Now()
	deleted, err := store.DeleteOutdatedAuthSessions(
		auth.SessionRevokedCleanupBefore(now),
		auth.SessionInactiveCleanupBefore(now),
	)
	return schedulerJobResult{
		Summary: fmt.Sprintf("deleted %d outdated auth sessions", deleted),
		Metrics: map[string]int64{"deleted_auth_sessions": deleted},
	}, err
}

// cleanOutdatedFile removes thumbnail cache files older than 30 days. Thumbnails
// live under cache/thumbnails/{shard}/ (256 shards by the first two hex chars
// of the source filename); we walk each shard and let empty shards be removed
// afterwards. Any plain file directly under cache/thumbnails is a leftover
// from the pre-shard layout and is left for the dedicated migration to clean.
func cleanOutdatedFile() (schedulerJobResult, error) {
	root := config.ThumbnailCacheDir()
	entries, err := os.ReadDir(root)
	if err != nil {
		if os.IsNotExist(err) {
			return schedulerJobResult{
				Summary: "thumbnail cache dir absent",
				Metrics: map[string]int64{"removed_thumbnail_cache_entries": 0},
			}, nil
		}
		return schedulerJobResult{}, err
	}
	var total int64
	var errs []error
	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		shardDir := filepath.Join(root, e.Name())
		removed, err := cleanOutdatedEntries(shardDir, 30*24*time.Hour, "")
		total += removed
		if err != nil {
			errs = append(errs, err)
		}
		remain, err := os.ReadDir(shardDir)
		if err == nil && len(remain) == 0 {
			_ = os.Remove(shardDir)
		}
	}
	return schedulerJobResult{
		Summary: fmt.Sprintf("removed %d outdated thumbnail cache entries", total),
		Metrics: map[string]int64{"removed_thumbnail_cache_entries": total},
	}, errors.Join(errs...)
}

func cleanOutdatedAccessLog() (schedulerJobResult, error) {
	removed, err := cleanOutdatedEntries(config.AccessLogDir(), 30*24*time.Hour, "")
	return schedulerJobResult{
		Summary: fmt.Sprintf("removed %d outdated access log entries", removed),
		Metrics: map[string]int64{"removed_access_log_entries": removed},
	}, err
}

func cleanOutdatedSchedulerLog() (schedulerJobResult, error) {
	removed, err := cleanOutdatedEntries(config.SchedulerLogDir(), 30*24*time.Hour, "")
	return schedulerJobResult{
		Summary: fmt.Sprintf("removed %d outdated scheduler log entries", removed),
		Metrics: map[string]int64{"removed_scheduler_log_entries": removed},
	}, err
}

func cleanOutdatedPartialUpload() (schedulerJobResult, error) {
	removed, err := musicasset.CleanOutdatedSessions(time.Now(), musicasset.PartialUploadTTL)
	return schedulerJobResult{
		Summary: fmt.Sprintf("removed %d outdated partial uploads", removed),
		Metrics: map[string]int64{"removed_partial_uploads": removed},
	}, err
}

func cleanOutdatedEntries(dir string, ttl time.Duration, skipNames ...string) (int64, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		if os.IsNotExist(err) {
			return 0, nil
		}
		return 0, err
	}
	now := time.Now()
	var removed int64
	var errs []error
	skip := map[string]bool{}
	for _, name := range skipNames {
		if name != "" {
			skip[name] = true
		}
	}
	for _, e := range entries {
		if skip[e.Name()] {
			continue
		}
		info, err := e.Info()
		if err != nil {
			errs = append(errs, fmt.Errorf("stat %s: %w", filepath.Join(dir, e.Name()), err))
			continue
		}
		if now.Sub(info.ModTime()) >= ttl {
			if err := os.RemoveAll(filepath.Join(dir, e.Name())); err != nil {
				errs = append(errs, fmt.Errorf("remove %s: %w", filepath.Join(dir, e.Name()), err))
				continue
			}
			removed++
		}
	}
	return removed, errors.Join(errs...)
}

func execRowsAffected(query string, args ...any) (int64, error) {
	res, err := store.DB().Exec(query, args...)
	return rowsAffected(res, err)
}

func rowsAffected(res sql.Result, err error) (int64, error) {
	if err != nil {
		return 0, err
	}
	affected, err := res.RowsAffected()
	if err != nil {
		return 0, err
	}
	return affected, nil
}
