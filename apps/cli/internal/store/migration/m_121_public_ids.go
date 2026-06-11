package migration

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/json"
	"fmt"
	"math/big"
	"time"
)

const (
	publicIDAlphabetV121 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	publicIDLengthV121   = 6
	publicIDCheckV121    = "length(id)=6 AND id GLOB '[0-9A-Z][0-9A-Z][0-9A-Z][0-9A-Z][0-9A-Z][0-9A-Z]'"
)

func init() {
	Register(Migration{
		From:               BaselineVersion + 20,
		To:                 BaselineVersion + 21,
		Description:        "rewrite public ids to six uppercase alphanumeric characters",
		Destructive:        true,
		WithoutForeignKeys: true,
		Up:                 upPublicIDs,
	})
}

func upPublicIDs(ctx context.Context, env *Env) error {
	for _, spec := range []struct {
		table    string
		mapTable string
	}{
		{table: "user", mapTable: "__user_id_map_v121"},
		{table: "music", mapTable: "__music_id_map_v121"},
		{table: "artist", mapTable: "__artist_id_map_v121"},
		{table: "musicbill", mapTable: "__musicbill_id_map_v121"},
	} {
		if err := createPublicIDMap(ctx, env.Tx, spec.table, spec.mapTable); err != nil {
			return err
		}
	}

	if err := rewriteMusicbillOrders(ctx, env.Tx); err != nil {
		return err
	}
	if err := rebuildUserPublicIDs(ctx, env.Tx); err != nil {
		return err
	}
	if err := rebuildArtistPublicIDs(ctx, env.Tx); err != nil {
		return err
	}
	if err := rebuildMusicPublicIDs(ctx, env.Tx); err != nil {
		return err
	}
	if err := rebuildMusicbillPublicIDs(ctx, env.Tx); err != nil {
		return err
	}
	if err := updatePublicIDReferences(ctx, env.Tx); err != nil {
		return err
	}
	if err := revokeAuthSessionsForPublicIDMigration(ctx, env.Tx, time.Now().UnixMilli()); err != nil {
		return err
	}
	for _, table := range []string{
		"__user_id_map_v121",
		"__music_id_map_v121",
		"__artist_id_map_v121",
		"__musicbill_id_map_v121",
	} {
		if _, err := env.Tx.ExecContext(ctx, `DROP TABLE IF EXISTS `+table); err != nil {
			return fmt.Errorf("drop %s: %w", table, err)
		}
	}
	return verifyForeignKeysIntact(ctx, env.Tx)
}

func createPublicIDMap(ctx context.Context, tx *sql.Tx, sourceTable, mapTable string) error {
	if _, err := tx.ExecContext(ctx, `CREATE TEMP TABLE `+mapTable+` (
		oldID TEXT PRIMARY KEY NOT NULL,
		newID TEXT NOT NULL UNIQUE
	)`); err != nil {
		return fmt.Errorf("create %s: %w", mapTable, err)
	}

	rows, err := tx.QueryContext(ctx, `SELECT id FROM `+sourceTable+` ORDER BY id`)
	if err != nil {
		return fmt.Errorf("select %s ids: %w", sourceTable, err)
	}
	defer rows.Close()

	var oldIDs []string
	used := map[string]bool{}
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return fmt.Errorf("scan %s id: %w", sourceTable, err)
		}
		oldIDs = append(oldIDs, id)
		used[id] = true
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("iterate %s ids: %w", sourceTable, err)
	}

	stmt, err := tx.PrepareContext(ctx, `INSERT INTO `+mapTable+` (oldID,newID) VALUES (?,?)`)
	if err != nil {
		return fmt.Errorf("prepare %s insert: %w", mapTable, err)
	}
	defer stmt.Close()

	for _, oldID := range oldIDs {
		newID, err := generateMigrationPublicID(used)
		if err != nil {
			return fmt.Errorf("generate %s id: %w", sourceTable, err)
		}
		used[newID] = true
		if _, err := stmt.ExecContext(ctx, oldID, newID); err != nil {
			return fmt.Errorf("insert %s mapping: %w", sourceTable, err)
		}
	}
	return nil
}

func generateMigrationPublicID(used map[string]bool) (string, error) {
	max := big.NewInt(int64(len(publicIDAlphabetV121)))
	for {
		bytes := make([]byte, publicIDLengthV121)
		for i := range bytes {
			n, err := rand.Int(rand.Reader, max)
			if err != nil {
				return "", err
			}
			bytes[i] = publicIDAlphabetV121[n.Int64()]
		}
		id := string(bytes)
		if !used[id] {
			return id, nil
		}
	}
}

