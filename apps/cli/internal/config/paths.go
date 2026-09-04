package config

import (
	"fmt"
	"path/filepath"
	"strconv"
	"strings"
)

// ScratchDir contains disposable working files, separate from persistent assets.
func ScratchDir() string {
	c := Get()
	if c.Scratch != "" {
		return c.Scratch
	}
	return filepath.Join(c.Data, "scratch")
}

func DataVersionPath() string   { return filepath.Join(Get().Data, "v") }
func DBPath() string            { return filepath.Join(Get().Data, "db") }
func DBBackupPath() string      { return filepath.Join(Get().Data, "db.backup") }
func BinDir() string            { return filepath.Join(ScratchDir(), "bin") }
func LogDir() string            { return filepath.Join(ScratchDir(), "logs") }
func AccessLogDir() string      { return filepath.Join(LogDir(), "access") }
func SchedulerLogDir() string   { return filepath.Join(LogDir(), "scheduler") }
func ThumbnailCacheDir() string { return filepath.Join(ScratchDir(), "thumbnails") }
func MusicTranscodeCacheDir() string {
	return filepath.Join(ScratchDir(), "music_transcoded")
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

func PartialUploadDir() string   { return filepath.Join(ScratchDir(), "partial_uploads") }
func UpgradeLockPath() string    { return filepath.Join(Get().Data, "upgrade.lock") }
func UpgradeJournalPath() string { return filepath.Join(Get().Data, "upgrade.journal") }

// AssetPublicURL returns the public HTTP path for a stored asset filename.
func AssetPublicURL(filename string, t AssetType) string {
	if filename == "" {
		return ""
	}
	return fmt.Sprintf("/asset/%s/%s", t, filename)
}
