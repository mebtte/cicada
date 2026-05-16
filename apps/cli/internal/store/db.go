package store

import (
	"database/sql"
	"sync"

	_ "modernc.org/sqlite"
)

var (
	once sync.Once
	db   *sql.DB
)

// Open initialises the SQLite connection (called once at startup).
func Open(path string) error {
	var err error
	once.Do(func() {
		db, err = sql.Open("sqlite", path)
		if err != nil {
			return
		}
		db.SetMaxOpenConns(1) // SQLite requires single writer
		_, err = db.Exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL; PRAGMA foreign_keys=ON;`)
	})
	return err
}

// DB returns the shared *sql.DB instance.
func DB() *sql.DB { return db }

// ResetForTests closes the shared DB and clears the one-time initializer.
// It is intended for tests that need an isolated temporary database.
func ResetForTests() error {
	if db != nil {
		if err := db.Close(); err != nil {
			return err
		}
	}
	db = nil
	once = sync.Once{}
	return nil
}
