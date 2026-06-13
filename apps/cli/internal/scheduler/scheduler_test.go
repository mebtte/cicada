package scheduler

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"cicada/internal/config"
	"cicada/internal/musictranscode"
	"cicada/internal/store"
)

func TestCleanOutdatedFileDoesNotRemoveMusicTranscodeCache(t *testing.T) {
	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
	})

	for _, dir := range []string{
		config.CacheDir(),
		config.ThumbnailCacheDir(),
		config.MusicTranscodeCacheDir(),
	} {
		if err := os.MkdirAll(dir, 0755); err != nil {
			t.Fatalf("mkdir %s: %v", dir, err)
		}
	}

	oldTime := time.Now().Add(-31 * 24 * time.Hour)
	oldRootCache := filepath.Join(config.CacheDir(), "old-cache")
	legacyFlatThumbnail := filepath.Join(config.ThumbnailCacheDir(), "64_legacy.jpg")
	_, oldThumbnailShardA := config.ThumbnailCachePath(64, "abdeadbeef0001.jpg")
	_, oldThumbnailShardB := config.ThumbnailCachePath(128, "cd1122334455.jpg")
	_, freshThumbnail := config.ThumbnailCachePath(64, "ef9988776655.jpg")
	oldEmptyShardLeftover := filepath.Join(config.ThumbnailCacheDir(), "ab", "abold_32.jpg")
	oldTranscode := filepath.Join(config.MusicTranscodeCacheDir(), "song.flac_codec-aac_bitrate-192k.m4a")
	freshTranscode := filepath.Join(config.MusicTranscodeCacheDir(), "song.flac_codec-flac.flac")

	// 老分片 ab 里只剩一个超期文件 — 清理后整个 shard 应被移除
	// 老分片 cd 里只有一个超期文件 — 同上
	// 新分片 ef 里有一个新文件 — shard 必须保留
	allFiles := []string{
		oldRootCache,
		legacyFlatThumbnail,
		oldThumbnailShardA,
		oldEmptyShardLeftover,
		oldThumbnailShardB,
		freshThumbnail,
		oldTranscode,
		freshTranscode,
	}
	for _, path := range allFiles {
		if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
			t.Fatalf("mkdir %s: %v", filepath.Dir(path), err)
		}
		if err := os.WriteFile(path, []byte("cache"), 0644); err != nil {
			t.Fatalf("write %s: %v", path, err)
		}
	}
	for _, path := range []string{
		oldRootCache,
		legacyFlatThumbnail,
		oldThumbnailShardA,
		oldEmptyShardLeftover,
		oldThumbnailShardB,
		oldTranscode,
	} {
		if err := os.Chtimes(path, oldTime, oldTime); err != nil {
			t.Fatalf("chtimes %s: %v", path, err)
		}
	}

	if _, err := cleanOutdatedFile(); err != nil {
		t.Fatalf("cleanOutdatedFile: %v", err)
	}

	if info, err := os.Stat(config.ThumbnailCacheDir()); err != nil || !info.IsDir() {
		t.Fatalf("expected thumbnail cache dir to remain, info=%v err=%v", info, err)
	}
	if info, err := os.Stat(config.MusicTranscodeCacheDir()); err != nil || !info.IsDir() {
		t.Fatalf("expected music transcode cache dir to remain, info=%v err=%v", info, err)
	}
	// cache 根目录不再被定时清理, 根目录下的文件应保持不动
	if _, err := os.Stat(oldRootCache); err != nil {
		t.Fatalf("expected old root cache file to remain untouched: %v", err)
	}
	// 遗留平铺缩略图由 migration 负责清理, scheduler 不应动它
	if _, err := os.Stat(legacyFlatThumbnail); err != nil {
		t.Fatalf("expected legacy flat thumbnail to remain (migration handles it): %v", err)
	}
	for _, path := range []string{oldThumbnailShardA, oldEmptyShardLeftover, oldThumbnailShardB} {
		if _, err := os.Stat(path); !os.IsNotExist(err) {
			t.Fatalf("expected old thumbnail %s to be removed, err=%v", path, err)
		}
	}
	// 清空后的 shard 子目录也应被移除
	for _, shard := range []string{"ab", "cd"} {
		if _, err := os.Stat(filepath.Join(config.ThumbnailCacheDir(), shard)); !os.IsNotExist(err) {
			t.Fatalf("expected empty shard %s to be removed, err=%v", shard, err)
		}
	}
	if _, err := os.Stat(freshThumbnail); err != nil {
		t.Fatalf("expected fresh thumbnail cache file to remain: %v", err)
	}
	if _, err := os.Stat(oldTranscode); err != nil {
		t.Fatalf("expected old transcode cache file to remain: %v", err)
	}
	if _, err := os.Stat(freshTranscode); err != nil {
		t.Fatalf("expected fresh transcode cache file to remain: %v", err)
	}
}

