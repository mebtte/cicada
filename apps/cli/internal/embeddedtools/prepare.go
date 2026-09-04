// Package embeddedtools maintains the program-owned executable inventory.
package embeddedtools

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// Tool is an embedded executable with its current platform's filename.
type Tool struct {
	Name string
	Data []byte
}

// Prepare installs the complete tool inventory, then removes obsolete entries.
// The directory is exclusively owned by Cicada and must not be shared by live
// instances. Call once at startup before launching any executable from it.
func Prepare(dir string, tools []Tool) error {
	if len(tools) == 0 {
		return fmt.Errorf("embedded tool inventory is empty")
	}
	names := make(map[string]string, len(tools))
	for _, tool := range tools {
		if tool.Name == "" || tool.Name == "." || tool.Name == ".." || strings.ContainsAny(tool.Name, `/\:`) || len(tool.Data) == 0 {
			return fmt.Errorf("invalid embedded tool %q", tool.Name)
		}
		key := strings.ToLower(tool.Name)
		if _, exists := names[key]; exists {
			return fmt.Errorf("duplicate embedded tool %q", tool.Name)
		}
		names[key] = tool.Name
	}
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("create tools directory: %w", err)
	}
	info, err := os.Lstat(dir)
	if err != nil {
		return err
	}
	if !info.IsDir() {
		return fmt.Errorf("tools directory %q must not be a symlink", dir)
	}
	for _, tool := range tools {
		if err := writeExecutable(filepath.Join(dir, tool.Name), tool.Data); err != nil {
			return fmt.Errorf("prepare %s: %w", tool.Name, err)
		}
	}

	// Only prune after all current tools are ready. RemoveAll unlinks symlinks
	// without following them, including stale links copied from another device.
	entries, err := os.ReadDir(dir)
	if err != nil {
		return err
	}
	for _, entry := range entries {
		if name, exists := names[strings.ToLower(entry.Name())]; exists {
			// A case alias may be the actual installed file on macOS/Windows,
			// or a separate obsolete file on a case-sensitive filesystem.
			actual, err := entry.Info()
			if err != nil {
				return err
			}
			wanted, err := os.Lstat(filepath.Join(dir, name))
			if err != nil {
				return err
			}
			if os.SameFile(actual, wanted) {
				continue
			}
		}
		if err := os.RemoveAll(filepath.Join(dir, entry.Name())); err != nil {
			return fmt.Errorf("remove obsolete tool %q: %w", entry.Name(), err)
		}
	}
	return nil
}
