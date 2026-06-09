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
	musicID, err := CreateMusic("Hidden Track", MusicTypeSong, "one.mp3")
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
		`INSERT INTO artist (id,name,aliases,createTimestamp) VALUES
			('artist-1','Aurora',?, ?),
			('artist-2','Beta',  ?, ?)`,
		"Runaway Voice", now,
		"Other Alias", now,
	); err != nil {
		t.Fatalf("insert singers: %v", err)
	}
	if _, err := DB().Exec(
		`INSERT INTO music (id,type,name,aliases,cover,asset,heat,createTimestamp) VALUES
			('music-1', ?, 'Hidden Track', '', '', 'one.mp3', 10, ?),
			('music-2', ?, 'Other Track',  '', '', 'two.mp3', 20, ?)`,
		int(MusicTypeSong), now,
		int(MusicTypeSong), now,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}
	if err := LinkMusicSingers("music-1", []string{"artist-1"}); err != nil {
		t.Fatalf("link music-1 artist: %v", err)
	}
	if err := LinkMusicSingers("music-2", []string{"artist-2"}); err != nil {
		t.Fatalf("link music-2 artist: %v", err)
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

func TestSearchMusicMatchesSearchKeywords(t *testing.T) {
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
		`INSERT INTO artist (id,name,aliases,searchKeywords,createTimestamp) VALUES
			('artist-1','Aurora','', 'runaway voice token', ?),
			('artist-2','Beta',  '', '', ?)`,
		now,
		now,
	); err != nil {
		t.Fatalf("insert singers: %v", err)
	}
	if _, err := DB().Exec(
		`INSERT INTO music (id,type,name,aliases,searchKeywords,asset,heat,createTimestamp) VALUES
			('music-by-artist-keyword', ?, 'Hidden Track', '', '', 'one.mp3', 10, ?),
			('music-by-own-keyword', ?, 'Other Track', '', 'manual lookup token', 'two.mp3', 20, ?)`,
		int(MusicTypeSong), now,
		int(MusicTypeSong), now,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}
	if err := LinkMusicSingers("music-by-artist-keyword", []string{"artist-1"}); err != nil {
		t.Fatalf("link music-by-artist-keyword artist: %v", err)
	}
	if err := LinkMusicSingers("music-by-own-keyword", []string{"artist-2"}); err != nil {
		t.Fatalf("link music-by-own-keyword artist: %v", err)
	}

	tests := []struct {
		keyword string
		wantID  string
	}{
		{keyword: "manual lookup", wantID: "music-by-own-keyword"},
		{keyword: "runaway voice", wantID: "music-by-artist-keyword"},
	}
	for _, tt := range tests {
		total, musics, err := SearchMusic(tt.keyword, 1, 10)
		if err != nil {
			t.Fatalf("search by %q: %v", tt.keyword, err)
		}
		if total != 1 {
			t.Fatalf("search by %q expected total 1, got %d", tt.keyword, total)
		}
		if len(musics) != 1 || musics[0].ID != tt.wantID {
			t.Fatalf("search by %q expected %s, got %+v", tt.keyword, tt.wantID, musics)
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
		`INSERT INTO music (id,type,name,aliases,asset,heat,createTimestamp) VALUES
			('music-exact', ?, 'Love',      '', 'exact.mp3',   1,   ?),
			('music-prefix',?, 'Love Song', '', 'prefix.mp3',  100, ?),
			('music-hot',   ?, 'My Love',   '', 'hot.mp3',     999, ?),
			('music-percent', ?, '100% Love', '', 'percent.mp3', 0, ?)`,
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
		`INSERT INTO music (id,type,name,asset,createTimestamp) VALUES
			('music-a', ?, 'A', 'a.mp3', ?),
			('music-b', ?, 'B', 'b.mp3', ?),
			('music-c', ?, 'C', 'c.mp3', ?)`,
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

func TestComposerRelationsAndSearch(t *testing.T) {
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
		`INSERT INTO artist (id,name,aliases,createTimestamp) VALUES
			('artist-composer','Mozart','Wolfgang', ?),
			('artist-singer','SingerOnly','', ?)`,
		now, now,
	); err != nil {
		t.Fatalf("insert artists: %v", err)
	}
	if _, err := DB().Exec(
		`INSERT INTO music (id,type,name,aliases,cover,asset,heat,createTimestamp) VALUES
			('m-composed', ?, 'Eine Kleine', '', '', 'a.mp3', 10, ?),
			('m-other',    ?, 'Other',       '', '', 'b.mp3', 20, ?)`,
		int(MusicTypeSong), now,
		int(MusicTypeSong), now,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}
	if err := LinkMusicComposers("m-composed", []string{"artist-composer"}); err != nil {
		t.Fatalf("link composers: %v", err)
	}
	if err := LinkMusicSingers("m-other", []string{"artist-singer"}); err != nil {
		t.Fatalf("link singer: %v", err)
	}

	composers, err := GetComposersInMusicIDs([]string{"m-composed", "m-other"})
	if err != nil {
		t.Fatalf("get composers: %v", err)
	}
	if len(composers) != 1 || composers[0].MusicID != "m-composed" || composers[0].ID != "artist-composer" {
		t.Fatalf("unexpected composers: %+v", composers)
	}

	musics, err := GetMusicsByComposerID("artist-composer")
	if err != nil {
		t.Fatalf("get music by composer id: %v", err)
	}
	if len(musics) != 1 || musics[0].ID != "m-composed" {
		t.Fatalf("unexpected music by composer: %+v", musics)
	}

	// Searching by composer name should surface the composed track.
	for _, keyword := range []string{"Mozart", "Wolfgang"} {
		total, found, err := SearchMusic(keyword, 1, 10)
		if err != nil {
			t.Fatalf("search %q: %v", keyword, err)
		}
		if total != 1 || len(found) != 1 || found[0].ID != "m-composed" {
			t.Fatalf("search %q expected m-composed, got total=%d %+v", keyword, total, found)
		}
	}

	// DeleteMusicCascade should clear the composer relation.
	if err := DeleteMusicCascade("m-composed", true); err != nil {
		t.Fatalf("cascade delete: %v", err)
	}
	var n int
	if err := DB().QueryRow(`SELECT COUNT(1) FROM music_composer_relation WHERE musicId='m-composed'`).Scan(&n); err != nil {
		t.Fatalf("count after delete: %v", err)
	}
	if n != 0 {
		t.Fatalf("expected composer relation removed by cascade, found %d", n)
	}
}
