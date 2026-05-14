package migration

import (
	"context"
	"database/sql"
	"path/filepath"
	"testing"

	_ "modernc.org/sqlite"
)

func initUserLimitPreV105Schema(t *testing.T, dir string) {
	t.Helper()
	db, err := sql.Open("sqlite", filepath.Join(dir, "db"))
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	defer db.Close()
	db.SetMaxOpenConns(1)
	stmts := []string{
		`PRAGMA journal_mode=WAL`,
		`CREATE TABLE user (
			id TEXT PRIMARY KEY NOT NULL,
			username TEXT UNIQUE NOT NULL,
			avatar TEXT NOT NULL DEFAULT '',
			nickname TEXT NOT NULL,
			joinTimestamp INTEGER NOT NULL,
			admin INTEGER NOT NULL DEFAULT 0,
			remark TEXT NOT NULL DEFAULT '',
			musicbillOrdersJSON TEXT DEFAULT NULL,
			musicbillMaxAmount INTEGER NOT NULL DEFAULT 100,
			createMusicMaxAmountPerDay INTEGER NOT NULL DEFAULT 10,
			lastActiveTimestamp INTEGER NOT NULL DEFAULT 0,
			musicPlayRecordIndate INTEGER NOT NULL DEFAULT 0,
			password TEXT NOT NULL,
			twoFASecret TEXT DEFAULT NULL
		)`,
		`INSERT INTO user (
			id, username, avatar, nickname, joinTimestamp, admin, remark,
			musicbillOrdersJSON, musicbillMaxAmount, createMusicMaxAmountPerDay,
			lastActiveTimestamp, musicPlayRecordIndate, password, twoFASecret
		) VALUES (
			'user-1', 'alice', 'avatar.jpg', 'Alice', 1700000000000, 1, 'note',
			'["musicbill-1"]', 12, 3, 1700000001000, 30, 'hash', 'totp:secret'
		)`,
	}
	for _, s := range stmts {
		if _, err := db.Exec(s); err != nil {
			t.Fatalf("seed (%s): %v", s, err)
		}
	}
}

func TestM105_DropUserLimitColumns(t *testing.T) {
	resetForTests()
	dir := t.TempDir()
	initUserLimitPreV105Schema(t, dir)
	writeV(t, dir, BaselineVersion+4)

	Register(Migration{
		From:        BaselineVersion + 4,
		To:          BaselineVersion + 5,
		Description: "m105",
		Destructive: true,
		Up:          upDropUserLimitColumns,
	})

	if err := Run(context.Background(), dir); err != nil {
		t.Fatalf("Run: %v", err)
	}

	v, _ := readV(t, dir)
	if v != BaselineVersion+5 {
		t.Fatalf("v = %d, want %d", v, BaselineVersion+5)
	}
	for _, col := range []string{
		"musicbillMaxAmount",
		"createMusicMaxAmountPerDay",
		"musicPlayRecordIndate",
	} {
		if columnExists(t, dir, "user", col) {
			t.Fatalf("user.%s should be removed", col)
		}
	}

	db, err := sql.Open("sqlite", filepath.Join(dir, "db"))
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	defer db.Close()
	db.SetMaxOpenConns(1)
	var username, nickname, remark string
	var admin int
	if err := db.QueryRow(`SELECT username,nickname,admin,remark FROM user WHERE id='user-1'`).
		Scan(&username, &nickname, &admin, &remark); err != nil {
		t.Fatalf("read migrated user: %v", err)
	}
	if username != "alice" || nickname != "Alice" || admin != 1 || remark != "note" {
		t.Fatalf("unexpected migrated user: username=%q nickname=%q admin=%d remark=%q", username, nickname, admin, remark)
	}
}
