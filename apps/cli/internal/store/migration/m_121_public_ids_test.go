package migration

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"path/filepath"
	"regexp"
	"testing"

	_ "modernc.org/sqlite"
)

func initPublicIDsPreV121Schema(t *testing.T, dir string) {
	t.Helper()
	db, err := sql.Open("sqlite", filepath.Join(dir, "db"))
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	defer db.Close()
	db.SetMaxOpenConns(1)

	stmts := []string{
		`PRAGMA journal_mode=WAL`,
		`PRAGMA foreign_keys=ON`,
		`CREATE TABLE user (
			id TEXT PRIMARY KEY NOT NULL,
			username TEXT UNIQUE NOT NULL,
			avatar TEXT NOT NULL DEFAULT '',
			nickname TEXT NOT NULL,
			joinTimestamp INTEGER NOT NULL,
			admin INTEGER NOT NULL DEFAULT 0,
			remark TEXT NOT NULL DEFAULT '',
			musicbillOrdersJSON TEXT DEFAULT NULL,
			lastActiveTimestamp INTEGER NOT NULL DEFAULT 0,
			password TEXT NOT NULL,
			twoFASecret TEXT DEFAULT NULL
		)`,
		`CREATE TABLE auth_session (
			id TEXT PRIMARY KEY NOT NULL,
			userId TEXT NOT NULL REFERENCES user(id),
			tokenHash TEXT NOT NULL UNIQUE,
			tokenPrefix TEXT NOT NULL DEFAULT '',
			deviceName TEXT NOT NULL DEFAULT '',
			createTimestamp INTEGER NOT NULL,
			lastSeenTimestamp INTEGER NOT NULL,
			revokeTimestamp INTEGER DEFAULT NULL,
			revokeReason TEXT NOT NULL DEFAULT ''
		)`,
		`CREATE TABLE artist (
			id TEXT PRIMARY KEY NOT NULL,
			name TEXT NOT NULL,
			aliases TEXT NOT NULL DEFAULT '',
			searchKeywords TEXT NOT NULL DEFAULT '',
			createTimestamp INTEGER NOT NULL
		)`,
		`CREATE TABLE artist_photo (
			id TEXT PRIMARY KEY NOT NULL,
			artistId TEXT NOT NULL REFERENCES artist(id),
			asset TEXT NOT NULL,
			thumbnail TEXT NOT NULL DEFAULT '',
			position INTEGER NOT NULL,
			description TEXT NOT NULL DEFAULT '',
			addTimestamp INTEGER NOT NULL
		)`,
		`CREATE TABLE music (
			id TEXT PRIMARY KEY NOT NULL,
			type INTEGER NOT NULL,
			name TEXT NOT NULL,
			year INTEGER DEFAULT NULL,
			aliases TEXT NOT NULL DEFAULT '',
			searchKeywords TEXT NOT NULL DEFAULT '',
			cover TEXT NOT NULL DEFAULT '',
			coverThumbnail TEXT NOT NULL DEFAULT '',
			asset TEXT NOT NULL,
			assetSize INTEGER NOT NULL DEFAULT 0,
			assetDurationMs INTEGER NOT NULL DEFAULT 0,
			assetCodec TEXT NOT NULL DEFAULT '',
			assetBitRate INTEGER NOT NULL DEFAULT 0,
			heat INTEGER NOT NULL DEFAULT 0,
			createTimestamp INTEGER NOT NULL
		)`,
		`CREATE TABLE music_fork (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			musicId TEXT NOT NULL REFERENCES music(id),
			forkFrom TEXT NOT NULL REFERENCES music(id),
			UNIQUE(musicId, forkFrom) ON CONFLICT REPLACE
		)`,
		`CREATE TABLE lyric (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			musicId TEXT NOT NULL REFERENCES music(id),
			lrc TEXT NOT NULL,
			lrcContent TEXT NOT NULL
		)`,
		`CREATE TABLE music_play_record (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			userId TEXT NOT NULL REFERENCES user(id),
			musicId TEXT NOT NULL REFERENCES music(id),
			clientRecordId TEXT NOT NULL DEFAULT '',
			percent REAL NOT NULL,
			playedAt INTEGER NOT NULL,
			heatCounted INTEGER NOT NULL DEFAULT 0
		)`,
		`CREATE TABLE music_artist_relation (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			musicId TEXT NOT NULL REFERENCES music(id),
			artistId TEXT NOT NULL REFERENCES artist(id),
			role TEXT NOT NULL CHECK(role IN ('performer','lyricist','composer')),
			position INTEGER NOT NULL DEFAULT 0,
			UNIQUE(musicId, role, artistId) ON CONFLICT REPLACE
		)`,
		`CREATE TABLE musicbill (
			id TEXT PRIMARY KEY NOT NULL,
			userId TEXT NOT NULL REFERENCES user(id),
			cover TEXT NOT NULL DEFAULT '',
			name TEXT NOT NULL,
			public INTEGER NOT NULL DEFAULT 0,
			createTimestamp INTEGER NOT NULL
		)`,
		`CREATE TABLE musicbill_music (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			musicbillId TEXT NOT NULL REFERENCES musicbill(id),
			musicId TEXT NOT NULL REFERENCES music(id),
			addTimestamp INTEGER NOT NULL,
			UNIQUE(musicbillId, musicId) ON CONFLICT REPLACE
		)`,
		`CREATE TABLE public_musicbill_collection (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			musicbillId TEXT NOT NULL REFERENCES musicbill(id),
			userId TEXT NOT NULL REFERENCES user(id),
			collectTimestamp INTEGER NOT NULL,
			UNIQUE(musicbillId, userId) ON CONFLICT REPLACE
		)`,
		`CREATE TABLE shared_musicbill (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			musicbillId TEXT NOT NULL REFERENCES musicbill(id),
			sharedUserId TEXT NOT NULL REFERENCES user(id),
			inviteUserId TEXT NOT NULL REFERENCES user(id),
			inviteTimestamp INTEGER NOT NULL,
			accepted INTEGER NOT NULL DEFAULT 0,
			UNIQUE(musicbillId, sharedUserId) ON CONFLICT REPLACE
		)`,
		`INSERT INTO user (id,username,nickname,joinTimestamp,password,musicbillOrdersJSON) VALUES
			('user-1','alice','Alice',1,'hash','["mb-1","missing-mb","mb-2"]'),
			('user-2','bob','Bob',2,'hash','not-json')`,
		`INSERT INTO auth_session (id,userId,tokenHash,tokenPrefix,deviceName,createTimestamp,lastSeenTimestamp,revokeTimestamp,revokeReason) VALUES
			('session-active','user-1','hash-active','prefix','device',1,2,NULL,''),
			('session-revoked','user-2','hash-revoked','prefix','device',1,2,3,'manual')`,
		`INSERT INTO artist (id,name,createTimestamp) VALUES
			('artist-1','Performer',1),
			('artist-2','Composer',2)`,
		`INSERT INTO artist_photo (id,artistId,asset,position,addTimestamp) VALUES
			('photo-1','artist-1','photo.jpg',0,1)`,
		`INSERT INTO music (id,type,name,asset,createTimestamp) VALUES
			('music-1',1,'Song','song.mp3',1),
			('music-2',1,'Source','source.mp3',2)`,
		`INSERT INTO music_fork (musicId,forkFrom) VALUES ('music-1','music-2')`,
		`INSERT INTO lyric (musicId,lrc,lrcContent) VALUES ('music-1','[00:00] hi','hi')`,
		`INSERT INTO music_play_record (userId,musicId,clientRecordId,percent,playedAt) VALUES
			('user-1','music-1','client-1',0.5,1)`,
		`INSERT INTO music_artist_relation (musicId,artistId,role,position) VALUES
			('music-1','artist-1','performer',0),
			('music-1','artist-2','composer',1)`,
		`INSERT INTO musicbill (id,userId,name,public,createTimestamp) VALUES
			('mb-1','user-1','Favorites',1,1),
			('mb-2','user-2','Shared',0,2)`,
		`INSERT INTO musicbill_music (musicbillId,musicId,addTimestamp) VALUES ('mb-1','music-1',1)`,
		`INSERT INTO public_musicbill_collection (musicbillId,userId,collectTimestamp) VALUES ('mb-1','user-2',1)`,
		`INSERT INTO shared_musicbill (musicbillId,sharedUserId,inviteUserId,inviteTimestamp,accepted) VALUES
			('mb-1','user-2','user-1',1,1)`,
	}
	for _, s := range stmts {
		if _, err := db.Exec(s); err != nil {
			t.Fatalf("seed (%s): %v", s, err)
		}
	}
}

