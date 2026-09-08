package musictranscode

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"cicada/internal/config"
)

var cleanupMu sync.Mutex

// CleanCache retains valid eager caches indefinitely. Lazy expiry is based on
// the audio mtime, updated only by generation and actual playback requests.
func CleanCache(expire bool, now time.Time) (map[string]int64, error) {
	cleanupMu.Lock()
	defer cleanupMu.Unlock()
	metrics := map[string]int64{
		"scanned_music_transcode_cache_entries":         0,
		"removed_music_transcode_cache_entries":         0,
		"removed_expired_music_transcode_cache_entries": 0,
		"skipped_active_music_transcode_caches":         0,
		"failed_music_transcode_cache_entries":          0,
	}
	root := config.MusicTranscodeCacheDir()
	shards, err := os.ReadDir(root)
	if os.IsNotExist(err) {
		return metrics, nil
	}
	if err != nil {
		return metrics, err
	}
	var errs []error
	recordError := func(err error) {
		if err != nil {
			metrics["failed_music_transcode_cache_entries"]++
			errs = append(errs, err)
		}
	}
	for _, shard := range shards {
		// Legacy flat entries belong to the startup migration, not this scan.
		if !shard.IsDir() {
			continue
		}
		dir := filepath.Join(root, shard.Name())
		entries, err := os.ReadDir(dir)
		if os.IsNotExist(err) {
			continue
		}
		if err != nil {
			recordError(fmt.Errorf("read music cache shard %s: %w", dir, err))
			continue
		}
		metrics["scanned_music_transcode_cache_entries"] += int64(len(entries))
		groups := make(map[string]CacheEntry)
		for _, entry := range entries {
			// Temporary outputs share the final audio's lease, including the
			// source metadata temp file. Never classify an active temp as garbage.
			cache, ok := ParseCacheFilename(strings.TrimSuffix(entry.Name(), ".tmp"))
			if ok {
				groups[CacheName(cache.Asset, cache.Quality)] = cache
				continue
			}
			recordError(removeCacheFile(filepath.Join(dir, entry.Name()), "removed_invalid_music_transcode_cache_entries", metrics))
		}
		for name, cache := range groups {
			path := filepath.Join(dir, name)
			releaseShard := beginUse(dir)
			idle, err := withIdleCache(path, func(state *cacheState) error {
				return cleanCacheGroup(path, cache, state, expire, now, metrics)
			})
			releaseShard()
			if !idle {
				metrics["skipped_active_music_transcode_caches"]++
			}
			recordError(err)
		}
		// Recheck under the shard lease to avoid racing a new output creation.
		_, err = withIdleCache(dir, func(_ *cacheState) error {
			remaining, err := os.ReadDir(dir)
			if os.IsNotExist(err) {
				return nil
			}
			if err != nil {
				return err
			}
			if len(remaining) == 0 {
				return os.Remove(dir)
			}
			return nil
		})
		recordError(err)
	}
	return metrics, errors.Join(errs...)
}

func cleanCacheGroup(path string, cache CacheEntry, state *cacheState, expire bool, now time.Time, metrics map[string]int64) error {
	// All decisions use fresh filesystem state while requests/generation are
	// excluded. The directory snapshot is used only to discover candidate keys.
	_, source := config.AssetPath(config.AssetTypeMusic, cache.Asset)
	if _, err := os.Stat(source); os.IsNotExist(err) {
		return removeCacheGroup(path, cache.Quality, state, "removed_missing_source_music_transcode_cache_entries", metrics)
	} else if err != nil {
		return err
	}
	info, err := os.Lstat(path)
	if os.IsNotExist(err) {
		return removeCacheGroup(path, cache.Quality, state, "removed_orphan_music_transcode_cache_metadata", metrics)
	}
	if err != nil {
		return err
	}
	if !info.Mode().IsRegular() {
		return removeCacheGroup(path, cache.Quality, state, "removed_invalid_music_transcode_cache_entries", metrics)
	}
	if cache.Quality == QualitySource {
		metaInfo, err := os.Lstat(path + ".json")
		if err != nil && !os.IsNotExist(err) {
			return err
		}
		if os.IsNotExist(err) || !metaInfo.Mode().IsRegular() {
			return removeCacheGroup(path, cache.Quality, state, "removed_incomplete_music_transcode_cache_entries", metrics)
		}
		if _, err := readSourceCacheMetadata(path + ".json"); err != nil {
			var pathErr *os.PathError
			if errors.As(err, &pathErr) {
				return err
			}
			return removeCacheGroup(path, cache.Quality, state, "removed_invalid_music_transcode_cache_metadata", metrics)
		}
	}
	if expire && !state.touchFailed.Load() && info.ModTime().Before(now.Add(-CacheIdleTTL)) {
		return removeCacheGroup(path, cache.Quality, state, "removed_expired_music_transcode_cache_entries", metrics)
	}
	if expire && state.touchFailed.Load() {
		metrics["skipped_untracked_music_transcode_caches"]++
	}
	// With no generator active, any remaining temp outputs are abandoned.
	err = removeCacheFile(path+".tmp", "removed_invalid_music_transcode_cache_entries", metrics)
	if cache.Quality == QualitySource {
		err = errors.Join(err, removeCacheFile(path+".json.tmp", "removed_invalid_music_transcode_cache_entries", metrics))
	}
	return err
}

func removeCacheGroup(path string, quality Quality, state *cacheState, reason string, metrics map[string]int64) error {
	paths := []string{path, path + ".tmp"}
	if quality == QualitySource {
		paths = append(paths, path+".json", path+".json.tmp")
	}
	var errs []error
	for _, p := range paths {
		if err := removeCacheFile(p, reason, metrics); err != nil {
			errs = append(errs, err)
		}
	}
	if len(errs) == 0 {
		state.touchFailed.Store(false)
	}
	return errors.Join(errs...)
}

func removeCacheFile(path, reason string, metrics map[string]int64) error {
	if _, err := os.Lstat(path); os.IsNotExist(err) {
		return nil
	} else if err != nil {
		return err
	}
	if err := os.RemoveAll(path); err != nil {
		return fmt.Errorf("remove music cache %s: %w", path, err)
	}
	metrics[reason]++
	metrics["removed_music_transcode_cache_entries"]++
	return nil
}
