package version

import (
	"testing"
)

func TestBuildVersion(t *testing.T) {
	t.Run("development", func(t *testing.T) {
		got := buildVersion(buildProfileDevelopment, "2.13.0")
		want := "2.13.0-local"
		if got != want {
			t.Fatalf("got %q, want %q", got, want)
		}
	})

	t.Run("production", func(t *testing.T) {
		got := buildVersion(buildProfileProduction, "2.13.0")
		want := "2.13.0"
		if got != want {
			t.Fatalf("got %q, want %q", got, want)
		}
	})

	t.Run("missing tag", func(t *testing.T) {
		got := buildVersion(buildProfileProduction, "")
		want := "unknown"
		if got != want {
			t.Fatalf("got %q, want %q", got, want)
		}
	})
}
