package migration

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"testing"
)

func TestM103_RemoveRuntimeTrashDir(t *testing.T) {
	resetForTests()
	dir := t.TempDir()
	initDB(t, dir)
	writeV(t, dir, BaselineVersion+2)

	trashDir := filepath.Join(dir, "trash")
	if err := os.MkdirAll(trashDir, 0755); err != nil {
		t.Fatalf("mkdir trash: %v", err)
	}
	if err := os.WriteFile(filepath.Join(trashDir, "old.json"), []byte("old"), 0644); err != nil {
		t.Fatalf("write trash file: %v", err)
	}

	Register(Migration{
		From:        BaselineVersion + 2,
		To:          BaselineVersion + 3,
		Description: "m103",
		Destructive: true,
		Up:          upRemoveRuntimeTrashDir,
	})

	if err := Run(context.Background(), dir); err != nil {
		t.Fatalf("Run: %v", err)
	}

	v, _ := readV(t, dir)
	if v != BaselineVersion+3 {
		t.Fatalf("v = %d, want %d", v, BaselineVersion+3)
	}
	if _, err := os.Stat(trashDir); !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("expected runtime trash dir to be removed, err=%v", err)
	}
	if _, err := os.Stat(filepath.Join(dir, "upgrade.trash")); !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("expected upgrade.trash to be cleaned, err=%v", err)
	}
}
