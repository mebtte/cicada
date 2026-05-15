package musicasset

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	"cicada/internal/config"
)

func setupTempData(t *testing.T) {
	t.Helper()
	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
	})
}

func TestComputeUploadIDStable(t *testing.T) {
	a := ComputeUploadID("u", "music", "abc", 100)
	b := ComputeUploadID("u", "music", "abc", 100)
	c := ComputeUploadID("u", "music", "abc", 101)
	if a != b {
		t.Fatalf("expected stable id, got %s vs %s", a, b)
	}
	if a == c {
		t.Fatalf("expected differing id when size differs")
	}
}

func TestCreateAndResumeSession(t *testing.T) {
	setupTempData(t)

	meta := PartialUploadMeta{
		UploadID:  ComputeUploadID("u1", "music", "h", 64),
		UserID:    "u1",
		AssetType: "music",
		Size:      64,
		FileHash:  "h",
		ChunkSize: 16,
	}
	stored, err := CreateOrResumeSession(meta)
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	if stored.ReceivedBytes != 0 {
		t.Fatalf("expected fresh session ReceivedBytes=0, got %d", stored.ReceivedBytes)
	}
	stat, err := os.Stat(filepath.Join(SessionDir(stored.UploadID), PartialUploadDataFilename))
	if err != nil {
		t.Fatalf("data file should be pre-allocated: %v", err)
	}
	if stat.Size() != 64 {
		t.Fatalf("expected pre-allocated size 64, got %d", stat.Size())
	}

	// Re-attaching with mismatched hash must fail to avoid corrupting
	// the on-disk payload of a different file.
	bad := meta
	bad.FileHash = "different"
	if _, err := CreateOrResumeSession(bad); err == nil {
		t.Fatalf("expected ErrSessionConflict")
	}
}

func TestAppendChunkSequential(t *testing.T) {
	setupTempData(t)

	meta := PartialUploadMeta{
		UploadID:  ComputeUploadID("u1", "music", "h", 8),
		UserID:    "u1",
		AssetType: "music",
		Size:      8,
		FileHash:  "h",
		ChunkSize: 4,
	}
	if _, err := CreateOrResumeSession(meta); err != nil {
		t.Fatalf("create: %v", err)
	}

	if _, err := AppendChunk(meta.UploadID, "u1", 0, []byte("abcd")); err != nil {
		t.Fatalf("append 0: %v", err)
	}

	// Out-of-order rejected.
	if _, err := AppendChunk(meta.UploadID, "u1", 8, []byte("xx")); err == nil {
		t.Fatalf("expected out-of-order error")
	}

	if _, err := AppendChunk(meta.UploadID, "u1", 4, []byte("efgh")); err != nil {
		t.Fatalf("append 4: %v", err)
	}

	got, err := os.ReadFile(filepath.Join(SessionDir(meta.UploadID), PartialUploadDataFilename))
	if err != nil {
		t.Fatalf("read data: %v", err)
	}
	if string(got) != "abcdefgh" {
		t.Fatalf("expected abcdefgh, got %q", string(got))
	}
}

func TestCleanOutdatedSessionsTTL(t *testing.T) {
	setupTempData(t)

	now := time.Now()
	old := PartialUploadMeta{
		UploadID:  "old0000000000000000000000000000a",
		UserID:    "u1",
		AssetType: "music",
		Size:      4,
		FileHash:  "h",
		ChunkSize: 4,
	}
	fresh := PartialUploadMeta{
		UploadID:  "fresh000000000000000000000000000",
		UserID:    "u1",
		AssetType: "music",
		Size:      4,
		FileHash:  "h",
		ChunkSize: 4,
	}
	for _, m := range []PartialUploadMeta{old, fresh} {
		if _, err := CreateOrResumeSession(m); err != nil {
			t.Fatalf("create %s: %v", m.UploadID, err)
		}
	}

	// Backdate the "old" meta well beyond TTL.
	stale := readMetaForTest(t, old.UploadID)
	stale.UpdatedAt = now.Add(-48 * time.Hour).UnixMilli()
	writeMetaForTest(t, stale)

	removed, err := CleanOutdatedSessions(now, PartialUploadTTL)
	if err != nil {
		t.Fatalf("clean: %v", err)
	}
	if removed != 1 {
		t.Fatalf("expected 1 removed, got %d", removed)
	}
	if _, err := os.Stat(SessionDir(old.UploadID)); !os.IsNotExist(err) {
		t.Fatalf("old session should be removed, stat err=%v", err)
	}
	if _, err := os.Stat(SessionDir(fresh.UploadID)); err != nil {
		t.Fatalf("fresh session should be retained, err=%v", err)
	}
}

func readMetaForTest(t *testing.T, uploadID string) PartialUploadMeta {
	t.Helper()
	m, err := readMetaLocked(uploadID)
	if err != nil {
		t.Fatalf("read meta: %v", err)
	}
	return m
}

func writeMetaForTest(t *testing.T, meta PartialUploadMeta) {
	t.Helper()
	if err := writeMetaLocked(meta); err != nil {
		t.Fatalf("write meta: %v", err)
	}
}
