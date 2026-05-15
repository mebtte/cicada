package musicasset

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sync"
	"time"

	"cicada/internal/config"
)

const (
	// PartialUploadDataFilename is the on-disk name of the partial payload.
	PartialUploadDataFilename = "data"
	// PartialUploadMetaFilename is the on-disk name of the session metadata.
	PartialUploadMetaFilename = "meta.json"
	// PartialUploadTTL bounds how long a session may remain idle.
	PartialUploadTTL = 24 * time.Hour
	// PartialUploadMaxChunkSize caps a single PUT body to limit memory pressure.
	PartialUploadMaxChunkSize int64 = 8 * 1024 * 1024
)

// PartialUploadMeta is the persisted metadata for a single chunked upload session.
type PartialUploadMeta struct {
	UploadID      string `json:"uploadId"`
	UserID        string `json:"userId"`
	AssetType     string `json:"assetType"`
	Size          int64  `json:"size"`
	FileHash      string `json:"fileHash"`
	ChunkSize     int64  `json:"chunkSize"`
	ReceivedBytes int64  `json:"receivedBytes"`
	Filename      string `json:"filename"`
	CreatedAt     int64  `json:"createdAt"`
	UpdatedAt     int64  `json:"updatedAt"`
}

// uploadLocks serialises writes per uploadId so concurrent PUTs from the same
// session do not race on offset bookkeeping.
var uploadLocks sync.Map // map[string]*sync.Mutex

func lockForUpload(uploadID string) *sync.Mutex {
	if v, ok := uploadLocks.Load(uploadID); ok {
		return v.(*sync.Mutex)
	}
	m := &sync.Mutex{}
	actual, _ := uploadLocks.LoadOrStore(uploadID, m)
	return actual.(*sync.Mutex)
}

// ComputeUploadID derives a stable session id from immutable upload params.
// The same user re-attempting the same file returns the same id, so callers
// can resume a previous session implicitly.
func ComputeUploadID(userID, assetType, fileHash string, size int64) string {
	h := sha256.New()
	fmt.Fprintf(h, "%s|%s|%s|%d", userID, assetType, fileHash, size)
	return hex.EncodeToString(h.Sum(nil))[:32]
}

// SessionDir returns the directory that holds the data + meta files for a session.
func SessionDir(uploadID string) string {
	return filepath.Join(config.PartialUploadDir(), uploadID)
}

func dataPath(uploadID string) string {
	return filepath.Join(SessionDir(uploadID), PartialUploadDataFilename)
}

func metaPath(uploadID string) string {
	return filepath.Join(SessionDir(uploadID), PartialUploadMetaFilename)
}

// CreateOrResumeSession returns the existing meta if a matching session is
// already on disk, otherwise it creates a fresh session directory with a
// pre-allocated data file. The returned meta reflects on-disk state.
func CreateOrResumeSession(meta PartialUploadMeta) (PartialUploadMeta, error) {
	mu := lockForUpload(meta.UploadID)
	mu.Lock()
	defer mu.Unlock()

	if existing, err := readMetaLocked(meta.UploadID); err == nil {
		// Re-attaching to an existing session: ownership and file identity
		// must match exactly. Mismatches indicate a different file under the
		// same id, which would corrupt the on-disk payload.
		if existing.UserID != meta.UserID ||
			existing.AssetType != meta.AssetType ||
			existing.Size != meta.Size ||
			existing.FileHash != meta.FileHash {
			return PartialUploadMeta{}, ErrSessionConflict
		}
		existing.UpdatedAt = time.Now().UnixMilli()
		if err := writeMetaLocked(existing); err != nil {
			return PartialUploadMeta{}, err
		}
		return existing, nil
	}

	if err := os.MkdirAll(SessionDir(meta.UploadID), 0o755); err != nil {
		return PartialUploadMeta{}, err
	}
	f, err := os.OpenFile(dataPath(meta.UploadID), os.O_CREATE|os.O_WRONLY, 0o644)
	if err != nil {
		return PartialUploadMeta{}, err
	}
	if err := f.Truncate(meta.Size); err != nil {
		f.Close()
		return PartialUploadMeta{}, err
	}
	if err := f.Close(); err != nil {
		return PartialUploadMeta{}, err
	}

	now := time.Now().UnixMilli()
	meta.ReceivedBytes = 0
	meta.CreatedAt = now
	meta.UpdatedAt = now
	if err := writeMetaLocked(meta); err != nil {
		return PartialUploadMeta{}, err
	}
	return meta, nil
}

