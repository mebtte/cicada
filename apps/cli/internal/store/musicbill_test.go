package store

import (
	"cicada/internal/config"
	"testing"
	"time"
)

func TestSearchPublicMusicbillsRanksNameAndMatchesOwner(t *testing.T) {
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
		`INSERT INTO user (id,username,password,nickname,joinTimestamp) VALUES
			('user-owner','owner',?, 'Road Curator', ?),
			('user-listener','listener',?, 'Listener', ?)`,
		DoubleMD5("password"), now,
		DoubleMD5("password"), now,
	); err != nil {
		t.Fatalf("insert users: %v", err)
	}
	if _, err := DB().Exec(
		`INSERT INTO musicbill (id,userId,name,public,createTimestamp) VALUES
			('musicbill-name','user-listener','Road Trip',1,?),
			('musicbill-owner','user-owner','Chill Set',1,?),
			('musicbill-private','user-listener','Road Private',0,?)`,
		now-100,
		now,
		now+100,
	); err != nil {
		t.Fatalf("insert musicbills: %v", err)
	}

	total, musicbills, err := SearchPublicMusicbills("Road", 1, 10)
	if err != nil {
		t.Fatalf("search public musicbills: %v", err)
	}
	if total != 2 || len(musicbills) != 2 {
		t.Fatalf("unexpected search result: total=%d musicbills=%+v", total, musicbills)
	}
	got := []string{musicbills[0].ID, musicbills[1].ID}
	want := []string{"musicbill-name", "musicbill-owner"}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("unexpected order: got %v want %v", got, want)
		}
	}
}
