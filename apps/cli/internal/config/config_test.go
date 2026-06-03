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

func TestMusicTranscodeCachePath(t *testing.T) {
	Set(Config{Mode: ModeProduction, Data: "/tmp/cicada-test", Port: 8000})
	t.Cleanup(func() {
		Set(Config{Mode: ModeProduction, Data: "/tmp/cicada-test", Port: 8000})
	})

	cases := []struct {
		name      string
		asset     string
		cacheName string
		wantDir   string
		wantPath  string
	}{
		{
			name:      "smooth audio shard from asset prefix",
			asset:     "abcdef0123456789.flac",
			cacheName: "abcdef0123456789.flac__quality-smooth_v1.m4a",
			wantDir:   filepath.Join(MusicTranscodeCacheDir(), "ab"),
			wantPath:  filepath.Join(MusicTranscodeCacheDir(), "ab", "abcdef0123456789.flac__quality-smooth_v1.m4a"),
		},
		{
			name:      "source audio and sidecar share shard",
			asset:     "abcdef0123456789.flac",
			cacheName: "abcdef0123456789.flac__quality-source_v1.audio.json",
			wantDir:   filepath.Join(MusicTranscodeCacheDir(), "ab"),
			wantPath:  filepath.Join(MusicTranscodeCacheDir(), "ab", "abcdef0123456789.flac__quality-source_v1.audio.json"),
		},
		{
			name:      "different asset different shard",
			asset:     "ff00112233445566.mp3",
			cacheName: "ff00112233445566.mp3__quality-smooth_v1.m4a",
			wantDir:   filepath.Join(MusicTranscodeCacheDir(), "ff"),
			wantPath:  filepath.Join(MusicTranscodeCacheDir(), "ff", "ff00112233445566.mp3__quality-smooth_v1.m4a"),
		},
		{
			name:      "short asset falls back to 00 shard",
			asset:     "a",
			cacheName: "a__quality-smooth_v1.m4a",
			wantDir:   filepath.Join(MusicTranscodeCacheDir(), "00"),
			wantPath:  filepath.Join(MusicTranscodeCacheDir(), "00", "a__quality-smooth_v1.m4a"),
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			gotDir, gotPath := MusicTranscodeCachePath(tc.asset, tc.cacheName)
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

func TestAssetPath(t *testing.T) {
	Set(Config{Mode: ModeProduction, Data: "/tmp/cicada-test", Port: 8000})
	t.Cleanup(func() {
		Set(Config{Mode: ModeProduction, Data: "/tmp/cicada-test", Port: 8000})
	})

	cases := []struct {
		name     string
		t        AssetType
		filename string
		wantDir  string
		wantPath string
	}{
		{
			name:     "music typical md5 filename",
			t:        AssetTypeMusic,
			filename: "abcdef0123456789abcdef0123456789.mp3",
			wantDir:  filepath.Join(AssetDir(AssetTypeMusic), "ab"),
			wantPath: filepath.Join(AssetDir(AssetTypeMusic), "ab", "abcdef0123456789abcdef0123456789.mp3"),
		},
		{
			name:     "music cover lands in own type root",
			t:        AssetTypeMusicCover,
			filename: "ff00112233445566ff00112233445566.jpg",
			wantDir:  filepath.Join(AssetDir(AssetTypeMusicCover), "ff"),
			wantPath: filepath.Join(AssetDir(AssetTypeMusicCover), "ff", "ff00112233445566ff00112233445566.jpg"),
		},
		{
			name:     "user avatar separate from music cover",
			t:        AssetTypeUserAvatar,
			filename: "abcdef0123456789abcdef0123456789.jpg",
			wantDir:  filepath.Join(AssetDir(AssetTypeUserAvatar), "ab"),
			wantPath: filepath.Join(AssetDir(AssetTypeUserAvatar), "ab", "abcdef0123456789abcdef0123456789.jpg"),
		},
		{
			name:     "short filename falls back to 00 shard",
			t:        AssetTypeMusic,
			filename: "a",
			wantDir:  filepath.Join(AssetDir(AssetTypeMusic), "00"),
			wantPath: filepath.Join(AssetDir(AssetTypeMusic), "00", "a"),
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			gotDir, gotPath := AssetPath(tc.t, tc.filename)
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
