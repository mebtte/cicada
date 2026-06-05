package store

import (
	"cicada/internal/config"
	"regexp"
	"testing"
	"time"
)

func TestCreateSingerUsesShortAlphanumericID(t *testing.T) {
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

	id, err := CreateSinger("Alpha", userID)
	if err != nil {
		t.Fatalf("create singer: %v", err)
	}
	if matched := regexp.MustCompile(`^[0-9A-Za-z]{8}$`).MatchString(id); !matched {
		t.Fatalf("expected 8-character alphanumeric singer id, got %q", id)
	}
}

func TestSearchSingersRanksExactAndPrefixMatches(t *testing.T) {
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
			('singer-exact', 'Beta',       '', 'user-1', ?),
			('singer-prefix','Beta Band',  '', 'user-1', ?),
			('singer-newer', 'The Beta',   '', 'user-1', ?)`,
		now-300,
		now-200,
		now,
	); err != nil {
		t.Fatalf("insert singers: %v", err)
	}

	total, singers, err := SearchSingers("Beta", 1, 10)
	if err != nil {
		t.Fatalf("search singers: %v", err)
	}
	if total != 3 || len(singers) != 3 {
		t.Fatalf("unexpected search result: total=%d singers=%+v", total, singers)
	}
	got := []string{singers[0].ID, singers[1].ID, singers[2].ID}
	want := []string{"singer-exact", "singer-prefix", "singer-newer"}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("unexpected order: got %v want %v", got, want)
		}
	}
}

func TestSearchSingersMatchesSearchKeywords(t *testing.T) {
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
		`INSERT INTO singer (id,name,aliases,searchKeywords,createUserId,createTimestamp) VALUES
			('singer-hidden', 'Aurora', '', 'runaway voice token', 'user-1', ?),
			('singer-other',  'Beta',   '', '', 'user-1', ?)`,
		now,
		now,
	); err != nil {
		t.Fatalf("insert singers: %v", err)
	}

	total, singers, err := SearchSingers("runaway voice", 1, 10)
	if err != nil {
		t.Fatalf("search singers: %v", err)
	}
	if total != 1 || len(singers) != 1 || singers[0].ID != "singer-hidden" {
		t.Fatalf("expected singer-hidden by search keywords, total=%d singers=%+v", total, singers)
	}
}