func TestCleanMusicTranscodeCacheRemovesInvalidAndMissingSourceEntries(t *testing.T) {
	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
	})

	for _, dir := range []string{
		config.AssetDir(config.AssetTypeMusic),
		config.MusicTranscodeCacheDir(),
	} {
		if err := os.MkdirAll(dir, 0755); err != nil {
			t.Fatalf("mkdir %s: %v", dir, err)
		}
	}

	writeMusicAssetForCleanTest(t, "linked.mp3")
	writeMusicAssetForCleanTest(t, "incomplete.mp3")
	writeMusicAssetForCleanTest(t, "badmeta.mp3")

	_, validSmooth := config.MusicTranscodeCachePath("linked.mp3", musictranscode.CacheName("linked.mp3", musictranscode.QualitySmooth))
	_, validSource := config.MusicTranscodeCachePath("linked.mp3", musictranscode.CacheName("linked.mp3", musictranscode.QualitySource))
	_, validSourceMeta := config.MusicTranscodeCachePath("linked.mp3", musictranscode.SourceCacheMetadataName("linked.mp3"))
	_, missingSource := config.MusicTranscodeCachePath("missing.mp3", musictranscode.CacheName("missing.mp3", musictranscode.QualitySmooth))
	_, orphanMeta := config.MusicTranscodeCachePath("orphan.mp3", musictranscode.SourceCacheMetadataName("orphan.mp3"))
	_, incompleteSource := config.MusicTranscodeCachePath("incomplete.mp3", musictranscode.CacheName("incomplete.mp3", musictranscode.QualitySource))
	_, badMetaSource := config.MusicTranscodeCachePath("badmeta.mp3", musictranscode.CacheName("badmeta.mp3", musictranscode.QualitySource))
	_, badMeta := config.MusicTranscodeCachePath("badmeta.mp3", musictranscode.SourceCacheMetadataName("badmeta.mp3"))
	_, garbageInShard := config.MusicTranscodeCachePath("invalid.mp3", "linked.mp3_codec-aac_bitrate-192k.m4a")

	// 旧版本残留在 cache 根目录的扁平文件; scheduler 不应触及, 留给 migration 处理
	legacyRootFile := filepath.Join(config.MusicTranscodeCacheDir(), "linked.mp3_codec-aac_bitrate-192k.m4a")
	// 根目录下名字像缓存文件但实际是目录的怪异条目: 走 shard 路径会被当成空 shard 移除
	legalNameDir := filepath.Join(
		config.MusicTranscodeCacheDir(),
		musictranscode.CacheName("dir.mp3", musictranscode.QualitySmooth),
	)

	for _, path := range []string{
		validSmooth,
		validSource,
		missingSource,
		garbageInShard,
		orphanMeta,
		incompleteSource,
		badMetaSource,
	} {
		if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
			t.Fatalf("mkdir %s: %v", filepath.Dir(path), err)
		}
		if err := os.WriteFile(path, []byte("cache"), 0644); err != nil {
			t.Fatalf("write %s: %v", path, err)
		}
	}
	if err := os.WriteFile(validSourceMeta, []byte(`{"contentType":"audio/mpeg"}`), 0644); err != nil {
		t.Fatalf("write valid source meta: %v", err)
	}
	if err := os.WriteFile(badMeta, []byte(`{}`), 0644); err != nil {
		t.Fatalf("write bad source meta: %v", err)
	}
	if err := os.WriteFile(legacyRootFile, []byte("legacy"), 0644); err != nil {
		t.Fatalf("write legacy root file: %v", err)
	}
	if err := os.MkdirAll(legalNameDir, 0755); err != nil {
		t.Fatalf("mkdir legal name dir: %v", err)
	}

	result, err := cleanMusicTranscodeCache()
	if err != nil {
		t.Fatalf("clean music transcode cache: %v", err)
	}
	if result.Metrics["removed_music_transcode_cache_entries"] == 0 {
		t.Fatalf("expected removed cache entries, metrics=%+v", result.Metrics)
	}

	for _, path := range []string{validSmooth, validSource, validSourceMeta} {
		if _, err := os.Stat(path); err != nil {
			t.Fatalf("expected %s to remain: %v", path, err)
		}
	}
	if _, err := os.Stat(legacyRootFile); err != nil {
		t.Fatalf("expected legacy root file to remain (migration handles it): %v", err)
	}
	for _, path := range []string{
		missingSource,
		garbageInShard,
		orphanMeta,
		incompleteSource,
		badMetaSource,
		badMeta,
		legalNameDir,
	} {
		if _, err := os.Stat(path); !os.IsNotExist(err) {
			t.Fatalf("expected %s to be removed, err=%v", path, err)
		}
	}

	// 保留有效条目的 shard 必须仍在, 完全清空的 shard 必须随之被移除
	if _, err := os.Stat(filepath.Dir(validSmooth)); err != nil {
		t.Fatalf("expected shard with valid entries to remain: %v", err)
	}
	for _, path := range []string{missingSource, orphanMeta, incompleteSource, badMetaSource, garbageInShard} {
		if _, err := os.Stat(filepath.Dir(path)); !os.IsNotExist(err) {
			t.Fatalf("expected empty shard %s to be removed, err=%v", filepath.Dir(path), err)
		}
	}
}

