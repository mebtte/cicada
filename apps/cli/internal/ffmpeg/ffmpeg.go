package ffmpeg

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"sync"
)

type embeddedBundle struct {
	target      string
	version     string
	ffmpegName  string
	ffprobeName string
	ffmpegData  []byte
	ffprobeData []byte
}

type Paths struct {
	FFmpeg  string
	FFprobe string
}

var (
	bundle      embeddedBundle
	prepareOnce sync.Once
	prepared    Paths
	prepareErr  error
)

func registerEmbeddedBundle(b embeddedBundle) {
	bundle = b
}

func PrepareEmbeddedTools() (Paths, error) {
	prepareOnce.Do(func() {
		prepared, prepareErr = preparePaths()
	})
	return prepared, prepareErr
}

func HasEmbeddedTools() bool {
	return len(bundle.ffmpegData) > 0 && len(bundle.ffprobeData) > 0
}

func preparePaths() (Paths, error) {
	if !HasEmbeddedTools() {
		return Paths{}, errors.New("embedded ffmpeg/ffprobe not available")
	}
	return extractEmbeddedTools()
}

func extractEmbeddedTools() (Paths, error) {
	target := bundle.target
	if target == "" {
		target = currentTarget()
	}

	cacheRoot, err := embeddedCacheRoot()
	if err != nil {
		return Paths{}, err
	}

	dir := filepath.Join(cacheRoot, target+"-"+bundleDigest())
	if err := os.MkdirAll(dir, 0755); err != nil {
		return Paths{}, fmt.Errorf("create ffmpeg cache dir: %w", err)
	}

	ffmpegPath := filepath.Join(dir, bundle.ffmpegName)
	if err := writeExecutable(ffmpegPath, bundle.ffmpegData); err != nil {
		return Paths{}, fmt.Errorf("write ffmpeg: %w", err)
	}

	ffprobePath := filepath.Join(dir, bundle.ffprobeName)
	if err := writeExecutable(ffprobePath, bundle.ffprobeData); err != nil {
		return Paths{}, fmt.Errorf("write ffprobe: %w", err)
	}

	return Paths{
		FFmpeg:  ffmpegPath,
		FFprobe: ffprobePath,
	}, nil
}

func embeddedCacheRoot() (string, error) {
	dir, err := os.UserCacheDir()
	if err != nil {
		return "", fmt.Errorf("resolve user cache dir: %w", err)
	}
	return filepath.Join(dir, "cicada", "ffmpeg"), nil
}

func writeExecutable(path string, data []byte) error {
	current, err := os.ReadFile(path)
	if err == nil && bytesEqual(current, data) {
		return setExecutableBit(path)
	}
	if err := os.WriteFile(path, data, 0755); err != nil {
		return err
	}
	return setExecutableBit(path)
}

func setExecutableBit(path string) error {
	if runtime.GOOS == "windows" {
		return nil
	}
	return os.Chmod(path, 0755)
}

func bundleDigest() string {
	sum := sha256.New()
	_, _ = sum.Write(bundle.ffmpegData)
	_, _ = sum.Write(bundle.ffprobeData)
	if bundle.version != "" {
		_, _ = sum.Write([]byte(bundle.version))
	}
	digest := hex.EncodeToString(sum.Sum(nil))
	if len(digest) > 12 {
		return digest[:12]
	}
	return digest
}

func currentTarget() string {
	return runtime.GOOS + "-" + runtime.GOARCH
}

func bytesEqual(a, b []byte) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}
