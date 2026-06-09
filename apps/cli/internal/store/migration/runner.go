package migration

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	_ "modernc.org/sqlite"
)

// Run brings data/v in dataDir up to CurrentVersion(). It MUST be called
// before opening the long-lived database connection — Run owns the connection
// while it runs and closes it before returning.
//
// Cases:
//   - v file missing: fresh install, stamp CurrentVersion.
//   - v <= LegacyMaxVersion: bridge from old scheme, stamp BaselineVersion.
//   - v == CurrentVersion: nothing to do.
//   - v > CurrentVersion: error (binary too old for this data).
//   - BaselineVersion <= v < CurrentVersion: run migrations in order.
//
// On crash mid-upgrade, upgrade.lock is left behind so Recover (called before
// Run) can clean up on the next start. Callers should always call Recover
// before Run.
func Run(ctx context.Context, dataDir string) error {
	target := CurrentVersion()
	vPath := filepath.Join(dataDir, "v")

	current, exists, err := readVersion(vPath)
	if err != nil {
		return err
	}

	if !exists {
		return writeVersion(vPath, target)
	}

	if current <= LegacyMaxVersion {
		fmt.Fprintf(os.Stderr,
			"data: bridging legacy version %d to baseline %d\n", current, BaselineVersion)
		if err := writeVersion(vPath, BaselineVersion); err != nil {
			return err
		}
		current = BaselineVersion
	}

	if current > target {
		return fmt.Errorf(
			"data version %d is newer than this binary supports (%d); please upgrade cicada",
			current, target,
		)
	}
	if current == target {
		return nil
	}
	return runUpgrade(ctx, dataDir, current, target)
}

func runUpgrade(ctx context.Context, dataDir string, from, to int) error {
	pending := pendingMigrations(from, to)
	if err := validateChain(pending, from, to); err != nil {
		return err
	}

	if err := writeLock(filepath.Join(dataDir, "upgrade.lock"), LockState{
		From:        from,
		To:          to,
		Started:     time.Now().UnixMilli(),
		PID:         os.Getpid(),
		LastApplied: from,
	}); err != nil {
		return fmt.Errorf("write upgrade.lock: %w", err)
	}

	dbPath := filepath.Join(dataDir, "db")
	backupPath := filepath.Join(dataDir, "db.backup")
	if err := BackupDB(dbPath, backupPath); err != nil {
		return fmt.Errorf("backup db: %w", err)
	}

	journal, err := OpenJournal(dataDir)
	if err != nil {
		return err
	}

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		journal.Close()
		return fmt.Errorf("open db: %w", err)
	}
	db.SetMaxOpenConns(1)
	if _, err := db.Exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL; PRAGMA foreign_keys=ON;`); err != nil {
		db.Close()
		journal.Close()
		return fmt.Errorf("pragma: %w", err)
	}

	for _, m := range pending {
		desc := m.Description
		if m.Destructive {
			desc = "[destructive] " + desc
		}
		fmt.Fprintf(os.Stderr, "data: applying %d -> %d  %s\n", m.From, m.To, desc)

		if m.WithoutForeignKeys {
			if _, err := db.Exec(`PRAGMA foreign_keys=OFF`); err != nil {
				db.Close()
				journal.Close()
				return fmt.Errorf("disable foreign keys for %d: %w", m.To, err)
			}
		}

		tx, err := db.BeginTx(ctx, nil)
		if err != nil {
			db.Close()
			journal.Close()
			return fmt.Errorf("begin tx for %d: %w", m.To, err)
		}
		env := &Env{Tx: tx, DataDir: dataDir, Journal: journal}
		if err := runOne(ctx, m, env); err != nil {
			_ = tx.Rollback()
			// Undo this migration's filesystem ops; the next Recover (on next
			// boot) is the safety net for db restoration.
			_ = ReplayReverse(dataDir, m.From)
			if m.WithoutForeignKeys {
				_, _ = db.Exec(`PRAGMA foreign_keys=ON`)
			}
			db.Close()
			journal.Close()
			return fmt.Errorf("migration %d -> %d: %w", m.From, m.To, err)
		}
		if err := tx.Commit(); err != nil {
			if m.WithoutForeignKeys {
				_, _ = db.Exec(`PRAGMA foreign_keys=ON`)
			}
			db.Close()
			journal.Close()
			return fmt.Errorf("commit %d: %w", m.To, err)
		}
		if m.WithoutForeignKeys {
			if _, err := db.Exec(`PRAGMA foreign_keys=ON`); err != nil {
				db.Close()
				journal.Close()
				return fmt.Errorf("re-enable foreign keys after %d: %w", m.To, err)
			}
		}
		if err := journal.Checkpoint(m.To); err != nil {
			db.Close()
			journal.Close()
			return fmt.Errorf("journal checkpoint %d: %w", m.To, err)
		}
		if err := writeLock(filepath.Join(dataDir, "upgrade.lock"), LockState{
			From:        from,
			To:          to,
			Started:     time.Now().UnixMilli(),
			PID:         os.Getpid(),
			LastApplied: m.To,
		}); err != nil {
			db.Close()
			journal.Close()
			return fmt.Errorf("update upgrade.lock: %w", err)
		}
	}

	if err := db.Close(); err != nil {
		journal.Close()
		return fmt.Errorf("close db: %w", err)
	}
	if err := journal.Close(); err != nil {
		return fmt.Errorf("close journal: %w", err)
	}

	if err := writeVersion(filepath.Join(dataDir, "v"), to); err != nil {
		return fmt.Errorf("stamp version: %w", err)
	}

	if err := cleanupArtifacts(dataDir); err != nil {
		return fmt.Errorf("cleanup after upgrade: %w", err)
	}
	return nil
}

func runOne(ctx context.Context, m Migration, env *Env) (err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("panic: %v", r)
		}
	}()
	return m.Up(ctx, env)
}

func pendingMigrations(from, to int) []Migration {
	all := Migrations()
	var out []Migration
	for _, m := range all {
		if m.To > from && m.To <= to {
			out = append(out, m)
		}
	}
	return out
}

// validateChain ensures the migrations form an unbroken From -> To chain
// from `from` to `to`. Catches gaps or branching at config time rather than
// midway through an upgrade.
func validateChain(ms []Migration, from, to int) error {
	cursor := from
	for _, m := range ms {
		if m.From != cursor {
			return fmt.Errorf(
				"migration chain broken: expected From=%d, got %d -> %d",
				cursor, m.From, m.To,
			)
		}
		cursor = m.To
	}
	if cursor != to {
		return fmt.Errorf("migration chain ends at %d, target is %d", cursor, to)
	}
	return nil
}

func readVersion(path string) (int, bool, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return 0, false, nil
		}
		return 0, false, fmt.Errorf("read v: %w", err)
	}
	v, err := strconv.Atoi(strings.TrimSpace(string(raw)))
	if err != nil {
		return 0, false, fmt.Errorf("parse v %q: %w", string(raw), err)
	}
	return v, true, nil
}

func writeVersion(path string, v int) error {
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, []byte(strconv.Itoa(v)), 0644); err != nil {
		return err
	}
	return os.Rename(tmp, path)
}
