package config

import "testing"

func TestParseBasePath(t *testing.T) {
	for _, tc := range []struct {
		input string
		want  string
	}{
		{"", ""}, {"/", ""}, {"/cicada", "/cicada"}, {"/cicada/", "/cicada"},
		{"/apps/cicada/", "/apps/cicada"}, {"/Music_2/v3.1~beta-1", "/Music_2/v3.1~beta-1"},
	} {
		t.Run(tc.input, func(t *testing.T) {
			got, err := ParseBasePath(tc.input)
			if err != nil || got != tc.want {
				t.Fatalf("ParseBasePath(%q) = %q, %v; want %q", tc.input, got, err, tc.want)
			}
		})
	}
	for _, input := range []string{
		"cicada", "https://example.com/cicada", "//", "//cicada", "/cicada//", "/a//b",
		"/.", "/..", "/a/../b", "/a/./b", "/a?x=1", "/a#b", "/a%2fb", "/a%20b",
		"/a\\b", "/a:b", "/a*b", "/a b", " /a", "/a\n", "/音乐",
	} {
		t.Run(input, func(t *testing.T) {
			if got, err := ParseBasePath(input); err == nil {
				t.Fatalf("ParseBasePath(%q) = %q; want error", input, got)
			}
		})
	}
}

func TestAssetPublicURLIsRelativeToServiceRoot(t *testing.T) {
	previous := Get()
	t.Cleanup(func() { Set(previous) })
	Set(Config{BasePath: "/apps/music"})
	if got := AssetPublicURL("track.mp3", AssetTypeMusic); got != "/asset/music/track.mp3" {
		t.Fatalf("asset path = %q; clients must append it to their server base URL", got)
	}
}
