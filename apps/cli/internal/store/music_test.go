package store

import (
	"cicada/internal/config"
	"regexp"
	"testing"
	"time"
)

func TestCreateMusicAndMusicbillUsePublicIDs(t *testing.T) {
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

	const userID = "USER01"
	if _, err := DB().Exec(
		`INSERT INTO user (id,username,password,nickname,joinTimestamp) VALUES (?,?,?,?,?)`,
		userID, "creator", DoubleMD5("password"), "Creator", time.Now().UnixMilli(),
	); err != nil {
		t.Fatalf("insert user: %v", err)
	}

	pattern := regexp.MustCompile(`^[0-9A-Z]{6}$`)
	musicID, err := CreateMusic("Hidden Track", MusicTypeSong, "one.mp3")
	if err != nil {
		t.Fatalf("create music: %v", err)
	}
	if !pattern.MatchString(musicID) {
		t.Fatalf("expected 6-character uppercase alphanumeric music id, got %q", musicID)
	}

	musicbillID, err := CreateMusicbill(userID, "Favorites")
	if err != nil {
		t.Fatalf("create musicbill: %v", err)
	}
	if !pattern.MatchString(musicbillID) {
		t.Fatalf("expected 6-character uppercase alphanumeric musicbill id, got %q", musicbillID)
	}
}