func TestCleanOutdatedAccessLogRemovesOnlyOldAccessLogs(t *testing.T) {
	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
	})

	if err := os.MkdirAll(config.AccessLogDir(), 0755); err != nil {
		t.Fatalf("mkdir access log dir: %v", err)
	}

	oldTime := time.Now().Add(-31 * 24 * time.Hour)
	oldAccessLog := filepath.Join(config.AccessLogDir(), "access-old.log")
	freshAccessLog := filepath.Join(config.AccessLogDir(), "access-fresh.log")
	for _, path := range []string{oldAccessLog, freshAccessLog} {
		if err := os.WriteFile(path, []byte("access"), 0644); err != nil {
			t.Fatalf("write %s: %v", path, err)
		}
	}
	if err := os.Chtimes(oldAccessLog, oldTime, oldTime); err != nil {
		t.Fatalf("chtimes old access log: %v", err)
	}

	cleanOutdatedAccessLog()

	if info, err := os.Stat(config.AccessLogDir()); err != nil || !info.IsDir() {
		t.Fatalf("expected access log dir to remain, info=%v err=%v", info, err)
	}
	if _, err := os.Stat(oldAccessLog); !os.IsNotExist(err) {
		t.Fatalf("expected old access log to be removed, err=%v", err)
	}
	if _, err := os.Stat(freshAccessLog); err != nil {
		t.Fatalf("expected fresh access log to remain: %v", err)
	}
}

func TestCleanOutdatedSchedulerLogRemovesOnlyOldSchedulerLogs(t *testing.T) {
	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
	})

	if err := os.MkdirAll(config.SchedulerLogDir(), 0755); err != nil {
		t.Fatalf("mkdir scheduler log dir: %v", err)
	}

	oldTime := time.Now().Add(-31 * 24 * time.Hour)
	oldSchedulerLog := filepath.Join(config.SchedulerLogDir(), "scheduler-old.log")
	freshSchedulerLog := filepath.Join(config.SchedulerLogDir(), "scheduler-fresh.log")
	for _, path := range []string{oldSchedulerLog, freshSchedulerLog} {
		if err := os.WriteFile(path, []byte("scheduler"), 0644); err != nil {
			t.Fatalf("write %s: %v", path, err)
		}
	}
	if err := os.Chtimes(oldSchedulerLog, oldTime, oldTime); err != nil {
		t.Fatalf("chtimes old scheduler log: %v", err)
	}

	cleanOutdatedSchedulerLog()

	if info, err := os.Stat(config.SchedulerLogDir()); err != nil || !info.IsDir() {
		t.Fatalf("expected scheduler log dir to remain, info=%v err=%v", info, err)
	}
	if _, err := os.Stat(oldSchedulerLog); !os.IsNotExist(err) {
		t.Fatalf("expected old scheduler log to be removed, err=%v", err)
	}
	if _, err := os.Stat(freshSchedulerLog); err != nil {
		t.Fatalf("expected fresh scheduler log to remain: %v", err)
	}
}

