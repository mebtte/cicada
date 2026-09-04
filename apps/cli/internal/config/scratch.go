package config

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

// ResolveScratchDir fixes relative paths against the startup working directory
// and rejects locations that upgrades could delete or that overlap library data.
// It does not create files; callers must validate before recovering migrations.
func ResolveScratchDir(data, scratch string) (string, error) {
	if scratch == "" {
		scratch = filepath.Join(data, "scratch")
	}
	abs, err := filepath.Abs(scratch)
	if err != nil {
		return "", err
	}
	// Validate the root before resolving children so errors identify the
	// invalid scratch directory rather than one of its children.
	info, err := os.Stat(abs)
	if err == nil && !info.IsDir() {
		return "", fmt.Errorf("scratch path %q is not a directory", abs)
	}
	if err != nil && !os.IsNotExist(err) {
		return "", fmt.Errorf("inspect scratch directory %q: %w", abs, err)
	}
	// bin is exclusively managed, including stale-file removal. Never let it
	// redirect tool replacement or cleanup outside scratch through a symlink.
	bin := filepath.Join(abs, "bin")
	if info, err := os.Lstat(bin); err == nil {
		if !info.IsDir() {
			return "", fmt.Errorf("scratch bin %q must be a directory, not a file or symlink", bin)
		}
	} else if !os.IsNotExist(err) {
		return "", fmt.Errorf("inspect scratch bin %q: %w", bin, err)
	}
	dataAbs, err := filepath.Abs(data)
	if err != nil {
		return "", err
	}
	dataReal, err := resolveExistingPath(dataAbs)
	if err != nil {
		return "", fmt.Errorf("resolve data %q: %w", dataAbs, err)
	}

	// Check managed children too: an existing logs symlink can otherwise point
	// back into a legacy directory even when the scratch root itself is safe.
	paths := []string{abs}
	for _, child := range []string{
		"bin", "thumbnails", "music_transcoded", "partial_uploads", "logs", "logs/access", "logs/scheduler", "logs/ffmpeg",
		"v", "upgrade.lock", "upgrade.journal", "upgrade.trash",
	} {
		paths = append(paths, filepath.Join(abs, child))
	}
	for _, path := range paths {
		real, err := resolveExistingPath(path)
		if err != nil {
			return "", fmt.Errorf("resolve scratch path %q: %w", path, err)
		}
		if pathWithin(path, dataAbs) || pathWithin(real, dataReal) {
			return "", fmt.Errorf("scratch path %q must not contain the data directory", path)
		}
		for _, name := range []string{
			"cache", "partial_uploads", "logs", "upgrade.trash", "assets",
			"db", "db.backup", "db-wal", "db-shm", "v", "upgrade.lock", "upgrade.journal",
		} {
			reserved := filepath.Join(dataAbs, name)
			reservedReal, err := resolveExistingPath(reserved)
			if err != nil {
				// A dangling legacy symlink can be safely unlinked by migration.
				// Compare its lexical location even though its target is absent.
				if !os.IsNotExist(err) {
					return "", fmt.Errorf("resolve reserved path %q: %w", reserved, err)
				}
				reservedReal = reserved
			}
			if pathWithin(reserved, path) || pathWithin(path, reserved) ||
				pathWithin(reservedReal, real) || pathWithin(real, reservedReal) {
				return "", fmt.Errorf("scratch path %q overlaps reserved data path %q", path, reserved)
			}
		}
	}
	return abs, nil
}

// resolveExistingPath follows existing ancestors without requiring the final
// directory to exist. Existing dangling symlinks are errors, not missing parents.
func resolveExistingPath(path string) (string, error) {
	real, err := filepath.EvalSymlinks(path)
	if err == nil {
		return real, nil
	}
	if !os.IsNotExist(err) {
		return "", err
	}
	if _, statErr := os.Lstat(path); !os.IsNotExist(statErr) {
		return "", err
	}
	parent := filepath.Dir(path)
	if parent == path {
		return "", err
	}
	resolvedParent, err := resolveExistingPath(parent)
	if err != nil {
		return "", err
	}
	return filepath.Join(resolvedParent, filepath.Base(path)), nil
}

func pathWithin(parent, child string) bool {
	// Reject case aliases conservatively on platforms commonly using
	// case-insensitive volumes, including paths whose final components are new.
	if runtime.GOOS == "windows" || runtime.GOOS == "darwin" {
		parent, child = strings.ToLower(parent), strings.ToLower(child)
	}
	rel, err := filepath.Rel(parent, child)
	return err == nil && rel != ".." && !strings.HasPrefix(rel, ".."+string(filepath.Separator)) && !filepath.IsAbs(rel)
}
