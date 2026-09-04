//go:build !windows

package musicasset

import (
	"errors"
	"syscall"
)

func isCrossDeviceError(err error) bool {
	return errors.Is(err, syscall.EXDEV)
}
