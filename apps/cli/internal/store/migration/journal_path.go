package migration

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// rel confines both lexical paths and resolved parent directories to the
// journal root. The leaf is deliberately not resolved: Trash may unlink a
// symlink itself, but may never traverse that link to touch outside files.
func (j *Journal) rel(path string) (string, error) {
	if !filepath.IsAbs(path) {
		path = filepath.Join(j.dataDir, path)
	}
	rel, err := filepath.Rel(j.dataDir, path)
	if err != nil || outsideJournal(rel) {
		return "", fmt.Errorf("path %s outside journal directory", path)
	}
	root, err := filepath.EvalSymlinks(j.dataDir)
	if err != nil {
		return "", err
	}
	parent, err := journalResolvedParent(filepath.Dir(path))
	if err != nil {
		return "", err
	}
	parentRel, err := filepath.Rel(root, parent)
	if rel != "." && (err != nil || outsideJournal(parentRel)) {
		return "", fmt.Errorf("parent of %s resolves outside journal directory", path)
	}
	return filepath.ToSlash(rel), nil
}

func outsideJournal(relative string) bool {
	return relative == ".." || strings.HasPrefix(relative, ".."+string(filepath.Separator)) || filepath.IsAbs(relative)
}

func journalResolvedParent(path string) (string, error) {
	resolved, err := filepath.EvalSymlinks(path)
	if err == nil {
		return resolved, nil
	}
	if !os.IsNotExist(err) {
		return "", err
	}
	if _, statErr := os.Lstat(path); !os.IsNotExist(statErr) {
		return "", err // An existing dangling link is not a missing directory.
	}
	parent := filepath.Dir(path)
	if parent == path {
		return "", err
	}
	resolved, err = journalResolvedParent(parent)
	if err != nil {
		return "", err
	}
	return filepath.Join(resolved, filepath.Base(path)), nil
}

func (j *Journal) absolute(relative string) string {
	return filepath.Join(j.dataDir, filepath.FromSlash(relative))
}

func (j *Journal) mkdirParents(path string) error {
	rel, err := j.rel(path)
	if err != nil {
		return err
	}
	if rel == "." {
		return nil
	}
	path = j.dataDir
	for _, component := range strings.Split(rel, "/") {
		path = filepath.Join(path, component)
		if err := j.Mkdir(path); err != nil {
			return err
		}
	}
	return nil
}
