package version

import (
	"testing"
	"time"
)

func TestBuildVersion(t *testing.T) {
	now := time.Date(2026, time.April, 21, 17, 8, 0, 0, time.UTC)

	t.Run("development", func(t *testing.T) {
		got := buildVersion(buildProfileDevelopment, "2.13.0", "main", now)
		want := "2.13.0-local"
		if got != want {
			t.Fatalf("got %q, want %q", got, want)
		}
	})

	t.Run("production", func(t *testing.T) {
		got := buildVersion(buildProfileProduction, "2.13.0", "main", now)
		want := "2.13.0"
		if got != want {
			t.Fatalf("got %q, want %q", got, want)
		}
	})

	t.Run("beta branch build", func(t *testing.T) {
		got := buildVersion(buildProfileProduction, "2.13.0", betaBranch, now)
		want := "2.13.0-beta-202604211708"
		if got != want {
			t.Fatalf("got %q, want %q", got, want)
		}
	})

	t.Run("explicit beta profile", func(t *testing.T) {
		got := buildVersion(buildProfileBeta, "2.13.0", "main", now)
		want := "2.13.0-beta-202604211708"
		if got != want {
			t.Fatalf("got %q, want %q", got, want)
		}
	})

	t.Run("missing tag", func(t *testing.T) {
		got := buildVersion(buildProfileProduction, "", "main", now)
		want := "unknown"
		if got != want {
			t.Fatalf("got %q, want %q", got, want)
		}
	})
}
