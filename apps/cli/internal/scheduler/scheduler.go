package scheduler

import (
	"database/sql"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"runtime/debug"
	"time"

	"cicada/internal/auth"
	"cicada/internal/config"
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
		{"remove_no_music_singer", removeNoMusicSinger},
		{"remove_unlinked_asset", removeUnlinkedAsset},
		{"decrease_music_heat", decreaseMusicHeat},
		{"remove_outdated_shared_invitation", removeOutdatedSharedInvitation},
		{"remove_outdated_auth_session", removeOutdatedAuthSession},
		{"clean_outdated_file", cleanOutdatedFile},
		{"clean_outdated_access_log", cleanOutdatedAccessLog},
		{"clean_outdated_scheduler_log", cleanOutdatedSchedulerLog},
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

// removeNoMusicSinger removes singers with no music that were created > 3 days ago.
func removeNoMusicSinger() (schedulerJobResult, error) {
	threshold := time.Now().Add(-3 * 24 * time.Hour).UnixMilli()
	rows, err := store.DB().Query(
		`SELECT id FROM singer
		WHERE id NOT IN (SELECT singerId FROM music_singer_relation)
		AND createTimestamp < ?`, threshold,
	)
	if err != nil {
		return schedulerJobResult{Summary: "failed to find no-music singers"}, err
	}
	defer rows.Close()

	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return schedulerJobResult{Summary: "failed to scan no-music singers"}, err
		}
		ids = append(ids, id)
	}
	if err := rows.Err(); err != nil {
		return schedulerJobResult{Summary: "failed to iterate no-music singers"}, err
	}

	metrics := map[string]int64{"candidate_singers": int64(len(ids))}
	if len(ids) == 0 {
		return schedulerJobResult{
			Summary: "no no-music singers older than 3 days",
			Metrics: metrics,
		}, nil
	}

	placeholders := store.Placeholders(len(ids))
	args := store.Strs2Any(ids)
	// Delete photos first since they reference singer; the asset files are
	// removed by removeUnlinkedAsset on the next run.
	deletedPhotos, photoErr := execRowsAffected(`DELETE FROM singer_photo WHERE singerId IN (`+placeholders+`)`, args...)
	metrics["deleted_singer_photos"] = deletedPhotos
	if photoErr != nil {
		return schedulerJobResult{
			Summary: "failed to remove photos for no-music singers",
			Metrics: metrics,
		}, photoErr
	}

	deletedSingers, singerErr := execRowsAffected(`DELETE FROM singer WHERE id IN (`+placeholders+`)`, args...)
	metrics["deleted_singers"] = deletedSingers
	return schedulerJobResult{
		Summary: fmt.Sprintf("removed %d no-music singers older than 3 days", deletedSingers),
		Metrics: metrics,
	}, singerErr
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

// cleanOutdatedFile removes files older than 30 days from runtime caches.
func cleanOutdatedFile() (schedulerJobResult, error) {
	type cleanDir struct {
		name     string
		path     string
		skipName string
	}

	dirs := []cleanDir{
		{
			name:     "cache",
			path:     config.CacheDir(),
			skipName: filepath.Base(config.ThumbnailCacheDir()),
		},
		{name: "thumbnail_cache", path: config.ThumbnailCacheDir()},
		{
			name: "music_transcode_cache",
			path: config.MusicTranscodeCacheDir(),
		},
	}

	metrics := map[string]int64{}
	var errs []error
	var totalRemoved int64
	for _, dir := range dirs {
		skipNames := []string{}
		if dir.path == config.CacheDir() {
			skipNames = append(
				skipNames,
				filepath.Base(config.ThumbnailCacheDir()),
				filepath.Base(config.MusicTranscodeCacheDir()),
			)
		} else if dir.skipName != "" {
			skipNames = append(skipNames, dir.skipName)
		}
		removed, err := cleanOutdatedEntries(dir.path, 30*24*time.Hour, skipNames...)
		metrics["removed_"+dir.name+"_entries"] = removed
		totalRemoved += removed
		if err != nil {
			errs = append(errs, fmt.Errorf("clean outdated %s entries: %w", dir.name, err))
		}
	}
	metrics["removed_entries"] = totalRemoved
	return schedulerJobResult{
		Summary: fmt.Sprintf("removed %d outdated cache entries", totalRemoved),
		Metrics: metrics,
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
