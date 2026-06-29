package handler

import (
	"cicada/internal/config"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/disintegration/imaging"
	"github.com/gin-gonic/gin"
)

const imageMaxSize = 2048

// allowedAssetExt maps a sniffed MIME to the canonical on-disk extension we
// will use when storing the file. Using a server-controlled extension table
// prevents an attacker from picking a filename like `evil.html` that would
// later coerce the download response into being served as HTML.
var allowedAssetExt = map[string]string{
	"image/jpeg":   ".jpg",
	"audio/mpeg":   ".mp3",
	"audio/mp3":    ".mp3",
	"audio/x-mpeg": ".mp3",
	"audio/flac":   ".flac",
	"audio/x-flac": ".flac",
	"audio/m4a":    ".m4a",
	"audio/x-m4a":  ".m4a",
	"audio/mp4":    ".m4a",
	"video/mp4":    ".mp4",
}

// assetContentTypeByExt is the inverse mapping used when serving an asset back
// to clients. The Content-Type is derived from our server-controlled extension,
// not from the OS-dependent mime.TypeByExtension table.
var assetContentTypeByExt = map[string]string{
	".jpg":  "image/jpeg",
	".jpeg": "image/jpeg",
	".mp3":  "audio/mpeg",
	".flac": "audio/flac",
	".m4a":  "audio/mp4",
	".mp4":  "video/mp4",
}

// safeAssetExt returns the canonical extension for a validated MIME, or empty
// string when the MIME is not in our allow-list.
func safeAssetExt(mimeStr string) string {
	return allowedAssetExt[mimeStr]
}

// assetContentTypeFor returns the canonical Content-Type for a stored asset
// filename. Falls back to application/octet-stream so unknown extensions are
// never rendered inline.
func assetContentTypeFor(filename string) string {
	if ct, ok := assetContentTypeByExt[strings.ToLower(filepath.Ext(filename))]; ok {
		return ct
	}
	return "application/octet-stream"
}

// ServeAsset serves files from the given asset type directory.
// Supports optional ?size=N query for image resizing (square resize).
func ServeAsset(at config.AssetType) gin.HandlerFunc {
	return func(c *gin.Context) {
		filename := c.Param("filename")
		if filename == "" {
			c.Status(http.StatusNotFound)
			return
		}
		// strip leading slash
		if len(filename) > 0 && filename[0] == '/' {
			filename = filename[1:]
		}

		_, assetPath := config.AssetPath(at, filename)

		if at == config.AssetTypeMusic {
			serveMusicAsset(c, filename, assetPath)
			return
		}

		// image resize support
		if sizeStr := c.Query("size"); sizeStr != "" && at != config.AssetTypeMusic {
			size, err := strconv.Atoi(sizeStr)
			if err == nil && size > 0 && size <= imageMaxSize {
				cacheDir, cachePath := config.ThumbnailCachePath(size, filename)
				cacheName := filepath.Base(cachePath)

				if _, err := os.Stat(cachePath); os.IsNotExist(err) {
					if err := os.MkdirAll(cacheDir, 0755); err != nil {
						c.Status(http.StatusInternalServerError)
						return
					}
					// check source exists
					if _, err := os.Stat(assetPath); os.IsNotExist(err) {
						c.Status(http.StatusNotFound)
						return
					}
					src, err := imaging.Open(assetPath)
					if err != nil {
						c.Status(http.StatusInternalServerError)
						return
					}
					bounds := src.Bounds()
					if bounds.Dx() > size {
						src = imaging.Resize(src, size, size, imaging.Lanczos)
					}
					if err := imaging.Save(src, cachePath); err != nil {
						c.Status(http.StatusInternalServerError)
						return
					}
				}

				touchFile(cachePath)

				f, err := os.Open(cachePath)
				if err != nil {
					c.Status(http.StatusNotFound)
					return
				}
				defer f.Close()
				fi, _ := f.Stat()
				c.Header("Cache-Control", "public, max-age=31536000, immutable")
				c.Header("Content-Type", "image/jpeg")
				c.Header("X-Content-Type-Options", "nosniff")
				http.ServeContent(c.Writer, c.Request, cacheName, fi.ModTime(), f)
				return
			}
		}

		serveAssetFile(c, assetPath, filename, "public, max-age=31536000, immutable", assetContentTypeFor(filename))
	}
}

func serveAssetFile(c *gin.Context, path, name, cacheControl, contentType string) {
	f, err := os.Open(path)
	if err != nil {
		c.Status(http.StatusNotFound)
		return
	}
	defer f.Close()
	fi, _ := f.Stat()
	if cacheControl != "" {
		c.Header("Cache-Control", cacheControl)
	}
	if contentType == "" {
		contentType = assetContentTypeFor(name)
	}
	c.Header("Content-Type", contentType)
	c.Header("X-Content-Type-Options", "nosniff")
	http.ServeContent(c.Writer, c.Request, name, fi.ModTime(), f)
}

func touchFile(path string) {
	now := time.Now()
	_ = os.Chtimes(path, now, now)
}
