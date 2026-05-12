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
	"cicada/internal/store"
)

func TestCleanOutdatedFileCleansCacheWithoutRemovingThumbnailDir(t *testing.T) {
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
	oldThumbnail := filepath.Join(config.ThumbnailCacheDir(), "64_old.jpg")
	freshThumbnail := filepath.Join(config.ThumbnailCacheDir(), "64_fresh.jpg")
	oldTranscode := filepath.Join(config.MusicTranscodeCacheDir(), "song.flac_codec-aac_bitrate-192k.m4a")
	freshTranscode := filepath.Join(config.MusicTranscodeCacheDir(), "song.flac_codec-flac.flac")

	for _, path := range []string{oldRootCache, oldThumbnail, freshThumbnail, oldTranscode, freshTranscode} {
		if err := os.WriteFile(path, []byte("cache"), 0644); err != nil {
			t.Fatalf("write %s: %v", path, err)
		}
	}
	for _, path := range []string{oldRootCache, oldThumbnail, oldTranscode} {
		if err := os.Chtimes(path, oldTime, oldTime); err != nil {
			t.Fatalf("chtimes %s: %v", path, err)
		}
	}
	if err := os.Chtimes(config.ThumbnailCacheDir(), oldTime, oldTime); err != nil {
		t.Fatalf("chtimes thumbnail dir: %v", err)
	}
	if err := os.Chtimes(config.MusicTranscodeCacheDir(), oldTime, oldTime); err != nil {
		t.Fatalf("chtimes music transcode dir: %v", err)
	}

	cleanOutdatedFile()

	if info, err := os.Stat(config.ThumbnailCacheDir()); err != nil || !info.IsDir() {
		t.Fatalf("expected thumbnail cache dir to remain, info=%v err=%v", info, err)
	}
	if info, err := os.Stat(config.MusicTranscodeCacheDir()); err != nil || !info.IsDir() {
		t.Fatalf("expected music transcode cache dir to remain, info=%v err=%v", info, err)
	}
	if _, err := os.Stat(oldRootCache); !os.IsNotExist(err) {
		t.Fatalf("expected old root cache file to be removed, err=%v", err)
	}
	if _, err := os.Stat(oldThumbnail); !os.IsNotExist(err) {
		t.Fatalf("expected old thumbnail cache file to be removed, err=%v", err)
	}
	if _, err := os.Stat(oldTranscode); !os.IsNotExist(err) {
		t.Fatalf("expected old transcode cache file to be removed, err=%v", err)
	}
	if _, err := os.Stat(freshThumbnail); err != nil {
		t.Fatalf("expected fresh thumbnail cache file to remain: %v", err)
	}
	if _, err := os.Stat(freshTranscode); err != nil {
		t.Fatalf("expected fresh transcode cache file to remain: %v", err)
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

	assetDir := config.AssetDir(config.AssetTypeMusic)
	linked := filepath.Join(assetDir, "linked.mp3")
	unlinked := filepath.Join(assetDir, "unlinked.mp3")
	for _, path := range []string{linked, unlinked} {
		if err := os.WriteFile(path, []byte("music"), 0644); err != nil {
			t.Fatalf("write %s: %v", path, err)
		}
	}

	if _, err := store.DB().Exec(
		`INSERT INTO user (id,username,password,nickname,joinTimestamp) VALUES ('u','u','p','u',0)`,
	); err != nil {
		t.Fatalf("insert user: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO music (id,type,name,asset,createUserId,createTimestamp) VALUES ('m',1,'song','linked.mp3','u',0)`,
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
