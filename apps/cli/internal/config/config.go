package config

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
)

type Mode string

const (
	ModeDevelopment Mode = "development"
	ModeProduction  Mode = "production"
)

type AssetType string

const (
	AssetTypeUserAvatar     AssetType = "user_avatar"
	AssetTypeMusicbillCover AssetType = "musicbill_cover"
	AssetTypeArtistPhoto    AssetType = "artist_photo"
	AssetTypeMusicCover     AssetType = "music_cover"
	AssetTypeMusic          AssetType = "music"
)

var AllAssetTypes = []AssetType{
	AssetTypeUserAvatar,
	AssetTypeMusicbillCover,
	AssetTypeArtistPhoto,
	AssetTypeMusicCover,
	AssetTypeMusic,
}

// AssetAcceptMIME defines allowed MIME types per asset type.
var AssetAcceptMIME = map[AssetType][]string{
	AssetTypeArtistPhoto:    {"image/jpeg"},
	AssetTypeMusicbillCover: {"image/jpeg"},
	AssetTypeMusicCover:     {"image/jpeg"},
	AssetTypeUserAvatar:     {"image/jpeg"},
	AssetTypeMusic:          {"audio/mpeg", "audio/flac", "audio/x-flac", "audio/m4a", "audio/x-m4a", "audio/mp4", "video/mp4"},
}

const (
	DefaultMusicFileMaxSize int64 = 200 * 1024 * 1024
	DefaultImageFileMaxSize int64 = 5 * 1024 * 1024
)

type Config struct {
	Mode             Mode
	Data             string
	Port             int
	MusicFileMaxSize int64
	ImageFileMaxSize int64
}

const (
	DataEnvVar             = "CICADA_DATA"
	PortEnvVar             = "CICADA_PORT"
	MusicFileMaxSizeEnvVar = "CICADA_MUSIC_FILE_MAX_SIZE"
	ImageFileMaxSizeEnvVar = "CICADA_IMAGE_FILE_MAX_SIZE"

	DefaultPortValue = 8000
)

func DefaultDataPath() string {
	if data := os.Getenv(DataEnvVar); data != "" {
		return data
	}
	exe, err := os.Executable()
	if err != nil {
		return "cicada_data"
	}
	return filepath.Join(filepath.Dir(exe), "cicada_data")
}

func DefaultPort() int {
	if v := os.Getenv(PortEnvVar); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return DefaultPortValue
}

func DefaultMusicFileMaxSizeFromEnv() int64 {
	return defaultFileMaxSize(MusicFileMaxSizeEnvVar, DefaultMusicFileMaxSize)
}

func DefaultImageFileMaxSizeFromEnv() int64 {
	return defaultFileMaxSize(ImageFileMaxSizeEnvVar, DefaultImageFileMaxSize)
}

func defaultFileMaxSize(envVar string, fallback int64) int64 {
	if v := os.Getenv(envVar); v != "" {
		if n, err := ParseFileSize(v); err == nil {
			return n
		}
	}
	return fallback
}

var (
	mu  sync.RWMutex
	cfg = Config{
		Mode:             DefaultMode(),
		Data:             DefaultDataPath(),
		Port:             DefaultPortValue,
		MusicFileMaxSize: DefaultMusicFileMaxSizeFromEnv(),
		ImageFileMaxSize: DefaultImageFileMaxSizeFromEnv(),
	}
)

func Get() Config {
	mu.RLock()
	defer mu.RUnlock()
	return cfg
}

func Set(c Config) {
	mu.Lock()
	defer mu.Unlock()
	cfg = normalizeConfig(c)
}

func normalizeConfig(c Config) Config {
	if c.MusicFileMaxSize <= 0 {
		c.MusicFileMaxSize = DefaultMusicFileMaxSize
	}
	if c.ImageFileMaxSize <= 0 {
		c.ImageFileMaxSize = DefaultImageFileMaxSize
	}
	return c
}

func AssetMaxSize(t AssetType) (int64, bool) {
	switch t {
	case AssetTypeMusic:
		return Get().MusicFileMaxSize, true
	case AssetTypeUserAvatar, AssetTypeMusicbillCover, AssetTypeArtistPhoto, AssetTypeMusicCover:
		return Get().ImageFileMaxSize, true
	default:
		return 0, false
	}
}

