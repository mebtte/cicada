package migration

import (
	"database/sql"
	"errors"
	"fmt"
	"io"
	"os"

	_ "modernc.org/sqlite"
)

// BackupDB writes a clean single-file copy of the SQLite database at src to
// dst using `VACUUM INTO`. This sidesteps WAL/SHM aux files and guarantees a
// consistent snapshot. Caller must ensure no concurrent writers; in cicada
// startup this is true because Initialize runs before any other DB user.
//
// dst is removed first if it exists — VACUUM INTO refuses an existing file.
func BackupDB(src, dst string) error {
	if _, err := os.Stat(src); errors.Is(err, os.ErrNotExist) {
		return fmt.Errorf("backup: source db %s does not exist", src)
	}
	if err := os.Remove(dst); err != nil && !errors.Is(err, os.ErrNotExist) {
		return fmt.Errorf("remove stale backup: %w", err)
	}
	db, err := sql.Open("sqlite", src)
	if err != nil {
		return fmt.Errorf("open db for backup: %w", err)
	}
	defer db.Close()
	db.SetMaxOpenConns(1)
	if _, err := db.Exec("VACUUM INTO ?", dst); err != nil {
		return fmt.Errorf("vacuum into %s: %w", dst, err)
	}
	return nil
}

// RestoreDB overwrites target with the contents of backup. Used by Recover
// when a previous upgrade attempt crashed.
//
// SQLite WAL aux files (db-wal, db-shm) carry state that belongs to the
// post-crash db, not the backup; they're removed so the restored db opens
// cleanly.
func RestoreDB(backup, target string) error {
	if _, err := os.Stat(backup); errors.Is(err, os.ErrNotExist) {
		return fmt.Errorf("restore: backup %s does not exist", backup)
	}
	for _, aux := range []string{target + "-wal", target + "-shm"} {
		if err := os.Remove(aux); err != nil && !errors.Is(err, os.ErrNotExist) {
			return fmt.Errorf("remove %s: %w", aux, err)
		}
	}
	if err := copyFile(backup, target); err != nil {
		return fmt.Errorf("copy backup over target: %w", err)
	}
	return nil
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()
	out, err := os.OpenFile(dst, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	if _, err := io.Copy(out, in); err != nil {
		out.Close()
		return err
	}
	if err := out.Sync(); err != nil {
		out.Close()
		return err
	}
	return out.Close()
}
