package musicasset

import (
	"errors"
	"syscall"
)

func isCrossDeviceError(err error) bool {
	// Windows MoveFile reports ERROR_NOT_SAME_DEVICE (17), not POSIX EXDEV.
	return errors.Is(err, syscall.Errno(17))
}
