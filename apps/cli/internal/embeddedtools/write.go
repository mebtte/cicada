package embeddedtools

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
)

func writeExecutable(path string, data []byte) error {
	info, err := os.Lstat(path)
	if err != nil && !os.IsNotExist(err) {
		return err
	}
	if err == nil && info.Mode().IsRegular() {
		current, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		if bytes.Equal(current, data) {
			return setExecutableBit(path)
		}
	} else if err == nil && info.Mode()&os.ModeSymlink == 0 {
		return fmt.Errorf("executable path %q is not a regular file", path)
	}

	// Stage beside the destination so replacement cannot cross filesystems.
	// Never truncate the previous executable, or follow a destination symlink.
	f, err := os.CreateTemp(filepath.Dir(path), ".tool-*")
	if err != nil {
		return err
	}
	defer os.Remove(f.Name())
	defer f.Close()
	if _, err := f.Write(data); err != nil {
		return err
	}
	if err := f.Sync(); err != nil {
		return err
	}
	if err := f.Close(); err != nil {
		return err
	}
	if err := setExecutableBit(f.Name()); err != nil {
		return err
	}
	return os.Rename(f.Name(), path)
}

func setExecutableBit(path string) error {
	if runtime.GOOS == "windows" {
		return nil
	}
	return os.Chmod(path, 0755)
}
