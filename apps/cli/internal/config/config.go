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

type FileCategory string

const (
	FileCategoryImage FileCategory = "image"
	FileCategoryAudio FileCategory = "audio"
	FileCategoryVideo FileCategory = "video"
)

const (
	DefaultImageFileMaxSize int64 = 5 * 1024 * 1024
	DefaultAudioFileMaxSize int64 = 200 * 1024 * 1024
	DefaultVideoFileMaxSize int64 = 1024 * 1024 * 1024
)

type Config struct {
	Mode             Mode
	Data             string
	Port             int
	ImageFileMaxSize int64
	AudioFileMaxSize int64
	VideoFileMaxSize int64
}

const (
	DataEnvVar             = "CICADA_DATA"
	PortEnvVar             = "CICADA_PORT"
	ImageFileMaxSizeEnvVar = "CICADA_IMAGE_FILE_MAX_SIZE"
	AudioFileMaxSizeEnvVar = "CICADA_AUDIO_FILE_MAX_SIZE"
	VideoFileMaxSizeEnvVar = "CICADA_VIDEO_FILE_MAX_SIZE"

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

func DefaultImageFileMaxSizeFromEnv() int64 {
	return defaultFileMaxSize(ImageFileMaxSizeEnvVar, DefaultImageFileMaxSize)
}

func DefaultAudioFileMaxSizeFromEnv() int64 {
	return defaultFileMaxSize(AudioFileMaxSizeEnvVar, DefaultAudioFileMaxSize)
}

func DefaultVideoFileMaxSizeFromEnv() int64 {
	return defaultFileMaxSize(VideoFileMaxSizeEnvVar, DefaultVideoFileMaxSize)
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
		ImageFileMaxSize: DefaultImageFileMaxSizeFromEnv(),
		AudioFileMaxSize: DefaultAudioFileMaxSizeFromEnv(),
		VideoFileMaxSize: DefaultVideoFileMaxSizeFromEnv(),
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
	if c.ImageFileMaxSize <= 0 {
		c.ImageFileMaxSize = DefaultImageFileMaxSize
	}
	if c.AudioFileMaxSize <= 0 {
		c.AudioFileMaxSize = DefaultAudioFileMaxSize
	}
	if c.VideoFileMaxSize <= 0 {
		c.VideoFileMaxSize = DefaultVideoFileMaxSize
	}
	return c
}

// CategoryFromMIME maps a sniffed MIME string (sans parameters) to a
// FileCategory. Returns false when the MIME does not belong to any of the
// supported categories.
func CategoryFromMIME(mime string) (FileCategory, bool) {
	switch {
	case strings.HasPrefix(mime, "image/"):
		return FileCategoryImage, true
	case strings.HasPrefix(mime, "audio/"):
		return FileCategoryAudio, true
	case strings.HasPrefix(mime, "video/"):
		return FileCategoryVideo, true
	default:
		return "", false
	}
}

// FileCategoryMaxSize returns the configured size cap for the given category.
func FileCategoryMaxSize(cat FileCategory) (int64, bool) {
	c := Get()
	switch cat {
	case FileCategoryImage:
		return c.ImageFileMaxSize, true
	case FileCategoryAudio:
		return c.AudioFileMaxSize, true
	case FileCategoryVideo:
		return c.VideoFileMaxSize, true
	default:
		return 0, false
	}
}

// AssetMaxSize returns the upload size cap for an asset type.
//
// When mime is empty (e.g. chunked init before any bytes are sniffed), music
// assets fall back to max(audio, video) so the worst-case payload still passes
// the early gate; the final per-category cap is re-checked at completion. Image
// asset types always resolve to ImageFileMaxSize regardless of mime.
func AssetMaxSize(t AssetType, mime string) (int64, bool) {
	switch t {
	case AssetTypeUserAvatar, AssetTypeMusicbillCover, AssetTypeArtistPhoto, AssetTypeMusicCover:
		return Get().ImageFileMaxSize, true
	case AssetTypeMusic:
		if mime == "" {
			c := Get()
			max := c.AudioFileMaxSize
			if c.VideoFileMaxSize > max {
				max = c.VideoFileMaxSize
			}
			return max, true
		}
		if cat, ok := CategoryFromMIME(mime); ok {
			return FileCategoryMaxSize(cat)
		}
		return 0, false
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
