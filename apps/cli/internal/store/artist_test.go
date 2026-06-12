package store

import (
	"cicada/internal/config"
	"regexp"
	"testing"
	"time"
)

func TestCreateArtistUsesPublicID(t *testing.T) {
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
	if matched := regexp.MustCompile(`^[0-9A-Z]{6}$`).MatchString(id); !matched {
		t.Fatalf("expected 6-character uppercase alphanumeric artist id, got %q", id)
	}
}

func TestSearchPerformersRanksExactAndPrefixMatches(t *testing.T) {
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
			('ART001', 'Beta',       '', ?),
			('ART002','Beta Band',  '', ?),
			('ART003', 'The Beta',   '', ?)`,
		now-300,
		now-200,
		now,
	); err != nil {
		t.Fatalf("insert performers: %v", err)
	}

	total, performers, err := SearchArtists("Beta", 1, 10)
	if err != nil {
		t.Fatalf("search performers: %v", err)
	}
	if total != 3 || len(performers) != 3 {
		t.Fatalf("unexpected search result: total=%d performers=%+v", total, performers)
	}
	got := []string{performers[0].ID, performers[1].ID, performers[2].ID}
	want := []string{"ART001", "ART002", "ART003"}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("unexpected order: got %v want %v", got, want)
		}
	}
}

func TestSearchPerformersMatchesSearchKeywords(t *testing.T) {
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
			('ART004', 'Aurora', '', 'runaway voice token', ?),
			('ART005',  'Beta',   '', '', ?)`,
		now,
		now,
	); err != nil {
		t.Fatalf("insert performers: %v", err)
	}

	total, performers, err := SearchArtists("runaway voice", 1, 10)
	if err != nil {
		t.Fatalf("search performers: %v", err)
	}
	if total != 1 || len(performers) != 1 || performers[0].ID != "ART004" {
		t.Fatalf("expected ART004 by search keywords, total=%d performers=%+v", total, performers)
	}
}
