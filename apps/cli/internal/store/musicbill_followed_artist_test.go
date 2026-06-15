package store

import (
	"cicada/internal/config"
	"testing"
	"time"
)

func setupFollowedArtistTest(t *testing.T) {
	t.Helper()
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
		`INSERT INTO user (id,username,password,nickname,joinTimestamp) VALUES ('OWNER1','owner',?, 'Owner', ?)`,
		DoubleMD5("password"), now,
	); err != nil {
		t.Fatalf("insert user: %v", err)
	}
	if _, err := DB().Exec(
		`INSERT INTO musicbill (id,userId,name,createTimestamp) VALUES
			('BILL01','OWNER1','Bill One',?),
			('BILL02','OWNER1','Bill Two',?)`,
		now, now,
	); err != nil {
		t.Fatalf("insert musicbills: %v", err)
	}
	if _, err := DB().Exec(
		`INSERT INTO artist (id,name,createTimestamp) VALUES
			('ART001','Alice',?),
			('ART002','Bob',?),
			('ART003','Carol',?)`,
		now, now, now,
	); err != nil {
		t.Fatalf("insert artists: %v", err)
	}
	if _, err := DB().Exec(
		`INSERT INTO music (id,type,name,asset,createTimestamp) VALUES
			('MUS001',1,'Song A','a.mp3',?),
			('MUS002',1,'Song B','b.mp3',?),
			('MUS003',1,'Song C','c.mp3',?)`,
		now, now, now,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}
	// MUS001: performer Alice. MUS002: lyricist Bob. MUS003: composer Carol.
	if _, err := DB().Exec(
		`INSERT INTO music_artist_relation (musicId,artistId,role,position) VALUES
			('MUS001','ART001','performer',0),
			('MUS002','ART002','lyricist',0),
			('MUS003','ART003','composer',0)`,
	); err != nil {
		t.Fatalf("insert music_artist_relation: %v", err)
	}
}

func TestAddAndRemoveMusicbillFollowedArtist(t *testing.T) {
	setupFollowedArtistTest(t)

	added, err := AddMusicbillFollowedArtist("BILL01", "ART001")
	if err != nil || !added {
		t.Fatalf("first follow expected to succeed: added=%v err=%v", added, err)
	}
	added, err = AddMusicbillFollowedArtist("BILL01", "ART001")
	if err != nil {
		t.Fatalf("repeated follow err: %v", err)
	}
	if added {
		t.Fatalf("repeated follow should not insert")
	}

	yes, err := IsMusicbillFollowingArtist("BILL01", "ART001")
	if err != nil || !yes {
		t.Fatalf("expected following: yes=%v err=%v", yes, err)
	}

	removed, err := RemoveMusicbillFollowedArtist("BILL01", "ART001")
	if err != nil || !removed {
		t.Fatalf("unfollow expected: removed=%v err=%v", removed, err)
	}
	removed, err = RemoveMusicbillFollowedArtist("BILL01", "ART001")
	if err != nil {
		t.Fatalf("repeat unfollow err: %v", err)
	}
	if removed {
		t.Fatalf("repeat unfollow should report not removed")
	}
}

func TestGetFollowedArtistsByMusicbill(t *testing.T) {
	setupFollowedArtistTest(t)
	AddMusicbillFollowedArtist("BILL01", "ART001")
	time.Sleep(2 * time.Millisecond)
	AddMusicbillFollowedArtist("BILL01", "ART002")
	AddMusicbillFollowedArtist("BILL02", "ART003")

	list, err := GetFollowedArtistsByMusicbill("BILL01")
	if err != nil {
		t.Fatalf("get followed: %v", err)
	}
	if len(list) != 2 {
		t.Fatalf("expected 2, got %d: %+v", len(list), list)
	}
	// ordered by createTimestamp DESC -> ART002 first
	if list[0].ID != "ART002" || list[1].ID != "ART001" {
		t.Fatalf("unexpected order: %+v", list)
	}
}

