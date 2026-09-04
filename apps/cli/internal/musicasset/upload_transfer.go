package musicasset

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
)

// The two operations are injected per call so failure tests do not mutate
// process-wide filesystem hooks or interfere with concurrent uploads.
type uploadTransfer struct {
	rename func(string, string) error
	copy   func(io.Writer, io.Reader) (int64, error)
}

func (transfer uploadTransfer) publish(src, dest string, size int64) error {
	if err := transfer.rename(src, dest); err == nil {
		return nil
	} else if !isCrossDeviceError(err) {
		return err
	}

	source, err := os.Open(src)
	if err != nil {
		return err
	}
	defer source.Close()

	// Publish only after copying into the destination filesystem: readers must
	// never observe a partially written asset, and failures must retain src.
	target, err := os.CreateTemp(filepath.Dir(dest), ".upload-*")
	if err != nil {
		return err
	}
	tempPath := target.Name()
	defer os.Remove(tempPath)
	defer target.Close()

	written, err := transfer.copy(target, source)
	if err != nil {
		return fmt.Errorf("copy uploaded asset: %w", err)
	}
	if written != size {
		return fmt.Errorf("copy uploaded asset: wrote %d of %d bytes: %w", written, size, io.ErrUnexpectedEOF)
	}
	if err := target.Chmod(0o644); err != nil {
		return err
	}
	if err := target.Sync(); err != nil {
		return err
	}
	if err := target.Close(); err != nil {
		return err
	}
	// Close the source before the caller removes its session (required on Windows).
	if err := source.Close(); err != nil {
		return err
	}
	return transfer.rename(tempPath, dest)
}
