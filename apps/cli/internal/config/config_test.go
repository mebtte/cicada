package config

import (
	"path/filepath"
	"testing"
)

func TestConfigSetDefaultsFileMaxSizes(t *testing.T) {
	Set(Config{Mode: ModeProduction, Data: "/tmp/cicada-test", Port: 8000})
	t.Cleanup(func() {
		Set(Config{Mode: ModeProduction, Data: "/tmp/cicada-test", Port: 8000})
	})

	cfg := Get()
	if cfg.ImageFileMaxSize != DefaultImageFileMaxSize {
		t.Fatalf("image max size = %d, want %d", cfg.ImageFileMaxSize, DefaultImageFileMaxSize)
	}
	if cfg.AudioFileMaxSize != DefaultAudioFileMaxSize {
		t.Fatalf("audio max size = %d, want %d", cfg.AudioFileMaxSize, DefaultAudioFileMaxSize)
	}
	if cfg.VideoFileMaxSize != DefaultVideoFileMaxSize {
		t.Fatalf("video max size = %d, want %d", cfg.VideoFileMaxSize, DefaultVideoFileMaxSize)
	}
}

func TestAssetMaxSizeUsesFileCategory(t *testing.T) {
	Set(Config{
		Mode:             ModeProduction,
		Data:             "/tmp/cicada-test",
		Port:             8000,
		ImageFileMaxSize: 20,
		AudioFileMaxSize: 300,
		VideoFileMaxSize: 900,
	})
	t.Cleanup(func() {
		Set(Config{Mode: ModeProduction, Data: "/tmp/cicada-test", Port: 8000})
	})

	cases := []struct {
		name string
		t    AssetType
		mime string
		want int64
	}{
		{name: "music audio mp3", t: AssetTypeMusic, mime: "audio/mpeg", want: 300},
		{name: "music audio flac", t: AssetTypeMusic, mime: "audio/flac", want: 300},
		{name: "music video mp4", t: AssetTypeMusic, mime: "video/mp4", want: 900},
		{name: "music no mime falls back to max", t: AssetTypeMusic, mime: "", want: 900},
		{name: "user avatar", t: AssetTypeUserAvatar, mime: "image/jpeg", want: 20},
		{name: "musicbill cover", t: AssetTypeMusicbillCover, mime: "image/jpeg", want: 20},
		{name: "artist photo", t: AssetTypeArtistPhoto, mime: "image/jpeg", want: 20},
		{name: "music cover", t: AssetTypeMusicCover, mime: "image/jpeg", want: 20},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, ok := AssetMaxSize(tc.t, tc.mime)
			if !ok {
				t.Fatalf("expected max size for %s", tc.t)
			}
			if got != tc.want {
				t.Fatalf("max size = %d, want %d", got, tc.want)
			}
		})
	}

	if _, ok := AssetMaxSize(AssetType("unknown"), ""); ok {
		t.Fatalf("expected unknown asset type to be rejected")
	}
	if _, ok := AssetMaxSize(AssetTypeMusic, "application/octet-stream"); ok {
		t.Fatalf("expected unknown mime on music to be rejected")
	}
}

func TestParseFileSize(t *testing.T) {
	cases := []struct {
		input string
		want  int64
	}{
		{input: "1", want: 1},
		{input: "512b", want: 512},
		{input: "2kb", want: 2 * 1024},
		{input: "1.5mb", want: 1536 * 1024},
		{input: "3GB", want: 3 * 1024 * 1024 * 1024},
		{input: " 5 mb ", want: 5 * 1024 * 1024},
	}

	for _, tc := range cases {
		t.Run(tc.input, func(t *testing.T) {
			got, err := ParseFileSize(tc.input)
			if err != nil {
				t.Fatalf("parse: %v", err)
			}
			if got != tc.want {
				t.Fatalf("size = %d, want %d", got, tc.want)
			}
		})
	}

	for _, input := range []string{"", "mb", "0", "-1mb", "abc"} {
		t.Run("invalid "+input, func(t *testing.T) {
			if _, err := ParseFileSize(input); err == nil {
				t.Fatalf("expected error")
			}
		})
	}
}

func TestDefaultFileMaxSizeFromEnv(t *testing.T) {
	t.Setenv(ImageFileMaxSizeEnvVar, "6mb")
	t.Setenv(AudioFileMaxSizeEnvVar, "256mb")
	t.Setenv(VideoFileMaxSizeEnvVar, "2gb")

	if got := DefaultImageFileMaxSizeFromEnv(); got != 6*1024*1024 {
		t.Fatalf("image file max size = %d, want %d", got, 6*1024*1024)
	}
	if got := DefaultAudioFileMaxSizeFromEnv(); got != 256*1024*1024 {
		t.Fatalf("audio file max size = %d, want %d", got, 256*1024*1024)
	}
	if got := DefaultVideoFileMaxSizeFromEnv(); got != 2*1024*1024*1024 {
		t.Fatalf("video file max size = %d, want %d", got, 2*1024*1024*1024)
	}
}

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
