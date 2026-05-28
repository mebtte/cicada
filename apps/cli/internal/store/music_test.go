package store

import (
	"cicada/internal/config"
	"regexp"
	"testing"
	"time"
)

func TestCreateMusicAndMusicbillUseShortPublicIDs(t *testing.T) {
	if err := ResetForTests(); err != nil {
		t.Fatalf("reset store: %v", err)
	}
	t.Cleanup(func() {
		if err := ResetForTests(); err != nil {
			t.Fatalf("cleanup store: %v", err)
		}
	})

	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
	})
	if err := Initialize(); err != nil {
		t.Fatalf("initialize store: %v", err)
	}

	const userID = "user-1"
	if _, err := DB().Exec(
		`INSERT INTO user (id,username,password,nickname,joinTimestamp) VALUES (?,?,?,?,?)`,
		userID, "creator", DoubleMD5("password"), "Creator", time.Now().UnixMilli(),
	); err != nil {
		t.Fatalf("insert user: %v", err)
	}

	pattern := regexp.MustCompile(`^[0-9A-Za-z]{8}$`)
	musicID, err := CreateMusic("Hidden Track", MusicTypeSong, userID, "one.mp3")
	if err != nil {
		t.Fatalf("create music: %v", err)
	}
	if !pattern.MatchString(musicID) {
		t.Fatalf("expected 8-character alphanumeric music id, got %q", musicID)
	}

	musicbillID, err := CreateMusicbill(userID, "Favorites")
	if err != nil {
		t.Fatalf("create musicbill: %v", err)
	}
	if !pattern.MatchString(musicbillID) {
		t.Fatalf("expected 8-character alphanumeric musicbill id, got %q", musicbillID)
	}
}

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
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
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

func TestSearchMusicRanksNameMatchesAndEscapesWildcards(t *testing.T) {
	if err := ResetForTests(); err != nil {
		t.Fatalf("reset store: %v", err)
	}
	t.Cleanup(func() {
		if err := ResetForTests(); err != nil {
			t.Fatalf("cleanup store: %v", err)
		}
	})

	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
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
		`INSERT INTO music (id,type,name,aliases,asset,heat,createUserId,createTimestamp) VALUES
			('music-exact', ?, 'Love',      '', 'exact.mp3',   1,   'user-1', ?),
			('music-prefix',?, 'Love Song', '', 'prefix.mp3',  100, 'user-1', ?),
			('music-hot',   ?, 'My Love',   '', 'hot.mp3',     999, 'user-1', ?),
			('music-percent', ?, '100% Love', '', 'percent.mp3', 0, 'user-1', ?)`,
		int(MusicTypeSong), now-300,
		int(MusicTypeSong), now-200,
		int(MusicTypeSong), now-100,
		int(MusicTypeSong), now,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}

	total, musics, err := SearchMusic("Love", 1, 10)
	if err != nil {
		t.Fatalf("search music: %v", err)
	}
	if total != 4 || len(musics) != 4 {
		t.Fatalf("unexpected search result: total=%d musics=%+v", total, musics)
	}
	gotOrder := []string{musics[0].ID, musics[1].ID, musics[2].ID}
	wantOrder := []string{"music-exact", "music-prefix", "music-hot"}
	for i := range wantOrder {
		if gotOrder[i] != wantOrder[i] {
			t.Fatalf("unexpected ranked order: got %v want prefix %v", gotOrder, wantOrder)
		}
	}

	total, musics, err = SearchMusic("%", 1, 10)
	if err != nil {
		t.Fatalf("search literal wildcard: %v", err)
	}
	if total != 1 || len(musics) != 1 || musics[0].ID != "music-percent" {
		t.Fatalf("expected literal %% match only music-percent, total=%d musics=%+v", total, musics)
	}
}

func TestGetMusicsByIDsPreservesInputOrder(t *testing.T) {
	if err := ResetForTests(); err != nil {
		t.Fatalf("reset store: %v", err)
	}
	t.Cleanup(func() {
		if err := ResetForTests(); err != nil {
			t.Fatalf("cleanup store: %v", err)
		}
	})

	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
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
		`INSERT INTO music (id,type,name,asset,createUserId,createTimestamp) VALUES
			('music-a', ?, 'A', 'a.mp3', 'user-1', ?),
			('music-b', ?, 'B', 'b.mp3', 'user-1', ?),
			('music-c', ?, 'C', 'c.mp3', 'user-1', ?)`,
		int(MusicTypeSong), now,
		int(MusicTypeSong), now,
		int(MusicTypeSong), now,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}

	musics, err := GetMusicsByIDs([]string{"music-c", "music-a", "music-b"})
	if err != nil {
		t.Fatalf("get musics by ids: %v", err)
	}
	got := []string{musics[0].ID, musics[1].ID, musics[2].ID}
	want := []string{"music-c", "music-a", "music-b"}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("unexpected order: got %v want %v", got, want)
		}
	}
}
