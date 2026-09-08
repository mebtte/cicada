package musicasset

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"syscall"
	"testing"
)

func crossDeviceTestError(src, dest string) error {
	err := syscall.EXDEV
	if runtime.GOOS == "windows" {
		err = syscall.Errno(17)
	}
	return &os.LinkError{Op: "rename", Old: src, New: dest, Err: err}
}

func completedSession(t *testing.T, payload []byte) PartialUploadMeta {
	t.Helper()
	hash := sha256.Sum256(payload)
	meta := PartialUploadMeta{
		UploadID: "completed-upload", UserID: "owner", AssetType: "music",
		Size: int64(len(payload)), FileHash: hex.EncodeToString(hash[:]), ChunkSize: 8,
	}
	if _, err := CreateOrResumeSession(meta); err != nil {
		t.Fatal(err)
	}
	stored, err := AppendChunk(meta.UploadID, meta.UserID, 0, payload)
	if err != nil {
		t.Fatal(err)
	}
	return stored
}

func TestFinaliseSessionTransfer(t *testing.T) {
	for _, crossDevice := range []bool{false, true} {
		name := "same-filesystem"
		if crossDevice {
			name = "cross-filesystem"
		}
		t.Run(name, func(t *testing.T) {
			setupTempData(t)
			payload := []byte("complete audio payload")
			meta := completedSession(t, payload)
			dest := filepath.Join(t.TempDir(), "shard", "asset.mp3")
			calls := 0
			transfer := uploadTransfer{copy: io.Copy, rename: func(src, target string) error {
				calls++
				if crossDevice && calls == 1 {
					return crossDeviceTestError(src, target)
				}
				return os.Rename(src, target)
			}}
			if _, err := finaliseSession(meta.UploadID, meta.UserID, dest, transfer); err != nil {
				t.Fatal(err)
			}
			got, err := os.ReadFile(dest)
			if err != nil || string(got) != string(payload) {
				t.Fatalf("published asset = %q, err=%v", got, err)
			}
			if _, err := os.Stat(SessionDir(meta.UploadID)); !os.IsNotExist(err) {
				t.Fatalf("session should be removed: %v", err)
			}
			entries, err := os.ReadDir(filepath.Dir(dest))
			if err != nil || len(entries) != 1 {
				t.Fatalf("temporary files remain: %v, %v", entries, err)
			}
		})
	}
}

func TestFinaliseSessionTransferFailureRetainsSession(t *testing.T) {
	for _, failure := range []string{"rename", "copy", "short-copy", "publish"} {
		t.Run(failure, func(t *testing.T) {
			setupTempData(t)
			payload := []byte("complete audio payload")
			meta := completedSession(t, payload)
			dest := filepath.Join(t.TempDir(), "asset.mp3")
			// A competing request may already have published this resource. A
			// failing transfer must never remove or truncate that resource.
			if err := os.WriteFile(dest, payload, 0o644); err != nil {
				t.Fatal(err)
			}
			calls := 0
			injected := errors.New("injected transfer failure")
			transfer := uploadTransfer{rename: func(src, target string) error {
				calls++
				if failure == "rename" || calls > 1 {
					return injected
				}
				return crossDeviceTestError(src, target)
			}, copy: func(dst io.Writer, src io.Reader) (int64, error) {
				if failure == "copy" {
					n, _ := dst.Write([]byte("partial"))
					return int64(n), injected
				}
				if failure == "short-copy" {
					return 0, nil
				}
				return io.Copy(dst, src)
			}}
			if _, err := finaliseSession(meta.UploadID, meta.UserID, dest, transfer); err == nil {
				t.Fatal("expected transfer failure")
			}
			if failure == "rename" && calls != 1 {
				t.Fatalf("non-cross-device error triggered fallback: %d calls", calls)
			}
			if _, err := ReadSession(meta.UploadID); err != nil {
				t.Fatalf("session metadata lost: %v", err)
			}
			for _, path := range []string{dataPath(meta.UploadID), dest} {
				got, err := os.ReadFile(path)
				if err != nil || string(got) != string(payload) {
					t.Fatalf("payload %s changed: %q, %v", path, got, err)
				}
			}
			entries, err := os.ReadDir(filepath.Dir(dest))
			if err != nil || len(entries) != 1 {
				t.Fatalf("temporary files remain: %v, %v", entries, err)
			}
			if _, err := FinaliseSession(meta.UploadID, meta.UserID, dest); err != nil {
				t.Fatalf("retry failed: %v", err)
			}
		})
	}
}

func TestFinaliseSessionRejectsInvalidPayload(t *testing.T) {
	setupTempData(t)
	meta := completedSession(t, []byte("complete audio payload"))
	if err := os.WriteFile(dataPath(meta.UploadID), []byte("corrupt! audio payload"), 0o644); err != nil {
		t.Fatal(err)
	}
	dest := filepath.Join(t.TempDir(), "asset.mp3")
	if _, err := FinaliseSession(meta.UploadID, meta.UserID, dest); !errors.Is(err, ErrHashMismatch) {
		t.Fatalf("expected hash mismatch, got %v", err)
	}
	if _, err := os.Stat(dest); !os.IsNotExist(err) {
		t.Fatalf("corrupt asset published: %v", err)
	}
}