func TestRunScheduledJobWritesSchedulerLog(t *testing.T) {
	dir := t.TempDir()
	logger := newSchedulerLogger(dir)

	runScheduledJob(logger, "test_job", func() (schedulerJobResult, error) {
		return schedulerJobResult{
			Summary: "did test work",
			Metrics: map[string]int64{"items": 2},
		}, nil
	})

	records := readSchedulerLogRecords(t, dir)
	if len(records) != 2 {
		t.Fatalf("expected 2 scheduler log records, got %d", len(records))
	}
	if records[0].Job != "test_job" || records[0].Status != "start" {
		t.Fatalf("unexpected start record: %+v", records[0])
	}
	if records[1].Job != "test_job" || records[1].Status != "finish" {
		t.Fatalf("unexpected finish record: %+v", records[1])
	}
	if records[1].Summary != "did test work" {
		t.Fatalf("summary = %q", records[1].Summary)
	}
	if records[1].Metrics["items"] != 2 {
		t.Fatalf("metrics = %+v", records[1].Metrics)
	}
}

func TestRunScheduledJobLogsError(t *testing.T) {
	dir := t.TempDir()
	logger := newSchedulerLogger(dir)

	runScheduledJob(logger, "error_job", func() (schedulerJobResult, error) {
		return schedulerJobResult{
			Summary: "removed some files before error",
			Metrics: map[string]int64{"removed_files": 3},
		}, errors.New("disk failed")
	})

	records := readSchedulerLogRecords(t, dir)
	if len(records) != 2 {
		t.Fatalf("expected 2 scheduler log records, got %d", len(records))
	}
	if records[0].Status != "start" {
		t.Fatalf("unexpected start record: %+v", records[0])
	}
	if records[1].Job != "error_job" || records[1].Status != "error" {
		t.Fatalf("unexpected error record: %+v", records[1])
	}
	if records[1].Summary != "removed some files before error" {
		t.Fatalf("summary = %q", records[1].Summary)
	}
	if records[1].Metrics["removed_files"] != 3 {
		t.Fatalf("metrics = %+v", records[1].Metrics)
	}
	if !strings.Contains(records[1].Error, "disk failed") {
		t.Fatalf("expected error to contain disk failed, got %q", records[1].Error)
	}
}

func TestRunScheduledJobLogsPanic(t *testing.T) {
	dir := t.TempDir()
	logger := newSchedulerLogger(dir)

	runScheduledJob(logger, "panic_job", func() (schedulerJobResult, error) {
		panic("boom")
	})

	records := readSchedulerLogRecords(t, dir)
	if len(records) != 2 {
		t.Fatalf("expected 2 scheduler log records, got %d", len(records))
	}
	if records[0].Status != "start" {
		t.Fatalf("unexpected start record: %+v", records[0])
	}
	if records[1].Job != "panic_job" || records[1].Status != "panic" {
		t.Fatalf("unexpected panic record: %+v", records[1])
	}
	if !strings.Contains(records[1].Error, "boom") {
		t.Fatalf("expected panic error to contain boom, got %q", records[1].Error)
	}
}

