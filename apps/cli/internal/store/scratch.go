package store

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"cicada/internal/config"
	"cicada/internal/store/migration"
)

func prepareScratch() error {
	cfg := config.Get()
	data, err := filepath.Abs(cfg.Data)
	if err != nil {
		return fmt.Errorf("resolve data directory: %w", err)
	}
	cfg.Data = data
	cfg.Scratch, err = config.ResolveScratchDir(data, cfg.Scratch)
	if err != nil {
		return err
	}
	if err := migration.CheckScratchVersion(cfg.Scratch, migration.CurrentVersion()); err != nil {
		return fmt.Errorf("check scratch version: %w", err)
	}
	if err := os.MkdirAll(data, 0755); err != nil {
		return fmt.Errorf("mkdir %s: %w", data, err)
	}
	// Recovery can restore legacy directories and links, so validate again
	// afterwards before creating working files or deleting legacy directories.
	if err := migration.Recover(data); err != nil {
		return fmt.Errorf("recover: %w", err)
	}
	if _, err := config.ResolveScratchDir(data, cfg.Scratch); err != nil {
		return err
	}
	config.Set(cfg)
	if err := os.MkdirAll(cfg.Scratch, 0755); err != nil {
		return fmt.Errorf("mkdir scratch directory %q: %w", cfg.Scratch, err)
	}
	// Do not pre-create current-layout children before an older scratch has
	// migrated: a new directory could occupy a pending rename's destination.
	for _, dir := range scratchDirectories() {
		info, err := os.Stat(dir)
		if os.IsNotExist(err) {
			continue
		}
		if err != nil {
			return fmt.Errorf("inspect scratch directory %q: %w", dir, err)
		}
		if !info.IsDir() {
			return fmt.Errorf("scratch path %q is not a directory", dir)
		}
		if err := checkScratchWritable(dir); err != nil {
			return fmt.Errorf("scratch directory %q is not writable: %w", dir, err)
		}
	}
	return nil
}

func scratchDirectories() []string {
	return []string{
		config.ScratchDir(), config.ThumbnailCacheDir(), config.MusicTranscodeCacheDir(),
		config.PartialUploadDir(), config.LogDir(), config.AccessLogDir(), config.SchedulerLogDir(),
	}
}

func upgradeScratch() error {
	// Always run after data migration, including when data/v was synchronized
	// from another device and there was no data migration to execute locally.
	if err := migration.RunScratch(context.Background(), config.ScratchDir(), migration.CurrentVersion()); err != nil {
		return fmt.Errorf("scratch upgrade: %w", err)
	}
	for _, dir := range scratchDirectories() {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return fmt.Errorf("mkdir scratch directory %q: %w", dir, err)
		}
		if err := checkScratchWritable(dir); err != nil {
			return fmt.Errorf("scratch directory %q is not writable: %w", dir, err)
		}
	}
	return nil
}

func checkScratchWritable(dir string) error {
	f, err := os.CreateTemp(dir, ".cicada-write-check-*")
	if err != nil {
		return err
	}
	defer os.Remove(f.Name())
	if _, err := f.Write([]byte("scratch")); err != nil {
		_ = f.Close()
		return err
	}
	if err := f.Close(); err != nil {
		return err
	}
	return os.Remove(f.Name())
}