func TestSearchMusicMatchesPerformerNameAndAliases(t *testing.T) {
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
			('ART001','Aurora',?, ?),
			('ART002','Beta',  ?, ?)`,
		"Runaway Voice", now,
		"Other Alias", now,
	); err != nil {
		t.Fatalf("insert performers: %v", err)
	}
	if _, err := DB().Exec(
		`INSERT INTO music (id,type,name,aliases,cover,asset,heat,createTimestamp) VALUES
			('MUS001', ?, 'Hidden Track', '', '', 'one.mp3', 10, ?),
			('MUS002', ?, 'Other Track',  '', '', 'two.mp3', 20, ?)`,
		int(MusicTypeSong), now,
		int(MusicTypeSong), now,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}
	if err := ReplaceMusicArtistsByRole("MUS001", MusicArtistRolePerformer, []string{"ART001"}); err != nil {
		t.Fatalf("link MUS001 artist: %v", err)
	}
	if err := ReplaceMusicArtistsByRole("MUS002", MusicArtistRolePerformer, []string{"ART002"}); err != nil {
		t.Fatalf("link MUS002 artist: %v", err)
	}

	for _, keyword := range []string{"Aurora", "Runaway"} {
		total, musics, err := SearchMusic(keyword, 1, 10)
		if err != nil {
			t.Fatalf("search by %q: %v", keyword, err)
		}
		if total != 1 {
			t.Fatalf("search by %q expected total 1, got %d", keyword, total)
		}
		if len(musics) != 1 || musics[0].ID != "MUS001" {
			t.Fatalf("search by %q expected MUS001, got %+v", keyword, musics)
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
			('ART001','Aurora','', 'runaway voice token', ?),
			('ART002','Beta',  '', '', ?)`,
		now,
		now,
	); err != nil {
		t.Fatalf("insert performers: %v", err)
	}
	if _, err := DB().Exec(
		`INSERT INTO music (id,type,name,aliases,searchKeywords,asset,heat,createTimestamp) VALUES
			('MUS101', ?, 'Hidden Track', '', '', 'one.mp3', 10, ?),
			('MUS102', ?, 'Other Track', '', 'manual lookup token', 'two.mp3', 20, ?)`,
		int(MusicTypeSong), now,
		int(MusicTypeSong), now,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}
	if err := ReplaceMusicArtistsByRole("MUS101", MusicArtistRolePerformer, []string{"ART001"}); err != nil {
		t.Fatalf("link MUS101 artist: %v", err)
	}
	if err := ReplaceMusicArtistsByRole("MUS102", MusicArtistRolePerformer, []string{"ART002"}); err != nil {
		t.Fatalf("link MUS102 artist: %v", err)
	}

	tests := []struct {
		keyword string
		wantID  string
	}{
		{keyword: "manual lookup", wantID: "MUS102"},
		{keyword: "runaway voice", wantID: "MUS101"},
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
			('MUS201', ?, 'Love',      '', 'exact.mp3',   1,   ?),
			('MUS202',?, 'Love Song', '', 'prefix.mp3',  100, ?),
			('MUS203',   ?, 'My Love',   '', 'hot.mp3',     999, ?),
			('MUS204', ?, '100% Love', '', 'percent.mp3', 0, ?)`,
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
	wantOrder := []string{"MUS201", "MUS202", "MUS203"}
	for i := range wantOrder {
		if gotOrder[i] != wantOrder[i] {
			t.Fatalf("unexpected ranked order: got %v want prefix %v", gotOrder, wantOrder)
		}
	}

	total, musics, err = SearchMusic("%", 1, 10)
	if err != nil {
		t.Fatalf("search literal wildcard: %v", err)
	}
	if total != 1 || len(musics) != 1 || musics[0].ID != "MUS204" {
		t.Fatalf("expected literal %% match only MUS204, total=%d musics=%+v", total, musics)
	}
}

func TestSearchMusicOrdersSameRankByHeatThenCreateTimestamp(t *testing.T) {
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
			('MUS211', ?, 'Love Alpha',   '', 'alpha.mp3',   10, ?),
			('MUS212', ?, 'Love Beta',    '', 'beta.mp3',    10, ?),
			('MUS213', ?, 'Love Charlie', '', 'charlie.mp3', 5,  ?),
			('MUS214', ?, 'Love Delta',   '', 'delta.mp3',   5,  ?)`,
		int(MusicTypeSong), now-400,
		int(MusicTypeSong), now-300,
		int(MusicTypeSong), now-100,
		int(MusicTypeSong), now-200,
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

	got := []string{musics[0].ID, musics[1].ID, musics[2].ID, musics[3].ID}
	want := []string{"MUS212", "MUS211", "MUS213", "MUS214"}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("unexpected order: got %v want %v", got, want)
		}
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
			('MUS301', ?, 'A', 'a.mp3', ?),
			('MUS302', ?, 'B', 'b.mp3', ?),
			('MUS303', ?, 'C', 'c.mp3', ?)`,
		int(MusicTypeSong), now,
		int(MusicTypeSong), now,
		int(MusicTypeSong), now,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}

	musics, err := GetMusicsByIDs([]string{"MUS303", "MUS301", "MUS302"})
	if err != nil {
		t.Fatalf("get musics by ids: %v", err)
	}
	got := []string{musics[0].ID, musics[1].ID, musics[2].ID}
	want := []string{"MUS303", "MUS301", "MUS302"}
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
			('ART401','Mozart','Wolfgang', ?),
			('ART402','PerformerOnly','', ?)`,
		now, now,
	); err != nil {
		t.Fatalf("insert artists: %v", err)
	}
	if _, err := DB().Exec(
		`INSERT INTO music (id,type,name,aliases,cover,asset,heat,createTimestamp) VALUES
			('MUS401', ?, 'Eine Kleine', '', '', 'a.mp3', 10, ?),
			('MUS402',    ?, 'Other',       '', '', 'b.mp3', 20, ?)`,
		int(MusicTypeSong), now,
		int(MusicTypeSong), now,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}
	if err := ReplaceMusicArtistsByRole("MUS401", MusicArtistRoleComposer, []string{"ART401"}); err != nil {
		t.Fatalf("link composers: %v", err)
	}
	if err := ReplaceMusicArtistsByRole("MUS402", MusicArtistRolePerformer, []string{"ART402"}); err != nil {
		t.Fatalf("link performer: %v", err)
	}

	composers, err := GetArtistsInMusicIDsByRole([]string{"MUS401", "MUS402"}, MusicArtistRoleComposer)
	if err != nil {
		t.Fatalf("get composers: %v", err)
	}
	if len(composers) != 1 || composers[0].MusicID != "MUS401" || composers[0].ID != "ART401" {
		t.Fatalf("unexpected composers: %+v", composers)
	}

	musics, err := GetMusicsByArtistIDAndRole("ART401", MusicArtistRoleComposer)
	if err != nil {
		t.Fatalf("get music by composer id: %v", err)
	}
	if len(musics) != 1 || musics[0].ID != "MUS401" {
		t.Fatalf("unexpected music by composer: %+v", musics)
	}

	// Searching by composer name should surface the composed track.
	for _, keyword := range []string{"Mozart", "Wolfgang"} {
		total, found, err := SearchMusic(keyword, 1, 10)
		if err != nil {
			t.Fatalf("search %q: %v", keyword, err)
		}
		if total != 1 || len(found) != 1 || found[0].ID != "MUS401" {
			t.Fatalf("search %q expected MUS401, got total=%d %+v", keyword, total, found)
		}
	}

	// DeleteMusicCascade should clear the composer relation.
	if err := DeleteMusicCascade("MUS401", true); err != nil {
		t.Fatalf("cascade delete: %v", err)
	}
	var n int
	if err := DB().QueryRow(`SELECT COUNT(1) FROM music_artist_relation WHERE musicId='MUS401' AND role='composer'`).Scan(&n); err != nil {
		t.Fatalf("count after delete: %v", err)
	}
	if n != 0 {
		t.Fatalf("expected composer relation removed by cascade, found %d", n)
	}
}
