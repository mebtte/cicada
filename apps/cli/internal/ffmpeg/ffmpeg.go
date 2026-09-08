package ffmpeg

import (
	"cicada/internal/config"
	"cicada/internal/embeddedtools"
	"errors"
	"path/filepath"
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
	dir := config.BinDir()
	// This is the complete inventory for the program-owned scratch/bin.
	// Add future embedded tools here so cleanup retains every required binary.
	if err := embeddedtools.Prepare(dir, []embeddedtools.Tool{
		{Name: bundle.ffmpegName, Data: bundle.ffmpegData},
		{Name: bundle.ffprobeName, Data: bundle.ffprobeData},
	}); err != nil {
		return Paths{}, err
	}

	return Paths{
		FFmpeg:  filepath.Join(dir, bundle.ffmpegName),
		FFprobe: filepath.Join(dir, bundle.ffprobeName),
	}, nil
}
