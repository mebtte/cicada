package scheduler

import (
	"cicada/internal/config"
	"cicada/internal/store"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/robfig/cron/v3"
)

func Start() {
	c := cron.New()

	// Daily jobs spread from 04:00, every 5 minutes apart
	jobs := []struct {
		name string
		fn   func()
	}{
		{"remove_outdated_db", removeOutdatedDB},
		{"remove_no_music_singer", removeNoMusicSinger},
		{"remove_unlinked_asset", removeUnlinkedAsset},
		{"remove_outdated_play_record", removeOutdatedPlayRecord},
		{"remove_outdated_shared_invitation", removeOutdatedSharedInvitation},
		{"clean_outdated_file", cleanOutdatedFile},
	}

	hour, min := 4, 0
	for _, job := range jobs {
		job := job // capture
		schedule := fmt.Sprintf("%d %d * * *", min, hour)
		c.AddFunc(schedule, func() {
			log.Printf("[schedule] %s start", job.name)
			job.fn()
			log.Printf("[schedule] %s finish", job.name)
		})
		min += 5
		if min >= 60 {
			min = 0
			hour++
		}
	}

	c.Start()
}

// removeOutdatedDB deletes expired captcha records.
func removeOutdatedDB() {
	now := time.Now().UnixMilli()
	tables := []struct {
		table     string
		col       string
		ttlMillis int64
	}{
		{"captcha", "createTimestamp", int64(3 * 24 * time.Hour / time.Millisecond)},
	}
	for _, t := range tables {
		store.DB().Exec(
			fmt.Sprintf(`DELETE FROM %s WHERE %s <= ?`, t.table, t.col),
			now-t.ttlMillis,
		)
	}
}

// removeNoMusicSinger removes singers with no music that were created > 3 days ago.
func removeNoMusicSinger() {
	threshold := time.Now().Add(-3 * 24 * time.Hour).UnixMilli()
	rows, err := store.DB().Query(
		`SELECT id FROM singer
		WHERE id NOT IN (SELECT singerId FROM music_singer_relation)
		AND createTimestamp < ?`, threshold,
	)
	if err != nil {
		return
	}

	var ids []string
	for rows.Next() {
		var id string
		rows.Scan(&id)
		ids = append(ids, id)
	}
	rows.Close()

	if len(ids) == 0 {
		return
	}

	placeholders := store.Placeholders(len(ids))
	args := store.Strs2Any(ids)
	// Delete photos first since they reference singer; the asset files are
	// removed by removeUnlinkedAsset on the next run.
	store.DB().Exec(`DELETE FROM singer_photo WHERE singerId IN (`+placeholders+`)`, args...)
	store.DB().Exec(`DELETE FROM singer WHERE id IN (`+placeholders+`)`, args...)
}

// removeUnlinkedAsset removes asset files not referenced by the DB.
func removeUnlinkedAsset() {
	type assetQuery struct {
		assetType config.AssetType
		query     string
	}
	queries := []assetQuery{
		{config.AssetTypeUserAvatar, `SELECT DISTINCT avatar FROM user WHERE avatar != ''`},
		{config.AssetTypeMusicbillCover, `SELECT DISTINCT cover FROM musicbill WHERE cover != ''`},
		{config.AssetTypeSingerPhoto, `SELECT DISTINCT asset FROM singer_photo WHERE asset != ''`},
		{config.AssetTypeMusicCover, `SELECT DISTINCT cover FROM music WHERE cover != ''`},
		{config.AssetTypeMusic, `SELECT DISTINCT asset FROM music WHERE asset != ''`},
	}

	for _, aq := range queries {
		rows, err := store.DB().Query(aq.query)
		if err != nil {
			continue
		}
		linked := map[string]bool{}
		for rows.Next() {
			var v string
			rows.Scan(&v)
			if v != "" {
				linked[v] = true
			}
		}
		rows.Close()

		dir := config.AssetDir(aq.assetType)
		entries, err := os.ReadDir(dir)
		if err != nil {
			continue
		}

		var unlinked []string
		for _, e := range entries {
			if !e.IsDir() && !linked[e.Name()] {
				unlinked = append(unlinked, e.Name())
			}
		}
		if len(unlinked) == 0 {
			continue
		}

		for _, name := range unlinked {
			_ = os.Remove(filepath.Join(dir, name))
		}
	}
}

// removeOutdatedPlayRecord removes play records older than the user's indate setting.
func removeOutdatedPlayRecord() {
	rows, err := store.DB().Query(
		`SELECT id,musicPlayRecordIndate FROM user WHERE musicPlayRecordIndate != 0`,
	)
	if err != nil {
		return
	}
	defer rows.Close()

	type userRow struct {
		ID     string
		Indate int64 // days
	}
	var users []userRow
	for rows.Next() {
		var u userRow
		rows.Scan(&u.ID, &u.Indate)
		users = append(users, u)
	}
	rows.Close()

	now := time.Now().UnixMilli()
	for _, u := range users {
		threshold := now - u.Indate*24*60*60*1000
		store.DB().Exec(
			`DELETE FROM music_play_record WHERE userId=? AND timestamp <= ?`,
			u.ID, threshold,
		)
	}
}

// removeOutdatedSharedInvitation removes unanswered shared musicbill invitations older than 3 days.
func removeOutdatedSharedInvitation() {
	threshold := time.Now().Add(-3 * 24 * time.Hour).UnixMilli()
	store.DB().Exec(
		`DELETE FROM shared_musicbill WHERE inviteTimestamp <= ? AND accepted=0`,
		threshold,
	)
}

// cleanOutdatedFile removes files older than 30 days from logs, cache, and
// thumbnail cache.
func cleanOutdatedFile() {
	type cleanDir struct {
		path     string
		skipName string
	}

	dirs := []cleanDir{
		{path: config.LogDir()},
		{path: config.CacheDir(), skipName: filepath.Base(config.ThumbnailCacheDir())},
		{path: config.ThumbnailCacheDir()},
	}
	ttl := 30 * 24 * time.Hour
	now := time.Now()

	for _, dir := range dirs {
		entries, err := os.ReadDir(dir.path)
		if err != nil {
			continue
		}
		for _, e := range entries {
			if dir.skipName != "" && e.Name() == dir.skipName {
				continue
			}
			info, err := e.Info()
			if err != nil {
				continue
			}
			if now.Sub(info.ModTime()) >= ttl {
				os.RemoveAll(filepath.Join(dir.path, e.Name()))
			}
		}
	}
}