func TestBackfillMusicbillWithArtistAnyRole(t *testing.T) {
	setupFollowedArtistTest(t)
	// follow Alice (performer of MUS001)
	n, err := BackfillMusicbillWithArtist("BILL01", "ART001")
	if err != nil {
		t.Fatalf("backfill: %v", err)
	}
	if n != 1 {
		t.Fatalf("expected 1 row, got %d", n)
	}
	exists, _ := MusicExistsInMusicbill("BILL01", "MUS001")
	if !exists {
		t.Fatalf("MUS001 should be in bill")
	}
	// follow Bob (lyricist of MUS002) — verify any-role match
	n, _ = BackfillMusicbillWithArtist("BILL01", "ART002")
	if n != 1 {
		t.Fatalf("expected 1 backfill for lyricist, got %d", n)
	}
	exists, _ = MusicExistsInMusicbill("BILL01", "MUS002")
	if !exists {
		t.Fatalf("MUS002 should be added via lyricist role")
	}
	// backfilling again should not duplicate
	n, _ = BackfillMusicbillWithArtist("BILL01", "ART001")
	if n != 0 {
		t.Fatalf("expected 0 on repeat backfill, got %d", n)
	}
}

func TestAutoAddMusicToFollowingMusicbills(t *testing.T) {
	setupFollowedArtistTest(t)
	// BILL01 follows Alice, BILL02 follows Bob
	AddMusicbillFollowedArtist("BILL01", "ART001")
	AddMusicbillFollowedArtist("BILL02", "ART002")

	// Insert a new music with both Alice (performer) and Bob (composer)
	now := time.Now().UnixMilli()
	DB().Exec(`INSERT INTO music (id,type,name,asset,createTimestamp) VALUES ('MUS999',1,'Duet','d.mp3',?)`, now)
	DB().Exec(`INSERT INTO music_artist_relation (musicId,artistId,role,position) VALUES
		('MUS999','ART001','performer',0),
		('MUS999','ART002','composer',0)`)

	n, err := AutoAddMusicToFollowingMusicbills("MUS999", []string{"ART001", "ART002"})
	if err != nil {
		t.Fatalf("auto add: %v", err)
	}
	if n != 2 {
		t.Fatalf("expected 2 inserts, got %d", n)
	}
	in1, _ := MusicExistsInMusicbill("BILL01", "MUS999")
	in2, _ := MusicExistsInMusicbill("BILL02", "MUS999")
	if !in1 || !in2 {
		t.Fatalf("expected both bills to contain MUS999, got bill01=%v bill02=%v", in1, in2)
	}
	// Repeat should be no-op (already there)
	n, _ = AutoAddMusicToFollowingMusicbills("MUS999", []string{"ART001", "ART002"})
	if n != 0 {
		t.Fatalf("expected 0 on repeat, got %d", n)
	}
}

func TestDeleteMusicbillCascadesFollowedArtist(t *testing.T) {
	setupFollowedArtistTest(t)
	AddMusicbillFollowedArtist("BILL01", "ART001")
	if err := DeleteMusicbill("BILL01"); err != nil {
		t.Fatalf("delete musicbill: %v", err)
	}
	var n int
	DB().QueryRow(`SELECT COUNT(1) FROM musicbill_followed_artist WHERE musicbillId=?`, "BILL01").Scan(&n)
	if n != 0 {
		t.Fatalf("expected 0 rows after cascade, got %d", n)
	}
}

func TestDeleteArtistCascadesFollowedArtist(t *testing.T) {
	setupFollowedArtistTest(t)
	AddMusicbillFollowedArtist("BILL01", "ART001")
	// Detach ART001 from MUS001 first so DeleteArtistCascade is allowed; we just want the cascade check
	DB().Exec(`DELETE FROM music_artist_relation WHERE artistId='ART001'`)
	if err := DeleteArtistCascade("ART001"); err != nil {
		t.Fatalf("delete artist: %v", err)
	}
	var n int
	DB().QueryRow(`SELECT COUNT(1) FROM musicbill_followed_artist WHERE artistId=?`, "ART001").Scan(&n)
	if n != 0 {
		t.Fatalf("expected 0 rows after cascade, got %d", n)
	}
}
