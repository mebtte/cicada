package store

import (
	"cicada/internal/config"
	"crypto/md5"
	"fmt"
	"math/rand"
	"os"
	"strconv"
	"strings"
	"time"
)

const (
	dataVersion = 2

	TableUser                     = "user"
	TableCaptcha                  = "captcha"
	TableSinger                   = "singer"
	TableSingerModifyRecord       = "singer_modify_record"
	TableMusic                    = "music"
	TableMusicModifyRecord        = "music_modify_record"
	TableMusicFork                = "music_fork"
	TableLyric                    = "lyric"
	TableMusicPlayRecord          = "music_play_record"
	TableMusicSingerRelation      = "music_singer_relation"
	TableMusicbill                = "musicbill"
	TableMusicbillMusic           = "musicbill_music"
	TablePublicMusicbillCollection = "public_musicbill_collection"
	TableSharedMusicbill          = "shared_musicbill"
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
		tokenIdentifier TEXT NOT NULL DEFAULT '',
		twoFASecret TEXT DEFAULT NULL
	)`,
	`CREATE TABLE IF NOT EXISTS captcha (
		id TEXT PRIMARY KEY NOT NULL,
		value TEXT NOT NULL,
		createTimestamp INTEGER NOT NULL,
		used INTEGER NOT NULL DEFAULT 0
	)`,
	`CREATE TABLE IF NOT EXISTS singer (
		id TEXT PRIMARY KEY NOT NULL,
		avatar TEXT NOT NULL DEFAULT '',
		name TEXT NOT NULL,
		aliases TEXT NOT NULL DEFAULT '',
		createUserId TEXT NOT NULL REFERENCES user(id),
		createTimestamp INTEGER NOT NULL
	)`,
	`CREATE TABLE IF NOT EXISTS singer_modify_record (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		singerId TEXT NOT NULL REFERENCES singer(id),
		modifyUserId TEXT NOT NULL REFERENCES user(id),
		key TEXT NOT NULL,
		modifyTimestamp INTEGER NOT NULL
	)`,
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
	`CREATE TABLE IF NOT EXISTS music_modify_record (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		musicId TEXT NOT NULL REFERENCES music(id),
		modifyUserId TEXT NOT NULL REFERENCES user(id),
		key TEXT NOT NULL,
		modifyTimestamp INTEGER NOT NULL
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
		[]string{config.Get().Data, config.TrashDir(), config.LogDir(), config.CacheDir(), config.AssetsDir()},
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

	// Data version
	vPath := config.DataVersionPath()
	if raw, err := os.ReadFile(vPath); err == nil {
		v, _ := strconv.Atoi(strings.TrimSpace(string(raw)))
		if v < dataVersion {
			return fmt.Errorf("data is v%d; run 'cicada upgrade-data' first", v)
		}
		if v > dataVersion {
			return fmt.Errorf("data version %d is newer than this binary; please upgrade cicada", v)
		}
	} else {
		if err := os.WriteFile(vPath, []byte(strconv.Itoa(dataVersion)), 0644); err != nil {
			return fmt.Errorf("write version file: %w", err)
		}
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
		r := rand.New(rand.NewSource(time.Now().UnixNano()))
		id := fmt.Sprintf("%d", 10000+r.Intn(9990000))
		pwBytes := make([]byte, 16)
		for i := range pwBytes {
			pwBytes[i] = letterBytes[r.Intn(len(letterBytes))]
		}
		password := string(pwBytes)
		_, err = DB().Exec(
			`INSERT INTO user (id,username,password,nickname,joinTimestamp,admin) VALUES (?,?,?,?,?,1)`,
			id, username, doubleMD5(password), "Cicada", time.Now().UnixMilli(),
		)
		if err != nil {
			return fmt.Errorf("seed admin: %w", err)
		}
		fmt.Printf("\n========================================\n")
		fmt.Printf("  Default user created\n")
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
