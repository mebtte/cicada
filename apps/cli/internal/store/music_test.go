package store

import (
	"cicada/internal/config"
	"testing"
	"time"
)

func TestSearchMusicMatchesSingerNameAndAliases(t *testing.T) {
	if err := ResetForTests(); err != nil {
		t.Fatalf("reset store: %v", err)
	}
	t.Cleanup(func() {
		if err := ResetForTests(); err != nil {
			t.Fatalf("cleanup store: %v", err)
		}
	})

	config.Set(config.Config{
		Mode:      config.ModeProduction,
		Data:      t.TempDir(),
		Port:      8000,
		JWTExpiry: int64(180 * 24 * 60 * 60 * 1000),
	})
	if err := Initialize(); err != nil {
		t.Fatalf("initialize store: %v", err)
	}

	now := time.Now().UnixMilli()
	if _, err := DB().Exec(
		`INSERT INTO user (id,username,password,nickname,joinTimestamp) VALUES (?,?,?,?,?)`,
		"user-1", "creator", DoubleMD5("password"), "Creator", now,
	); err != nil {
		t.Fatalf("insert user: %v", err)
	}
	if _, err := DB().Exec(
		`INSERT INTO singer (id,name,aliases,createUserId,createTimestamp) VALUES
			('singer-1','Aurora',?, 'user-1', ?),
			('singer-2','Beta',  ?, 'user-1', ?)`,
		"Runaway Voice", now,
		"Other Alias", now,
	); err != nil {
		t.Fatalf("insert singers: %v", err)
	}
	if _, err := DB().Exec(
		`INSERT INTO music (id,type,name,aliases,cover,asset,heat,createUserId,createTimestamp) VALUES
			('music-1', ?, 'Hidden Track', '', '', 'one.mp3', 10, 'user-1', ?),
			('music-2', ?, 'Other Track',  '', '', 'two.mp3', 20, 'user-1', ?)`,
		int(MusicTypeSong), now,
		int(MusicTypeSong), now,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}
	if err := LinkMusicSingers("music-1", []string{"singer-1"}); err != nil {
		t.Fatalf("link music-1 singer: %v", err)
	}
	if err := LinkMusicSingers("music-2", []string{"singer-2"}); err != nil {
		t.Fatalf("link music-2 singer: %v", err)
	}

	for _, keyword := range []string{"Aurora", "Runaway"} {
		total, musics, err := SearchMusic(keyword, 1, 10)
		if err != nil {
			t.Fatalf("search by %q: %v", keyword, err)
		}
		if total != 1 {
			t.Fatalf("search by %q expected total 1, got %d", keyword, total)
		}
		if len(musics) != 1 || musics[0].ID != "music-1" {
			t.Fatalf("search by %q expected music-1, got %+v", keyword, musics)
		}
	}
}
