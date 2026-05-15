package config

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
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
	AssetTypeSingerPhoto    AssetType = "singer_photo"
	AssetTypeMusicCover     AssetType = "music_cover"
	AssetTypeMusic          AssetType = "music"
)

var AllAssetTypes = []AssetType{
	AssetTypeUserAvatar,
	AssetTypeMusicbillCover,
	AssetTypeSingerPhoto,
	AssetTypeMusicCover,
	AssetTypeMusic,
}

// AssetAcceptMIME defines allowed MIME types per asset type.
var AssetAcceptMIME = map[AssetType][]string{
	AssetTypeSingerPhoto:    {"image/jpeg"},
	AssetTypeMusicbillCover: {"image/jpeg"},
	AssetTypeMusicCover:     {"image/jpeg"},
	AssetTypeUserAvatar:     {"image/jpeg"},
	AssetTypeMusic:          {"audio/mpeg", "audio/flac", "audio/x-flac", "audio/m4a", "audio/x-m4a", "audio/mp4", "video/mp4"},
}

var AssetMaxSize = map[AssetType]int64{
	AssetTypeSingerPhoto:    2 * 1024 * 1024,
	AssetTypeMusicbillCover: 2 * 1024 * 1024,
	AssetTypeMusicCover:     2 * 1024 * 1024,
	AssetTypeUserAvatar:     2 * 1024 * 1024,
	AssetTypeMusic:          200 * 1024 * 1024,
}

type Config struct {
	Mode Mode
	Data string
	Port int
}

const (
	DataEnvVar = "CICADA_DATA"
	PortEnvVar = "CICADA_PORT"

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

var (
	mu  sync.RWMutex
	cfg = Config{
		Mode: DefaultMode(),
		Data: DefaultDataPath(),
		Port: DefaultPortValue,
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
	cfg = c
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
func AssetsDir() string           { return filepath.Join(Get().Data, "assets") }
func AssetDir(t AssetType) string { return filepath.Join(Get().Data, "assets", string(t)) }
func PartialUploadDir() string    { return filepath.Join(Get().Data, "partial_uploads") }
func UpgradeLockPath() string     { return filepath.Join(Get().Data, "upgrade.lock") }
func UpgradeJournalPath() string  { return filepath.Join(Get().Data, "upgrade.journal") }

// AssetPublicURL returns the public HTTP path for a stored asset filename.
func AssetPublicURL(filename string, t AssetType) string {
	if filename == "" {
		return ""
	}
	return fmt.Sprintf("/asset/%s/%s", t, filename)
}