func rewriteMusicbillOrders(ctx context.Context, tx *sql.Tx) error {
	mbMap := map[string]string{}
	mapRows, err := tx.QueryContext(ctx, `SELECT oldID,newID FROM __musicbill_id_map_v121`)
	if err != nil {
		return fmt.Errorf("select musicbill id map: %w", err)
	}
	for mapRows.Next() {
		var oldID, newID string
		if err := mapRows.Scan(&oldID, &newID); err != nil {
			mapRows.Close()
			return fmt.Errorf("scan musicbill id map: %w", err)
		}
		mbMap[oldID] = newID
	}
	if err := mapRows.Close(); err != nil {
		return fmt.Errorf("close musicbill id map rows: %w", err)
	}
	if err := mapRows.Err(); err != nil {
		return fmt.Errorf("iterate musicbill id map: %w", err)
	}

	type update struct {
		userID string
		value  any
	}
	var updates []update
	rows, err := tx.QueryContext(ctx,
		`SELECT id,musicbillOrdersJSON FROM user WHERE musicbillOrdersJSON IS NOT NULL AND musicbillOrdersJSON!=''`,
	)
	if err != nil {
		return fmt.Errorf("select musicbill order json: %w", err)
	}
	for rows.Next() {
		var userID, raw string
		if err := rows.Scan(&userID, &raw); err != nil {
			rows.Close()
			return fmt.Errorf("scan musicbill order json: %w", err)
		}
		var ids []string
		if err := json.Unmarshal([]byte(raw), &ids); err != nil {
			updates = append(updates, update{userID: userID, value: nil})
			continue
		}
		next := make([]string, 0, len(ids))
		for _, id := range ids {
			if mapped, ok := mbMap[id]; ok {
				next = append(next, mapped)
			}
		}
		encoded, err := json.Marshal(next)
		if err != nil {
			rows.Close()
			return fmt.Errorf("encode musicbill order json: %w", err)
		}
		updates = append(updates, update{userID: userID, value: string(encoded)})
	}
	if err := rows.Close(); err != nil {
		return fmt.Errorf("close musicbill order rows: %w", err)
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("iterate musicbill order rows: %w", err)
	}

	for _, update := range updates {
		if _, err := tx.ExecContext(ctx,
			`UPDATE user SET musicbillOrdersJSON=? WHERE id=?`,
			update.value, update.userID,
		); err != nil {
			return fmt.Errorf("update musicbill order json: %w", err)
		}
	}
	return nil
}

