package config

import (
	"path/filepath"
	"testing"
)

func TestThumbnailCachePath(t *testing.T) {
	Set(Config{Mode: ModeProduction, Data: "/tmp/cicada-test", Port: 8000})
	t.Cleanup(func() {
		Set(Config{Mode: ModeProduction, Data: "/tmp/cicada-test", Port: 8000})
	})

	cases := []struct {
		name     string
		size     int
		filename string
		wantDir  string
		wantPath string
	}{
		{
			name:     "typical md5 filename",
			size:     200,
			filename: "abcdef0123456789.jpg",
			wantDir:  filepath.Join(ThumbnailCacheDir(), "ab"),
			wantPath: filepath.Join(ThumbnailCacheDir(), "ab", "abcdef0123456789_200.jpg"),
		},
		{
			name:     "different size same shard",
			size:     400,
			filename: "abcdef0123456789.jpg",
			wantDir:  filepath.Join(ThumbnailCacheDir(), "ab"),
			wantPath: filepath.Join(ThumbnailCacheDir(), "ab", "abcdef0123456789_400.jpg"),
		},
		{
			name:     "different hash different shard",
			size:     200,
			filename: "ff00112233445566.jpg",
			wantDir:  filepath.Join(ThumbnailCacheDir(), "ff"),
			wantPath: filepath.Join(ThumbnailCacheDir(), "ff", "ff00112233445566_200.jpg"),
		},
		{
			name:     "filename without extension",
			size:     64,
			filename: "abcdef",
			wantDir:  filepath.Join(ThumbnailCacheDir(), "ab"),
			wantPath: filepath.Join(ThumbnailCacheDir(), "ab", "abcdef_64"),
		},
		{
			name:     "short filename falls back to 00 shard",
			size:     64,
			filename: "a",
			wantDir:  filepath.Join(ThumbnailCacheDir(), "00"),
			wantPath: filepath.Join(ThumbnailCacheDir(), "00", "a_64"),
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			gotDir, gotPath := ThumbnailCachePath(tc.size, tc.filename)
			if gotDir != tc.wantDir {
				t.Errorf("dir = %q, want %q", gotDir, tc.wantDir)
			}
			if gotPath != tc.wantPath {
				t.Errorf("path = %q, want %q", gotPath, tc.wantPath)
			}
			if filepath.Dir(gotPath) != gotDir {
				t.Errorf("path %q is not inside dir %q", gotPath, gotDir)
			}
		})
	}
}
