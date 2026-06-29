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

func TestBaseVersion(t *testing.T) {
	tests := map[string]string{
		"2.13.0":                 "2.13.0",
		"2.13.0-local":           "2.13.0",
		"2.13.0-beta.2606181430": "2.13.0",
	}

	for input, want := range tests {
		if got := BaseVersion(input); got != want {
			t.Fatalf("BaseVersion(%q) = %q, want %q", input, got, want)
		}
	}
}
