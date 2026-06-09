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

	id, err := CreateArtist("Alpha")
	if err != nil {
		t.Fatalf("create artist: %v", err)
	}
	if matched := regexp.MustCompile(`^[0-9A-Za-z]{8}$`).MatchString(id); !matched {
		t.Fatalf("expected 8-character alphanumeric artist id, got %q", id)
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
		`INSERT INTO artist (id,name,aliases,createTimestamp) VALUES
			('artist-exact', 'Beta',       '', ?),
			('artist-prefix','Beta Band',  '', ?),
			('artist-newer', 'The Beta',   '', ?)`,
		now-300,
		now-200,
		now,
	); err != nil {
		t.Fatalf("insert singers: %v", err)
	}

	total, singers, err := SearchArtists("Beta", 1, 10)
	if err != nil {
		t.Fatalf("search singers: %v", err)
	}
	if total != 3 || len(singers) != 3 {
		t.Fatalf("unexpected search result: total=%d singers=%+v", total, singers)
	}
	got := []string{singers[0].ID, singers[1].ID, singers[2].ID}
	want := []string{"artist-exact", "artist-prefix", "artist-newer"}
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
		`INSERT INTO artist (id,name,aliases,searchKeywords,createTimestamp) VALUES
			('artist-hidden', 'Aurora', '', 'runaway voice token', ?),
			('artist-other',  'Beta',   '', '', ?)`,
		now,
		now,
	); err != nil {
		t.Fatalf("insert singers: %v", err)
	}

	total, singers, err := SearchArtists("runaway voice", 1, 10)
	if err != nil {
		t.Fatalf("search singers: %v", err)
	}
	if total != 1 || len(singers) != 1 || singers[0].ID != "artist-hidden" {
		t.Fatalf("expected artist-hidden by search keywords, total=%d singers=%+v", total, singers)
	}
}