// ErrSessionConflict means a session already exists under this id but the
// caller is supplying mismatched immutable params.
var ErrSessionConflict = errors.New("partial upload session conflict")

// ReadSession returns the on-disk meta. Returns os.IsNotExist when missing.
func ReadSession(uploadID string) (PartialUploadMeta, error) {
	mu := lockForUpload(uploadID)
	mu.Lock()
	defer mu.Unlock()
	return readMetaLocked(uploadID)
}

// AppendChunk writes data at the given offset and updates meta.ReceivedBytes.
// start must equal the current ReceivedBytes (strictly sequential upload).
func AppendChunk(uploadID, userID string, start int64, chunk []byte) (PartialUploadMeta, error) {
	mu := lockForUpload(uploadID)
	mu.Lock()
	defer mu.Unlock()

	meta, err := readMetaLocked(uploadID)
	if err != nil {
		return PartialUploadMeta{}, err
	}
	if meta.UserID != userID {
		return PartialUploadMeta{}, ErrOwnerMismatch
	}
	if start != meta.ReceivedBytes {
		return PartialUploadMeta{}, ErrRangeOutOfOrder
	}
	end := start + int64(len(chunk))
	if end > meta.Size {
		return PartialUploadMeta{}, ErrRangeOverflow
	}

	f, err := os.OpenFile(dataPath(uploadID), os.O_WRONLY, 0o644)
	if err != nil {
		return PartialUploadMeta{}, err
	}
	if _, err := f.WriteAt(chunk, start); err != nil {
		f.Close()
		return PartialUploadMeta{}, err
	}
	if err := f.Sync(); err != nil {
		f.Close()
		return PartialUploadMeta{}, err
	}
	if err := f.Close(); err != nil {
		return PartialUploadMeta{}, err
	}

	meta.ReceivedBytes = end
	meta.UpdatedAt = time.Now().UnixMilli()
	if err := writeMetaLocked(meta); err != nil {
		return PartialUploadMeta{}, err
	}
	return meta, nil
}

// Errors returned by AppendChunk for caller-side mapping to apperr.
var (
	ErrOwnerMismatch   = errors.New("partial upload owner mismatch")
	ErrRangeOutOfOrder = errors.New("partial upload range out of order")
	ErrRangeOverflow   = errors.New("partial upload range overflow")
)

// FinaliseSession verifies the on-disk payload matches FileHash, then renames
// the data file to dest. The session directory is removed on success.
// On any verification failure the session directory is removed too.
func FinaliseSession(uploadID, userID string, dest string) (PartialUploadMeta, error) {
	mu := lockForUpload(uploadID)
	mu.Lock()
	defer mu.Unlock()

	meta, err := readMetaLocked(uploadID)
	if err != nil {
		return PartialUploadMeta{}, err
	}
	if meta.UserID != userID {
		return PartialUploadMeta{}, ErrOwnerMismatch
	}
	if meta.ReceivedBytes != meta.Size {
		return PartialUploadMeta{}, ErrIncomplete
	}

	srcPath := dataPath(uploadID)
	stat, err := os.Stat(srcPath)
	if err != nil {
		return PartialUploadMeta{}, err
	}
	if stat.Size() != meta.Size {
		_ = os.RemoveAll(SessionDir(uploadID))
		return PartialUploadMeta{}, ErrIncomplete
	}

	hash, err := sha256File(srcPath)
	if err != nil {
		return PartialUploadMeta{}, err
	}
	if hash != meta.FileHash {
		_ = os.RemoveAll(SessionDir(uploadID))
		return PartialUploadMeta{}, ErrHashMismatch
	}

	if err := os.MkdirAll(filepath.Dir(dest), 0o755); err != nil {
		return PartialUploadMeta{}, err
	}
	if err := os.Rename(srcPath, dest); err != nil {
		return PartialUploadMeta{}, err
	}
	_ = os.RemoveAll(SessionDir(uploadID))
	uploadLocks.Delete(uploadID)
	return meta, nil
}

