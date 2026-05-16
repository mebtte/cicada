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