func ParseFileSize(v string) (int64, error) {
	s := strings.TrimSpace(strings.ToLower(v))
	if s == "" {
		return 0, fmt.Errorf("empty file size")
	}

	multiplier := int64(1)
	for _, unit := range []struct {
		suffix     string
		multiplier int64
	}{
		{"bytes", 1},
		{"byte", 1},
		{"gib", 1024 * 1024 * 1024},
		{"gb", 1024 * 1024 * 1024},
		{"g", 1024 * 1024 * 1024},
		{"mib", 1024 * 1024},
		{"mb", 1024 * 1024},
		{"m", 1024 * 1024},
		{"kib", 1024},
		{"kb", 1024},
		{"k", 1024},
		{"b", 1},
	} {
		if strings.HasSuffix(s, unit.suffix) {
			multiplier = unit.multiplier
			s = strings.TrimSpace(strings.TrimSuffix(s, unit.suffix))
			break
		}
	}
	if s == "" {
		return 0, fmt.Errorf("missing numeric file size")
	}

	n, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid file size %q", v)
	}
	if n <= 0 {
		return 0, fmt.Errorf("file size must be greater than 0")
	}

	size := n * float64(multiplier)
	maxInt64 := int64(^uint64(0) >> 1)
	if size > float64(maxInt64) {
		return 0, fmt.Errorf("file size is too large")
	}
	if size < 1 {
		return 0, fmt.Errorf("file size must be at least 1 byte")
	}
	return int64(size), nil
}

func DataVersionPath() string   { return filepath.Join(Get().Data, "v") }
func DBPath() string            { return filepath.Join(Get().Data, "db") }
func DBBackupPath() string      { return filepath.Join(Get().Data, "db.backup") }
func LogDir() string            { return filepath.Join(Get().Data, "logs") }
func AccessLogDir() string      { return filepath.Join(LogDir(), "access") }
func SchedulerLogDir() string   { return filepath.Join(LogDir(), "scheduler") }
func CacheDir() string          { return filepath.Join(Get().Data, "cache") }
func ThumbnailCacheDir() string { return filepath.Join(CacheDir(), "thumbnails") }
func MusicTranscodeCacheDir() string {
	return filepath.Join(CacheDir(), "music_transcoded")
}

// ThumbnailCachePath returns the on-disk dir and full path for a thumbnail
// cache entry. filename is the original asset filename (md5 hex + ext) and
// size is the resize size. Entries are sharded into 256 buckets by the first
// two hex chars of filename to keep any single directory bounded; the cache
// file name itself is {hash}_{size}{ext} so all sizes of the same image group
// together lexicographically within a shard.
func ThumbnailCachePath(size int, filename string) (dir, path string) {
	shard := "00"
	if len(filename) >= 2 {
		shard = filename[:2]
	}
	ext := filepath.Ext(filename)
	base := strings.TrimSuffix(filename, ext)
	cacheName := base + "_" + strconv.Itoa(size) + ext
	dir = filepath.Join(ThumbnailCacheDir(), shard)
	path = filepath.Join(dir, cacheName)
	return
}

// MusicTranscodeCachePath returns the on-disk dir and full path for a music
// transcode cache entry. asset is the source music asset filename (md5 hex +
// ext); cacheName is the full target cache file name as composed by the
// musictranscode package (it embeds quality + version + extension, and for
// QualitySource includes a parallel .json sidecar). Entries are sharded into
// 256 buckets by the first two hex chars of asset so all products of one
// source (smooth m4a + source audio + source metadata sidecar) always land in
// the same shard — that lets the scheduler pair audio with sidecar locally
// without scanning the whole cache.
func MusicTranscodeCachePath(asset, cacheName string) (dir, path string) {
	shard := "00"
	if len(asset) >= 2 {
		shard = asset[:2]
	}
	dir = filepath.Join(MusicTranscodeCacheDir(), shard)
	path = filepath.Join(dir, cacheName)
	return
}
func AssetsDir() string           { return filepath.Join(Get().Data, "assets") }
func AssetDir(t AssetType) string { return filepath.Join(Get().Data, "assets", string(t)) }

// AssetPath returns the on-disk dir and full path for a stored asset. filename
// is the canonical {md5_hex_32}{ext} name produced by the uploader. Entries
// are sharded into 256 buckets by the first two hex chars of filename to keep
// any single asset-type directory bounded; the public URL stays flat
// (/asset/{type}/{filename}) and handlers resolve the shard internally.
func AssetPath(t AssetType, filename string) (dir, path string) {
	shard := "00"
	if len(filename) >= 2 {
		shard = filename[:2]
	}
	dir = filepath.Join(AssetDir(t), shard)
	path = filepath.Join(dir, filename)
	return
}

func PartialUploadDir() string   { return filepath.Join(Get().Data, "partial_uploads") }
func UpgradeLockPath() string    { return filepath.Join(Get().Data, "upgrade.lock") }
func UpgradeJournalPath() string { return filepath.Join(Get().Data, "upgrade.journal") }

// AssetPublicURL returns the public HTTP path for a stored asset filename.
func AssetPublicURL(filename string, t AssetType) string {
	if filename == "" {
		return ""
	}
	return fmt.Sprintf("/asset/%s/%s", t, filename)
}