func TestM121_RewritesPublicIDsAndRevokesSessions(t *testing.T) {
	resetForTests()
	dir := t.TempDir()
	initPublicIDsPreV121Schema(t, dir)
	writeV(t, dir, BaselineVersion+20)

	Register(Migration{
		From:               BaselineVersion + 20,
		To:                 BaselineVersion + 21,
		Description:        "m121",
		Destructive:        true,
		WithoutForeignKeys: true,
		Up:                 upPublicIDs,
	})

	if err := Run(context.Background(), dir); err != nil {
		t.Fatalf("Run: %v", err)
	}

	v, _ := readV(t, dir)
	if v != BaselineVersion+21 {
		t.Fatalf("v = %d, want %d", v, BaselineVersion+21)
	}

	db, err := sql.Open("sqlite", filepath.Join(dir, "db"))
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	defer db.Close()
	db.SetMaxOpenConns(1)
	if _, err := db.Exec(`PRAGMA foreign_keys=ON`); err != nil {
		t.Fatalf("enable fk: %v", err)
	}

	pattern := regexp.MustCompile(`^[0-9A-Z]{6}$`)
	aliceID := queryString(t, db, `SELECT id FROM user WHERE username='alice'`)
	bobID := queryString(t, db, `SELECT id FROM user WHERE username='bob'`)
	performerID := queryString(t, db, `SELECT id FROM artist WHERE name='Performer'`)
	composerID := queryString(t, db, `SELECT id FROM artist WHERE name='Composer'`)
	songID := queryString(t, db, `SELECT id FROM music WHERE name='Song'`)
	sourceID := queryString(t, db, `SELECT id FROM music WHERE name='Source'`)
	favoritesID := queryString(t, db, `SELECT id FROM musicbill WHERE name='Favorites'`)
	sharedID := queryString(t, db, `SELECT id FROM musicbill WHERE name='Shared'`)
	for label, id := range map[string]string{
		"alice":     aliceID,
		"bob":       bobID,
		"performer": performerID,
		"composer":  composerID,
		"song":      songID,
		"source":    sourceID,
		"favorites": favoritesID,
		"shared":    sharedID,
	} {
		if !pattern.MatchString(id) {
			t.Fatalf("%s id %q does not match new public id pattern", label, id)
		}
	}

	assertString(t, db, `SELECT userId FROM auth_session WHERE id='session-active'`, aliceID)
	assertString(t, db, `SELECT userId FROM auth_session WHERE id='session-revoked'`, bobID)
	assertString(t, db, `SELECT userId FROM musicbill WHERE name='Favorites'`, aliceID)
	assertString(t, db, `SELECT userId FROM music_play_record WHERE clientRecordId='client-1'`, aliceID)
	assertString(t, db, `SELECT musicId FROM music_play_record WHERE clientRecordId='client-1'`, songID)
	assertString(t, db, `SELECT artistId FROM artist_photo WHERE id='photo-1'`, performerID)
	assertString(t, db, `SELECT musicId FROM music_fork`, songID)
	assertString(t, db, `SELECT forkFrom FROM music_fork`, sourceID)
	assertString(t, db, `SELECT musicId FROM lyric`, songID)
	assertString(t, db, `SELECT musicbillId FROM musicbill_music`, favoritesID)
	assertString(t, db, `SELECT musicId FROM musicbill_music`, songID)
	assertString(t, db, `SELECT musicbillId FROM public_musicbill_collection`, favoritesID)
	assertString(t, db, `SELECT userId FROM public_musicbill_collection`, bobID)
	assertString(t, db, `SELECT musicbillId FROM shared_musicbill`, favoritesID)
	assertString(t, db, `SELECT sharedUserId FROM shared_musicbill`, bobID)
	assertString(t, db, `SELECT inviteUserId FROM shared_musicbill`, aliceID)

	relationRows := queryAll(t, dir, `SELECT musicId,artistId,role FROM music_artist_relation ORDER BY role`)
	if len(relationRows) != 2 {
		t.Fatalf("expected 2 music artist relations, got %+v", relationRows)
	}
	wantRelation := map[string]string{
		"composer":  composerID,
		"performer": performerID,
	}
	for _, row := range relationRows {
		role := fmt.Sprint(row["role"])
		if fmt.Sprint(row["musicId"]) != songID || fmt.Sprint(row["artistId"]) != wantRelation[role] {
			t.Fatalf("unexpected migrated relation: %+v", row)
		}
	}

	var aliceOrder []string
	rawOrder := queryString(t, db, `SELECT musicbillOrdersJSON FROM user WHERE username='alice'`)
	if err := json.Unmarshal([]byte(rawOrder), &aliceOrder); err != nil {
		t.Fatalf("decode alice order: %v", err)
	}
	if len(aliceOrder) != 2 || aliceOrder[0] != favoritesID || aliceOrder[1] != sharedID {
		t.Fatalf("unexpected alice musicbill order: %+v", aliceOrder)
	}
	var bobOrder sql.NullString
	if err := db.QueryRow(`SELECT musicbillOrdersJSON FROM user WHERE username='bob'`).Scan(&bobOrder); err != nil {
		t.Fatalf("query bob order: %v", err)
	}
	if bobOrder.Valid {
		t.Fatalf("invalid bob musicbill order should be cleared, got %q", bobOrder.String)
	}

	var activeRevokedAt sql.NullInt64
	var activeReason string
	if err := db.QueryRow(
		`SELECT revokeTimestamp,revokeReason FROM auth_session WHERE id='session-active'`,
	).Scan(&activeRevokedAt, &activeReason); err != nil {
		t.Fatalf("query active session revoke state: %v", err)
	}
	if !activeRevokedAt.Valid || activeReason != "id_migration" {
		t.Fatalf("active session not revoked by migration: timestamp=%+v reason=%q", activeRevokedAt, activeReason)
	}
	var revokedAt int64
	var revokedReason string
	if err := db.QueryRow(
		`SELECT revokeTimestamp,revokeReason FROM auth_session WHERE id='session-revoked'`,
	).Scan(&revokedAt, &revokedReason); err != nil {
		t.Fatalf("query revoked session state: %v", err)
	}
	if revokedAt != 3 || revokedReason != "manual" {
		t.Fatalf("previously revoked session changed: timestamp=%d reason=%q", revokedAt, revokedReason)
	}

	rows, err := db.Query(`PRAGMA foreign_key_check`)
	if err != nil {
		t.Fatalf("foreign_key_check: %v", err)
	}
	if rows.Next() {
		t.Fatalf("foreign_key_check returned violations")
	}
	if err := rows.Close(); err != nil {
		t.Fatalf("close fk rows: %v", err)
	}

	if _, err := db.Exec(`INSERT INTO user (id,username,password,nickname,joinTimestamp) VALUES ('bad-id','bad','hash','Bad',1)`); err == nil {
		t.Fatalf("invalid user id should be rejected")
	}
	if _, err := db.Exec(`INSERT INTO artist (id,name,createTimestamp) VALUES ('bad-id','Bad Artist',1)`); err == nil {
		t.Fatalf("invalid artist id should be rejected")
	}
	if _, err := db.Exec(`INSERT INTO music (id,type,name,asset,createTimestamp) VALUES ('bad-id',1,'Bad Music','bad.mp3',1)`); err == nil {
		t.Fatalf("invalid music id should be rejected")
	}
	if _, err := db.Exec(`INSERT INTO musicbill (id,userId,name,createTimestamp) VALUES ('bad-id',?,'Bad Musicbill',1)`, aliceID); err == nil {
		t.Fatalf("invalid musicbill id should be rejected")
	}
}

func queryString(t *testing.T, db *sql.DB, q string, args ...any) string {
	t.Helper()
	var out string
	if err := db.QueryRow(q, args...).Scan(&out); err != nil {
		t.Fatalf("query %q: %v", q, err)
	}
	return out
}

func assertString(t *testing.T, db *sql.DB, q, want string, args ...any) {
	t.Helper()
	got := queryString(t, db, q, args...)
	if got != want {
		t.Fatalf("%q = %q, want %q", q, got, want)
	}
}
