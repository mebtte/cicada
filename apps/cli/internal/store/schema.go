package store

import (
	"cicada/internal/config"
	"cicada/internal/store/migration"
	"context"
	"crypto/md5"
	"crypto/rand"
	"fmt"
	"math/big"
	"os"
	"time"
)

const (
	TableUser                      = "user"
	TableCaptcha                   = "captcha"
	TableSinger                    = "singer"
	TableSingerPhoto               = "singer_photo"
	TableMusic                     = "music"
	TableMusicFork                 = "music_fork"
	TableLyric                     = "lyric"
	TableMusicPlayRecord           = "music_play_record"
	TableMusicSingerRelation       = "music_singer_relation"
	TableMusicbill                 = "musicbill"
	TableMusicbillMusic            = "musicbill_music"
	TablePublicMusicbillCollection = "public_musicbill_collection"
	TableSharedMusicbill           = "shared_musicbill"
)

var tables = []string{
	`CREATE TABLE IF NOT EXISTS user (
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
	`CREATE TABLE IF NOT EXISTS auth_session (
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
	`CREATE INDEX IF NOT EXISTS idx_auth_session_user ON auth_session(userId, revokeTimestamp, lastSeenTimestamp)`,
	`CREATE INDEX IF NOT EXISTS idx_auth_session_cleanup ON auth_session(revokeTimestamp, lastSeenTimestamp)`,
	`CREATE TABLE IF NOT EXISTS captcha (
		id TEXT PRIMARY KEY NOT NULL,
		value TEXT NOT NULL,
		createTimestamp INTEGER NOT NULL,
		used INTEGER NOT NULL DEFAULT 0
	)`,
	`CREATE TABLE IF NOT EXISTS singer (
		id TEXT PRIMARY KEY NOT NULL,
		name TEXT NOT NULL,
		aliases TEXT NOT NULL DEFAULT '',
		createUserId TEXT NOT NULL REFERENCES user(id),
		createTimestamp INTEGER NOT NULL
	)`,
	`CREATE TABLE IF NOT EXISTS singer_photo (
		id TEXT PRIMARY KEY NOT NULL,
		singerId TEXT NOT NULL REFERENCES singer(id),
		asset TEXT NOT NULL,
		position INTEGER NOT NULL,
		description TEXT NOT NULL DEFAULT '',
		addUserId TEXT NOT NULL REFERENCES user(id),
		addTimestamp INTEGER NOT NULL
	)`,
	`CREATE INDEX IF NOT EXISTS idx_singer_photo_singer ON singer_photo(singerId, position)`,
	`CREATE TABLE IF NOT EXISTS music (
		id TEXT PRIMARY KEY NOT NULL,
		type INTEGER NOT NULL,
		name TEXT NOT NULL,
		year INTEGER DEFAULT NULL,
		aliases TEXT NOT NULL DEFAULT '',
		cover TEXT NOT NULL DEFAULT '',
		asset TEXT NOT NULL,
		heat INTEGER NOT NULL DEFAULT 0,
		createUserId TEXT NOT NULL REFERENCES user(id),
		createTimestamp INTEGER NOT NULL
	)`,
	`CREATE TABLE IF NOT EXISTS music_fork (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		musicId TEXT NOT NULL REFERENCES music(id),
		forkFrom TEXT NOT NULL REFERENCES music(id),
		UNIQUE(musicId, forkFrom) ON CONFLICT REPLACE
	)`,
	`CREATE TABLE IF NOT EXISTS lyric (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		musicId TEXT NOT NULL REFERENCES music(id),
		lrc TEXT NOT NULL,
		lrcContent TEXT NOT NULL
	)`,
	`CREATE TABLE IF NOT EXISTS music_play_record (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		userId TEXT NOT NULL REFERENCES user(id),
		musicId TEXT NOT NULL REFERENCES music(id),
		percent REAL NOT NULL,
		timestamp INTEGER NOT NULL
	)`,
	`CREATE TABLE IF NOT EXISTS music_singer_relation (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		musicId TEXT NOT NULL REFERENCES music(id),
		singerId TEXT NOT NULL REFERENCES singer(id),
		UNIQUE(musicId, singerId) ON CONFLICT REPLACE
	)`,
	`CREATE TABLE IF NOT EXISTS musicbill (
		id TEXT PRIMARY KEY NOT NULL,
		userId TEXT NOT NULL REFERENCES user(id),
		cover TEXT NOT NULL DEFAULT '',
		name TEXT NOT NULL,
		public INTEGER NOT NULL DEFAULT 0,
		createTimestamp INTEGER NOT NULL
	)`,
	`CREATE TABLE IF NOT EXISTS musicbill_music (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		musicbillId TEXT NOT NULL REFERENCES musicbill(id),
		musicId TEXT NOT NULL REFERENCES music(id),
		addTimestamp INTEGER NOT NULL,
		UNIQUE(musicbillId, musicId) ON CONFLICT REPLACE
	)`,
	`CREATE TABLE IF NOT EXISTS public_musicbill_collection (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		musicbillId TEXT NOT NULL REFERENCES musicbill(id),
		userId TEXT NOT NULL REFERENCES user(id),
		collectTimestamp INTEGER NOT NULL,
		UNIQUE(musicbillId, userId) ON CONFLICT REPLACE
	)`,
	`CREATE TABLE IF NOT EXISTS shared_musicbill (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		musicbillId TEXT NOT NULL REFERENCES musicbill(id),
		sharedUserId TEXT NOT NULL REFERENCES user(id),
		inviteUserId TEXT NOT NULL REFERENCES user(id),
		inviteTimestamp INTEGER NOT NULL,
		accepted INTEGER NOT NULL DEFAULT 0,
		UNIQUE(musicbillId, sharedUserId) ON CONFLICT REPLACE
	)`,
}

// Initialize creates directories, verifies data version, creates tables and default admin.
func Initialize() error {
	// Directories
	dirs := append(
		[]string{
			config.Get().Data,
			config.LogDir(),
			config.AccessLogDir(),
			config.SchedulerLogDir(),
			config.CacheDir(),
			config.ThumbnailCacheDir(),
			config.MusicTranscodeCacheDir(),
			config.AssetsDir(),
		},
		func() []string {
			s := make([]string, len(config.AllAssetTypes))
			for i, t := range config.AllAssetTypes {
				s[i] = config.AssetDir(t)
			}
			return s
		}()...,
	)
	for _, d := range dirs {
		if err := os.MkdirAll(d, 0755); err != nil {
			return fmt.Errorf("mkdir %s: %w", d, err)
		}
	}

	// Recover from any half-finished previous upgrade before touching the db.
	if err := migration.Recover(config.Get().Data); err != nil {
		return fmt.Errorf("recover: %w", err)
	}

	// Bring data dir to the binary's current data version (no-op when up to
	// date). Run owns the db connection while it works and closes it before
	// returning, so the long-lived Open() below gets a clean handle.
	if err := migration.Run(context.Background(), config.Get().Data); err != nil {
		return fmt.Errorf("data upgrade: %w", err)
	}

	// Open DB
	if err := Open(config.DBPath()); err != nil {
		return fmt.Errorf("open db: %w", err)
	}

	// Create tables
	for _, ddl := range tables {
		if _, err := DB().Exec(ddl); err != nil {
			return fmt.Errorf("create table: %w", err)
		}
	}

	// Seed default admin if none exists
	var adminID string
	if err := DB().QueryRow(`SELECT id FROM user WHERE admin=1`).Scan(&adminID); err != nil {
		const (
			username    = "cicada"
			letterBytes = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
		)
		idNum, err := rand.Int(rand.Reader, big.NewInt(9990000))
		if err != nil {
			return fmt.Errorf("generate admin id: %w", err)
		}
		id := fmt.Sprintf("%d", 10000+idNum.Int64())
		password, err := secureRandomString(16, letterBytes)
		if err != nil {
			return fmt.Errorf("generate admin password: %w", err)
		}
		passwordHash, err := HashPassword(password)
		if err != nil {
			return fmt.Errorf("hash admin password: %w", err)
		}
		_, err = DB().Exec(
			`INSERT INTO user (id,username,password,nickname,joinTimestamp,admin) VALUES (?,?,?,?,?,1)`,
			id, username, passwordHash, "Cicada", time.Now().UnixMilli(),
		)
		if err != nil {
			return fmt.Errorf("seed admin: %w", err)
		}
		fmt.Printf("\n========================================\n")
		fmt.Printf("  DEFAULT USER\n")
		fmt.Printf("  Username : %s\n", username)
		fmt.Printf("  Password : %s\n", password)
		fmt.Printf("========================================\n\n")
	}
	return nil
}

func doubleMD5(s string) string {
	a := md5.Sum([]byte(s))
	b := md5.Sum([]byte(fmt.Sprintf("%x", a)))
	return fmt.Sprintf("%x", b)
}

// DoubleMD5 is the exported hash used for passwords.
func DoubleMD5(s string) string { return doubleMD5(s) }

func secureRandomString(n int, chars string) (string, error) {
	b := make([]byte, n)
	for i := range b {
		idx, err := rand.Int(rand.Reader, big.NewInt(int64(len(chars))))
		if err != nil {
			return "", err
		}
		b[i] = chars[idx.Int64()]
	}
	return string(b), nil
}
