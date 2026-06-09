package migration

import (
	"context"
	"database/sql"
	"path/filepath"
	"testing"

	_ "modernc.org/sqlite"
)

func initAuthSessionPreV119Schema(t *testing.T, dir string) {
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
			password TEXT NOT NULL,
			nickname TEXT NOT NULL,
			joinTimestamp INTEGER NOT NULL
		)`,
		`INSERT INTO user (id, username, password, nickname, joinTimestamp)
			VALUES ('user-1', 'alice', 'hash', 'Alice', 1700000000000)`,
		`CREATE TABLE auth_session (
			id TEXT PRIMARY KEY NOT NULL,
			userId TEXT NOT NULL REFERENCES user(id),
			tokenHash TEXT NOT NULL UNIQUE,
			tokenPrefix TEXT NOT NULL DEFAULT '',
			deviceName TEXT NOT NULL DEFAULT '',
			userAgent TEXT NOT NULL DEFAULT '',
			createIP TEXT NOT NULL DEFAULT '',
			lastSeenIP TEXT NOT NULL DEFAULT '',
			createTimestamp INTEGER NOT NULL,
			lastSeenTimestamp INTEGER NOT NULL,
			revokeTimestamp INTEGER DEFAULT NULL,
			revokeReason TEXT NOT NULL DEFAULT ''
		)`,
		`INSERT INTO auth_session (
			id, userId, tokenHash, tokenPrefix, deviceName,
			userAgent, createIP, lastSeenIP, createTimestamp, lastSeenTimestamp
		) VALUES (
			'session-1', 'user-1', 'hash-1', 'prefix-1', 'Chrome on macOS',
			'Mozilla/5.0', '127.0.0.1', '127.0.0.1', 1700000001000, 1700000002000
		)`,
	}
	for _, s := range stmts {
		if _, err := db.Exec(s); err != nil {
			t.Fatalf("seed (%s): %v", s, err)
		}
	}
}

func TestM119_DropAuthSessionMetadata(t *testing.T) {
	resetForTests()
	dir := t.TempDir()
	initAuthSessionPreV119Schema(t, dir)
	writeV(t, dir, BaselineVersion+18)

	Register(Migration{
		From:        BaselineVersion + 18,
		To:          BaselineVersion + 19,
		Description: "m119",
		Destructive: true,
		Up:          upDropAuthSessionMetadata,
	})

	if err := Run(context.Background(), dir); err != nil {
		t.Fatalf("Run: %v", err)
	}

	v, _ := readV(t, dir)
	if v != BaselineVersion+19 {
		t.Fatalf("v = %d, want %d", v, BaselineVersion+19)
	}
	for _, col := range []string{"userAgent", "createIP", "lastSeenIP"} {
		if columnExists(t, dir, "auth_session", col) {
			t.Fatalf("auth_session.%s should be removed", col)
		}
	}

	db, err := sql.Open("sqlite", filepath.Join(dir, "db"))
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	defer db.Close()
	db.SetMaxOpenConns(1)
	var deviceName string
	var createTs, lastSeenTs int64
	if err := db.QueryRow(`SELECT deviceName,createTimestamp,lastSeenTimestamp FROM auth_session WHERE id='session-1'`).
		Scan(&deviceName, &createTs, &lastSeenTs); err != nil {
		t.Fatalf("read migrated session: %v", err)
	}
	if deviceName != "Chrome on macOS" || createTs != 1700000001000 || lastSeenTs != 1700000002000 {
		t.Fatalf("unexpected session: deviceName=%q createTs=%d lastSeenTs=%d", deviceName, createTs, lastSeenTs)
	}
}
