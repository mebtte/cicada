package migration

import (
	"context"
	"database/sql"
	"os"
	"path/filepath"
	"testing"

	_ "modernc.org/sqlite"
)

// initSingerSchemaPreV101 seeds a sqlite db at dir/db with the schema as it
// existed before migration 101: singer (with avatar), singer_modify_record,
// and the user table (referenced by singer.createUserId).
func initSingerSchemaPreV101(t *testing.T, dir string) {
	t.Helper()
	db, err := sql.Open("sqlite", filepath.Join(dir, "db"))
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	defer db.Close()
	db.SetMaxOpenConns(1)
	stmts := []string{
		`PRAGMA journal_mode=WAL`,
		`CREATE TABLE user (id TEXT PRIMARY KEY NOT NULL)`,
		`CREATE TABLE singer (
			id TEXT PRIMARY KEY NOT NULL,
			avatar TEXT NOT NULL DEFAULT '',
			name TEXT NOT NULL,
			aliases TEXT NOT NULL DEFAULT '',
			createUserId TEXT NOT NULL REFERENCES user(id),
			createTimestamp INTEGER NOT NULL
		)`,
		`CREATE TABLE singer_modify_record (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			singerId TEXT NOT NULL,
			modifyUserId TEXT NOT NULL,
			key TEXT NOT NULL,
			modifyTimestamp INTEGER NOT NULL
		)`,
		`INSERT INTO user (id) VALUES ('user-a'), ('user-b')`,
		`INSERT INTO singer (id, avatar, name, aliases, createUserId, createTimestamp) VALUES
			('s-with-avatar', 'pic1.jpg', 'Alpha', '', 'user-a', 1700000000000),
			('s-no-avatar',   '',          'Beta',  '', 'user-b', 1700000001000)`,
		`INSERT INTO singer_modify_record (singerId, modifyUserId, key, modifyTimestamp) VALUES
			('s-with-avatar', 'user-a', 'name', 1700000002000)`,
	}
	for _, s := range stmts {
		if _, err := db.Exec(s); err != nil {
			t.Fatalf("seed (%s): %v", s, err)
		}
	}
}

func tableExists(t *testing.T, dir, table string) bool {
	t.Helper()
	db, err := sql.Open("sqlite", filepath.Join(dir, "db"))
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	defer db.Close()
	db.SetMaxOpenConns(1)
	var name string
	err = db.QueryRow(
		`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, table,
	).Scan(&name)
	if err == sql.ErrNoRows {
		return false
	}
	if err != nil {
		t.Fatalf("query sqlite_master: %v", err)
	}
	return name == table
}

func queryAll(t *testing.T, dir, q string) []map[string]any {
	t.Helper()
	db, err := sql.Open("sqlite", filepath.Join(dir, "db"))
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	defer db.Close()
	db.SetMaxOpenConns(1)
	rows, err := db.Query(q)
	if err != nil {
		t.Fatalf("query (%s): %v", q, err)
	}
	defer rows.Close()
	cols, _ := rows.Columns()
	var out []map[string]any
	for rows.Next() {
		vals := make([]any, len(cols))
		ptrs := make([]any, len(cols))
		for i := range vals {
			ptrs[i] = &vals[i]
		}
		if err := rows.Scan(ptrs...); err != nil {
			t.Fatalf("scan: %v", err)
		}
		row := map[string]any{}
		for i, c := range cols {
			row[c] = vals[i]
		}
		out = append(out, row)
	}
	return out
}

func TestM101_SingerPhoto_FullFlow(t *testing.T) {
	resetForTests()
	dir := t.TempDir()
	initSingerSchemaPreV101(t, dir)
	writeV(t, dir, BaselineVersion)

	// Pre-create the new asset dir (Initialize() does this in production) and a
	// legacy file in the old dir to verify the rename phase.
	oldAssetDir := filepath.Join(dir, "assets", "singer_avatar")
	newAssetDir := filepath.Join(dir, "assets", "singer_photo")
	if err := os.MkdirAll(oldAssetDir, 0755); err != nil {
		t.Fatalf("mkdir old: %v", err)
	}
	if err := os.MkdirAll(newAssetDir, 0755); err != nil {
		t.Fatalf("mkdir new: %v", err)
	}
	if err := os.WriteFile(filepath.Join(oldAssetDir, "pic1.jpg"), []byte("fake"), 0644); err != nil {
		t.Fatalf("write asset: %v", err)
	}

	// init() above already registers the production migration; resetForTests
	// wiped it, so re-register via the same Up function.
	Register(Migration{
		From:        BaselineVersion,
		To:          BaselineVersion + 1,
		Description: "m101 (test)",
		Destructive: true,
		Up:          upSingerPhoto,
	})

	if err := Run(context.Background(), dir); err != nil {
		t.Fatalf("Run: %v", err)
	}

	v, _ := readV(t, dir)
	if v != BaselineVersion+1 {
		t.Fatalf("v = %d, want %d", v, BaselineVersion+1)
	}

	// Asset moved, old dir gone.
	if _, err := os.Stat(filepath.Join(newAssetDir, "pic1.jpg")); err != nil {
		t.Fatalf("expected pic1.jpg in singer_photo: %v", err)
	}
	if _, err := os.Stat(oldAssetDir); !os.IsNotExist(err) {
		t.Errorf("expected old singer_avatar dir to be removed: err=%v", err)
	}

	// singer.avatar dropped.
	if columnExists(t, dir, "singer", "avatar") {
		t.Error("singer.avatar should have been dropped")
	}

	// singer_modify_record dropped.
	if tableExists(t, dir, "singer_modify_record") {
		t.Error("singer_modify_record should have been dropped")
	}

	// singer_photo backfilled — only the singer with a non-empty avatar gets a
	// row; description is empty.
	rows := queryAll(t, dir, `SELECT singerId,asset,position,description,addUserId,addTimestamp FROM singer_photo`)
	if len(rows) != 1 {
		t.Fatalf("expected 1 backfilled row, got %d: %+v", len(rows), rows)
	}
	r := rows[0]
	if r["singerId"] != "s-with-avatar" || r["asset"] != "pic1.jpg" || r["addUserId"] != "user-a" {
		t.Errorf("unexpected backfill: %+v", r)
	}
	if r["position"].(int64) != 0 {
		t.Errorf("position = %v, want 0", r["position"])
	}
	if r["description"] != "" {
		t.Errorf("description = %q, want empty", r["description"])
	}
}

func TestM101_SingerPhoto_NoLegacyAssets(t *testing.T) {
	resetForTests()
	dir := t.TempDir()
	initSingerSchemaPreV101(t, dir)
	writeV(t, dir, BaselineVersion)

	// Only the new dir exists; old never existed.
	if err := os.MkdirAll(filepath.Join(dir, "assets", "singer_photo"), 0755); err != nil {
		t.Fatalf("mkdir: %v", err)
	}

	Register(Migration{
		From: BaselineVersion, To: BaselineVersion + 1,
		Description: "m101", Destructive: true, Up: upSingerPhoto,
	})

	if err := Run(context.Background(), dir); err != nil {
		t.Fatalf("Run: %v", err)
	}
	if columnExists(t, dir, "singer", "avatar") {
		t.Error("avatar column should be dropped even without legacy files")
	}
}
