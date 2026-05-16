package migration

import (
	"context"
	"database/sql"
	"errors"
	"os"
	"path/filepath"
	"testing"

	_ "modernc.org/sqlite"
)

func initAuthSessionPreV104Schema(t *testing.T, dir string) {
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
			joinTimestamp INTEGER NOT NULL,
			tokenIdentifier TEXT NOT NULL DEFAULT ''
		)`,
		`INSERT INTO user (id, username, password, nickname, joinTimestamp, tokenIdentifier)
			VALUES ('user-1', 'creator', 'hash', 'Creator', 1700000000000, 'token-id')`,
	}
	for _, s := range stmts {
		if _, err := db.Exec(s); err != nil {
			t.Fatalf("seed (%s): %v", s, err)
		}
	}
}

func TestM104_AuthSession(t *testing.T) {
	resetForTests()
	dir := t.TempDir()
	initAuthSessionPreV104Schema(t, dir)
	writeV(t, dir, BaselineVersion+3)

	jwtSecretPath := filepath.Join(dir, "jwt_secret")
	if err := os.WriteFile(jwtSecretPath, []byte("secret"), 0600); err != nil {
		t.Fatalf("write jwt secret: %v", err)
	}

	Register(Migration{
		From:        BaselineVersion + 3,
		To:          BaselineVersion + 4,
		Description: "m104",
		Destructive: true,
		Up:          upAuthSession,
	})

	if err := Run(context.Background(), dir); err != nil {
		t.Fatalf("Run: %v", err)
	}

	v, _ := readV(t, dir)
	if v != BaselineVersion+4 {
		t.Fatalf("v = %d, want %d", v, BaselineVersion+4)
	}
	if !tableExists(t, dir, "auth_session") {
		t.Fatal("auth_session should exist")
	}
	if columnExists(t, dir, "auth_session", "deviceType") {
		t.Fatal("auth_session.deviceType should not exist")
	}
	if columnExists(t, dir, "user", "tokenIdentifier") {
		t.Fatal("user.tokenIdentifier should be removed")
	}
	if _, err := os.Stat(jwtSecretPath); !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("jwt_secret should be removed, err=%v", err)
	}
}
