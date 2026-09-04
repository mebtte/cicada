package musictranscode

import (
	"path/filepath"
	"sync"
	"sync/atomic"
)

type cacheState struct {
	mu          sync.Mutex
	refs        int
	users       int
	touchFailed atomic.Bool
}

var cacheStates = struct {
	sync.Mutex
	entries map[string]*cacheState
}{entries: make(map[string]*cacheState)}

// References cover both users and cleaners. Only brief map operations hold the
// global lock; encoding, responses and file operations never block other keys.
func referenceState(key string) (*cacheState, func()) {
	cacheStates.Lock()
	s := cacheStates.entries[key]
	if s == nil {
		s = &cacheState{}
		cacheStates.entries[key] = s
	}
	s.refs++
	cacheStates.Unlock()
	return s, func() {
		cacheStates.Lock()
		s.refs--
		if s.refs == 0 && !s.touchFailed.Load() {
			delete(cacheStates.entries, key)
		}
		cacheStates.Unlock()
	}
}

func beginUse(key string) func() {
	s, unref := referenceState(key)
	s.mu.Lock()
	s.users++
	s.mu.Unlock()
	return func() {
		s.mu.Lock()
		s.users--
		s.mu.Unlock()
		unref()
	}
}

// Protect the shard as well: removing an empty directory must not race with
// a generator between MkdirAll and creation of its temporary output.
func beginCacheUse(path string) func() {
	releaseShard := beginUse(filepath.Dir(path))
	releaseCache := beginUse(path)
	return func() {
		releaseCache()
		releaseShard()
	}
}

func withIdleCache(key string, fn func(*cacheState) error) (bool, error) {
	s, unref := referenceState(key)
	defer unref()
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.users != 0 {
		return false, nil
	}
	return true, fn(s)
}