// ErrIncomplete signals the session has not received the full payload.
var ErrIncomplete = errors.New("partial upload incomplete")

// ErrHashMismatch signals the assembled payload does not match the declared hash.
var ErrHashMismatch = errors.New("partial upload hash mismatch")

// CancelSession deletes the on-disk session unconditionally. Caller must have
// already verified ownership.
func CancelSession(uploadID string) error {
	mu := lockForUpload(uploadID)
	mu.Lock()
	defer mu.Unlock()
	if err := os.RemoveAll(SessionDir(uploadID)); err != nil {
		return err
	}
	uploadLocks.Delete(uploadID)
	return nil
}

// CleanOutdatedSessions removes session dirs whose meta.UpdatedAt is older
// than ttl. Sessions with corrupt or missing meta fall back to data file mtime.
// Returns number of removed sessions.
func CleanOutdatedSessions(now time.Time, ttl time.Duration) (int64, error) {
	root := config.PartialUploadDir()
	entries, err := os.ReadDir(root)
	if err != nil {
		if os.IsNotExist(err) {
			return 0, nil
		}
		return 0, err
	}
	var removed int64
	var errs []error
	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		uploadID := e.Name()
		stale, err := isSessionStale(uploadID, now, ttl)
		if err != nil {
			errs = append(errs, err)
			continue
		}
		if !stale {
			continue
		}
		if err := os.RemoveAll(filepath.Join(root, uploadID)); err != nil {
			errs = append(errs, fmt.Errorf("remove %s: %w", uploadID, err))
			continue
		}
		uploadLocks.Delete(uploadID)
		removed++
	}
	return removed, errors.Join(errs...)
}

func isSessionStale(uploadID string, now time.Time, ttl time.Duration) (bool, error) {
	if meta, err := readMetaLocked(uploadID); err == nil {
		return now.Sub(time.UnixMilli(meta.UpdatedAt)) >= ttl, nil
	}
	// meta corrupt or missing: fall back to the data file's mtime so we still
	// reap the directory rather than letting it accumulate forever.
	stat, err := os.Stat(dataPath(uploadID))
	if err != nil {
		if os.IsNotExist(err) {
			// only meta survives or empty dir - safe to consider stale.
			return true, nil
		}
		return false, err
	}
	return now.Sub(stat.ModTime()) >= ttl, nil
}

func readMetaLocked(uploadID string) (PartialUploadMeta, error) {
	data, err := os.ReadFile(metaPath(uploadID))
	if err != nil {
		return PartialUploadMeta{}, err
	}
	var meta PartialUploadMeta
	if err := json.Unmarshal(data, &meta); err != nil {
		return PartialUploadMeta{}, err
	}
	return meta, nil
}

func writeMetaLocked(meta PartialUploadMeta) error {
	data, err := json.MarshalIndent(meta, "", "  ")
	if err != nil {
		return err
	}
	tmp := metaPath(meta.UploadID) + ".tmp"
	if err := os.WriteFile(tmp, data, 0o644); err != nil {
		return err
	}
	return os.Rename(tmp, metaPath(meta.UploadID))
}

func sha256File(path string) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()
	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return "", err
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}
