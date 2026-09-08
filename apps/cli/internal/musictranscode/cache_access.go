package musictranscode

import (
	"context"
	"log"
	"os"
	"sync"
	"time"

	"cicada/internal/config"
)

const CacheIdleTTL = 60 * 24 * time.Hour

var cacheChtimes = os.Chtimes

// Playback holds a cache lease until the HTTP response is finished. ModTime
// describes the source content, never the mutable last-access time of File.
type Playback struct {
	Result
	File      *os.File
	ModTime   time.Time
	release   func()
	closeOnce sync.Once
	closeErr  error
}

func (p *Playback) Close() error {
	p.closeOnce.Do(func() {
		p.closeErr = p.File.Close()
		p.release()
	})
	return p.closeErr
}

func OpenForPlayback(ctx context.Context, asset string, quality Quality) (*Playback, error) {
	release := beginCacheUse(CachePath(asset, quality))
	result, err := Ensure(ctx, asset, quality)
	if err != nil {
		release()
		return nil, err
	}
	f, err := os.Open(result.Path)
	if err != nil {
		release()
		return nil, err
	}
	p := &Playback{Result: result, File: f, release: release}
	_, source := config.AssetPath(config.AssetTypeMusic, asset)
	if info, err := os.Stat(source); err == nil {
		p.ModTime = info.ModTime()
	}
	// Every server access renews this quality, including Range/HEAD/conditional
	// requests. A metadata write failure must not turn readable audio into 500.
	if err := touchCache(result.Path); err != nil {
		log.Printf("update music cache access time %s: %v", result.Path, err)
	}
	return p, nil
}

func touchCache(path string) error {
	s, unref := referenceState(path)
	defer unref()
	s.mu.Lock()
	defer s.mu.Unlock()
	// Obtain time inside the per-cache lock so concurrent touches cannot write
	// an older sampled time after a newer request has renewed the cache.
	now := time.Now()
	err := cacheChtimes(path, now, now)
	s.touchFailed.Store(err != nil)
	return err
}
