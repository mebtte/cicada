package migration

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// ScratchBaselineVersion is the first layout with device-local scratch data.
const ScratchBaselineVersion = 123

// ScratchEnv deliberately excludes the data directory and database: scratch
// can lag behind synced data and must migrate without rolling data back.
type ScratchEnv struct {
	ScratchDir string
	Journal    *Journal
}

// EnsureDir creates a relative scratch directory without traversing symlinks.
// During migrations, new directories are journaled so rollback removes them
// before restoring any earlier renamed directory at the same path.
func (env *ScratchEnv) EnsureDir(relative string) error {
	clean := filepath.Clean(relative)
	if filepath.IsAbs(clean) || clean == ".." || strings.HasPrefix(clean, ".."+string(filepath.Separator)) {
		return fmt.Errorf("scratch directory %q is outside scratch", relative)
	}
	path := env.ScratchDir
	for _, part := range strings.Split(clean, string(filepath.Separator)) {
		path = filepath.Join(path, part)
		if env.Journal != nil {
			if err := env.Journal.Mkdir(path); err != nil {
				return fmt.Errorf("create scratch directory %s: %w", path, err)
			}
			continue
		}
		if err := os.Mkdir(path, 0755); err != nil && !os.IsExist(err) {
			return fmt.Errorf("create scratch directory %s: %w", path, err)
		}
		info, err := os.Lstat(path)
		if err != nil {
			return err
		}
		if !info.IsDir() {
			return fmt.Errorf("scratch directory %s must be a directory, not a file or symlink", path)
		}
	}
	return nil
}

// RunScratch brings local scratch up to the already committed data version.
// Each step has its own journal and version commit, independent of data recovery.
func RunScratch(ctx context.Context, scratchDir string, target int) error {
	if err := CheckScratchVersion(scratchDir, target); err != nil {
		return err
	}
	if err := os.MkdirAll(scratchDir, 0755); err != nil {
		return err
	}
	if err := recoverScratch(scratchDir); err != nil {
		return err
	}
	current, exists, err := readVersion(filepath.Join(scratchDir, "v"))
	if err != nil {
		return err
	}
	if !exists {
		// Unversioned caches belong to the initial layout. Create that layout
		// before replaying newer steps, never the latest layout prematurely.
		env := &ScratchEnv{ScratchDir: scratchDir}
		for _, path := range []string{"thumbnails", "music_transcoded", "partial_uploads", "logs/access", "logs/scheduler"} {
			if err := env.EnsureDir(filepath.FromSlash(path)); err != nil {
				return err
			}
		}
		current = ScratchBaselineVersion
		if err := writeVersion(filepath.Join(scratchDir, "v"), current); err != nil {
			return fmt.Errorf("stamp scratch baseline: %w", err)
		}
	}
	for _, m := range pendingMigrations(current, target) {
		if err := ctx.Err(); err != nil {
			return err
		}
		if err := runScratchStep(ctx, scratchDir, m); err != nil {
			return fmt.Errorf("scratch migration %d -> %d: %w", m.From, m.To, err)
		}
	}
	return nil
}

func runScratchStep(ctx context.Context, dir string, m Migration) error {
	fmt.Fprintf(os.Stderr, "scratch: applying %d -> %d  %s\n", m.From, m.To, m.Description)
	if err := writeLock(filepath.Join(dir, "upgrade.lock"), LockState{
		From: m.From, To: m.To, Started: time.Now().UnixMilli(), PID: os.Getpid(), LastApplied: m.From,
	}); err != nil {
		return err
	}
	journal, err := OpenJournal(dir)
	if err != nil {
		return err
	}
	err = runScratchUp(ctx, m, &ScratchEnv{ScratchDir: dir, Journal: journal})
	if err = errors.Join(err, journal.Close()); err != nil {
		return err
	}
	if err := writeVersion(filepath.Join(dir, "v"), m.To); err != nil {
		return fmt.Errorf("stamp scratch version: %w", err)
	}
	return cleanupScratchArtifacts(dir)
}

func runScratchUp(ctx context.Context, m Migration, env *ScratchEnv) (err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("panic: %v", r)
		}
	}()
	if m.ScratchUp == nil {
		return nil
	}
	return m.ScratchUp(ctx, env)
}
