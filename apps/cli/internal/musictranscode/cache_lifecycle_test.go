package musictranscode

import (
	"path/filepath"
	"testing"
	"time"
)

func TestReferenceReleaseDoesNotWaitForCacheFileOperations(t *testing.T) {
	key := filepath.Join(t.TempDir(), "audio")
	_, release := referenceState(key)
	s, releaseCleaner := referenceState(key)
	defer releaseCleaner()
	// Model a cleaner doing slow filesystem work under the per-cache lock.
	// Releasing another reference must not hold the registry hostage to it.
	s.mu.Lock()
	defer s.mu.Unlock()
	done := make(chan struct{})
	go func() { release(); close(done) }()
	select {
	case <-done:
	case <-time.After(5 * time.Second):
		t.Fatal("reference release waited for per-cache file operations")
	}
	unrelated := make(chan struct{})
	go func() {
		releaseOther := beginUse(key + "-other")
		releaseOther()
		close(unrelated)
	}()
	select {
	case <-unrelated:
	case <-time.After(5 * time.Second):
		t.Fatal("another cache was blocked by file operations")
	}
}