func rebuildUserPublicIDs(ctx context.Context, tx *sql.Tx) error {
	stmts := []string{
		`CREATE TABLE __user_new_v121 (
			id TEXT PRIMARY KEY NOT NULL CHECK(` + publicIDCheckV121 + `),
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
		`INSERT INTO __user_new_v121 (
			id,username,avatar,nickname,joinTimestamp,admin,remark,
			musicbillOrdersJSON,lastActiveTimestamp,password,twoFASecret
		) SELECT
			m.newID,u.username,u.avatar,u.nickname,u.joinTimestamp,u.admin,u.remark,
			u.musicbillOrdersJSON,u.lastActiveTimestamp,u.password,u.twoFASecret
		FROM user u JOIN __user_id_map_v121 m ON m.oldID=u.id`,
		`DROP TABLE user`,
		`ALTER TABLE __user_new_v121 RENAME TO user`,
	}
	return execMigrationStatements(ctx, tx, "rebuild user", stmts)
}

func rebuildArtistPublicIDs(ctx context.Context, tx *sql.Tx) error {
	stmts := []string{
		`CREATE TABLE __artist_new_v121 (
			id TEXT PRIMARY KEY NOT NULL CHECK(` + publicIDCheckV121 + `),
			name TEXT NOT NULL,
			aliases TEXT NOT NULL DEFAULT '',
			searchKeywords TEXT NOT NULL DEFAULT '',
			createTimestamp INTEGER NOT NULL
		)`,
		`INSERT INTO __artist_new_v121 (id,name,aliases,searchKeywords,createTimestamp)
		SELECT m.newID,a.name,a.aliases,a.searchKeywords,a.createTimestamp
		FROM artist a JOIN __artist_id_map_v121 m ON m.oldID=a.id`,
		`DROP TABLE artist`,
		`ALTER TABLE __artist_new_v121 RENAME TO artist`,
	}
	return execMigrationStatements(ctx, tx, "rebuild artist", stmts)
}

func rebuildMusicPublicIDs(ctx context.Context, tx *sql.Tx) error {
	stmts := []string{
		`CREATE TABLE __music_new_v121 (
			id TEXT PRIMARY KEY NOT NULL CHECK(` + publicIDCheckV121 + `),
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
		`INSERT INTO __music_new_v121 (
			id,type,name,year,aliases,searchKeywords,cover,coverThumbnail,asset,
			assetSize,assetDurationMs,assetCodec,assetBitRate,heat,createTimestamp
		) SELECT
			m.newID,music.type,music.name,music.year,music.aliases,music.searchKeywords,music.cover,music.coverThumbnail,music.asset,
			music.assetSize,music.assetDurationMs,music.assetCodec,music.assetBitRate,music.heat,music.createTimestamp
		FROM music JOIN __music_id_map_v121 m ON m.oldID=music.id`,
		`DROP TABLE music`,
		`ALTER TABLE __music_new_v121 RENAME TO music`,
	}
	return execMigrationStatements(ctx, tx, "rebuild music", stmts)
}

func rebuildMusicbillPublicIDs(ctx context.Context, tx *sql.Tx) error {
	stmts := []string{
		`CREATE TABLE __musicbill_new_v121 (
			id TEXT PRIMARY KEY NOT NULL CHECK(` + publicIDCheckV121 + `),
			userId TEXT NOT NULL REFERENCES user(id),
			cover TEXT NOT NULL DEFAULT '',
			name TEXT NOT NULL,
			public INTEGER NOT NULL DEFAULT 0,
			createTimestamp INTEGER NOT NULL
		)`,
		`INSERT INTO __musicbill_new_v121 (id,userId,cover,name,public,createTimestamp)
		SELECT mbm.newID,um.newID,mb.cover,mb.name,mb.public,mb.createTimestamp
		FROM musicbill mb
		JOIN __musicbill_id_map_v121 mbm ON mbm.oldID=mb.id
		JOIN __user_id_map_v121 um ON um.oldID=mb.userId`,
		`DROP TABLE musicbill`,
		`ALTER TABLE __musicbill_new_v121 RENAME TO musicbill`,
	}
	return execMigrationStatements(ctx, tx, "rebuild musicbill", stmts)
}

func updatePublicIDReferences(ctx context.Context, tx *sql.Tx) error {
	updates := []struct {
		table    string
		column   string
		mapTable string
	}{
		{table: "auth_session", column: "userId", mapTable: "__user_id_map_v121"},
		{table: "music_play_record", column: "userId", mapTable: "__user_id_map_v121"},
		{table: "public_musicbill_collection", column: "userId", mapTable: "__user_id_map_v121"},
		{table: "shared_musicbill", column: "sharedUserId", mapTable: "__user_id_map_v121"},
		{table: "shared_musicbill", column: "inviteUserId", mapTable: "__user_id_map_v121"},

		{table: "music_fork", column: "musicId", mapTable: "__music_id_map_v121"},
		{table: "music_fork", column: "forkFrom", mapTable: "__music_id_map_v121"},
		{table: "lyric", column: "musicId", mapTable: "__music_id_map_v121"},
		{table: "music_play_record", column: "musicId", mapTable: "__music_id_map_v121"},
		{table: "music_artist_relation", column: "musicId", mapTable: "__music_id_map_v121"},
		{table: "musicbill_music", column: "musicId", mapTable: "__music_id_map_v121"},

		{table: "artist_photo", column: "artistId", mapTable: "__artist_id_map_v121"},
		{table: "music_artist_relation", column: "artistId", mapTable: "__artist_id_map_v121"},

		{table: "musicbill_music", column: "musicbillId", mapTable: "__musicbill_id_map_v121"},
		{table: "public_musicbill_collection", column: "musicbillId", mapTable: "__musicbill_id_map_v121"},
		{table: "shared_musicbill", column: "musicbillId", mapTable: "__musicbill_id_map_v121"},
	}
	for _, update := range updates {
		if err := updateColumnFromPublicIDMap(ctx, tx, update.table, update.column, update.mapTable); err != nil {
			return err
		}
	}
	return nil
}

func updateColumnFromPublicIDMap(ctx context.Context, tx *sql.Tx, table, column, mapTable string) error {
	q := fmt.Sprintf(
		`UPDATE %s
		SET %s=(SELECT newID FROM %s WHERE oldID=%s.%s)
		WHERE %s IN (SELECT oldID FROM %s)`,
		table, column, mapTable, table, column, column, mapTable,
	)
	if _, err := tx.ExecContext(ctx, q); err != nil {
		return fmt.Errorf("update %s.%s from %s: %w", table, column, mapTable, err)
	}
	return nil
}

func revokeAuthSessionsForPublicIDMigration(ctx context.Context, tx *sql.Tx, now int64) error {
	if _, err := tx.ExecContext(ctx,
		`UPDATE auth_session
		SET revokeTimestamp=?, revokeReason='id_migration'
		WHERE revokeTimestamp IS NULL`,
		now,
	); err != nil {
		return fmt.Errorf("revoke auth sessions: %w", err)
	}
	return nil
}

func execMigrationStatements(ctx context.Context, tx *sql.Tx, label string, stmts []string) error {
	for _, s := range stmts {
		if _, err := tx.ExecContext(ctx, s); err != nil {
			return fmt.Errorf("%s: %w", label, err)
		}
	}
	return nil
}