func TestRemoveUnlinkedAssetDeletesUnreferencedFiles(t *testing.T) {
	if err := store.ResetForTests(); err != nil {
		t.Fatalf("reset store: %v", err)
	}
	t.Cleanup(func() {
		if err := store.ResetForTests(); err != nil {
			t.Fatalf("cleanup store: %v", err)
		}
	})

	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
	})

	if err := store.Initialize(); err != nil {
		t.Fatalf("initialize store: %v", err)
	}

	// 注: 调度器只走 shard 子目录, root 下的扁平文件由 migration 搬, scheduler 不动。
	// 这里直接把测试文件写到 shard 路径下, 模拟迁移后的状态。同时再放一个 root 扁平文件
	// 验证它会被 scheduler 忽略, 等迁移处理。
	linkedDir, linked := config.AssetPath(config.AssetTypeMusic, "linked.mp3")
	unlinkedDir, unlinked := config.AssetPath(config.AssetTypeMusic, "unlinked.mp3")
	for _, dir := range []string{linkedDir, unlinkedDir} {
		if err := os.MkdirAll(dir, 0755); err != nil {
			t.Fatalf("mkdir %s: %v", dir, err)
		}
	}
	for _, path := range []string{linked, unlinked} {
		if err := os.WriteFile(path, []byte("music"), 0644); err != nil {
			t.Fatalf("write %s: %v", path, err)
		}
	}
	legacyFlat := filepath.Join(config.AssetDir(config.AssetTypeMusic), "legacy.mp3")
	if err := os.WriteFile(legacyFlat, []byte("legacy"), 0644); err != nil {
		t.Fatalf("write legacy: %v", err)
	}

	if _, err := store.DB().Exec(
		`INSERT INTO music (id,type,name,asset,createTimestamp) VALUES ('MUSIC1',1,'song','linked.mp3',0)`,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}

	removeUnlinkedAsset()

	if _, err := os.Stat(linked); err != nil {
		t.Fatalf("expected linked asset to remain: %v", err)
	}
	if _, err := os.Stat(unlinked); !os.IsNotExist(err) {
		t.Fatalf("expected unlinked asset to be removed, err=%v", err)
	}
	// 完全清空的 shard 也应被移除
	if _, err := os.Stat(unlinkedDir); !os.IsNotExist(err) {
		t.Fatalf("expected empty shard %s to be removed, err=%v", unlinkedDir, err)
	}
	// root 下的扁平遗留文件由迁移处理, scheduler 不应触及
	if _, err := os.Stat(legacyFlat); err != nil {
		t.Fatalf("expected legacy flat asset to remain (migration handles it): %v", err)
	}
}

func TestDecreaseMusicHeatDecreasesDailyWithoutGoingBelowZero(t *testing.T) {
	if err := store.ResetForTests(); err != nil {
		t.Fatalf("reset store: %v", err)
	}
	t.Cleanup(func() {
		if err := store.ResetForTests(); err != nil {
			t.Fatalf("cleanup store: %v", err)
		}
	})

	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
	})

	if err := store.Initialize(); err != nil {
		t.Fatalf("initialize store: %v", err)
	}

	if _, err := store.DB().Exec(
		`INSERT INTO music (id,type,name,asset,heat,createTimestamp) VALUES
			('HEAT02',1,'two','two.mp3',2,0),
			('HEAT01',1,'one','one.mp3',1,0),
			('HEAT00',1,'zero','zero.mp3',0,0)`,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}

	result, err := decreaseMusicHeat()
	if err != nil {
		t.Fatalf("decrease music heat: %v", err)
	}
	if result.Metrics["updated_music_heat_rows"] != 2 {
		t.Fatalf("updated rows = %d", result.Metrics["updated_music_heat_rows"])
	}

	expected := map[string]int64{
		"HEAT02": 1,
		"HEAT01": 0,
		"HEAT00": 0,
	}
	for id, want := range expected {
		var got int64
		if err := store.DB().QueryRow(`SELECT heat FROM music WHERE id=?`, id).Scan(&got); err != nil {
			t.Fatalf("query %s heat: %v", id, err)
		}
		if got != want {
			t.Fatalf("%s heat = %d, want %d", id, got, want)
		}
	}
}

func writeMusicAssetForCleanTest(t *testing.T, filename string) {
	t.Helper()

	dir, path := config.AssetPath(config.AssetTypeMusic, filename)
	if err := os.MkdirAll(dir, 0755); err != nil {
		t.Fatalf("mkdir music asset shard %s: %v", filename, err)
	}
	if err := os.WriteFile(path, []byte("source"), 0644); err != nil {
		t.Fatalf("write music asset %s: %v", filename, err)
	}
}

func readSchedulerLogRecords(t *testing.T, dir string) []schedulerLogRecord {
	t.Helper()

	path := filepath.Join(dir, "scheduler-"+time.Now().Format("2006-01-02")+".log")
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read scheduler log: %v", err)
	}
	lines := strings.Split(strings.TrimSpace(string(data)), "\n")
	records := make([]schedulerLogRecord, 0, len(lines))
	for _, line := range lines {
		var record schedulerLogRecord
		if err := json.Unmarshal([]byte(line), &record); err != nil {
			t.Fatalf("unmarshal scheduler log: %v", err)
		}
		records = append(records, record)
	}
	return records
}
