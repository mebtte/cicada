package handler

import (
	"cicada/internal/config"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/disintegration/imaging"
	"github.com/gin-gonic/gin"
)

const imageMaxSize = 2048

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

		assetDir := config.AssetDir(at)
		assetPath := filepath.Join(assetDir, filename)

		if at == config.AssetTypeMusic {
			serveMusicAsset(c, filename, assetPath)
			return
		}

		// image resize support
		if sizeStr := c.Query("size"); sizeStr != "" && at != config.AssetTypeMusic {
			size, err := strconv.Atoi(sizeStr)
			if err == nil && size > 0 && size <= imageMaxSize {
				cacheDir := config.ThumbnailCacheDir()
				cacheName := strconv.Itoa(size) + "_" + filename
				cachePath := filepath.Join(cacheDir, cacheName)

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
				http.ServeContent(c.Writer, c.Request, cacheName, fi.ModTime(), f)
				return
			}
		}

		serveAssetFile(c, assetPath, filename, "public, max-age=31536000, immutable", "")
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
	if contentType != "" {
		c.Header("Content-Type", contentType)
	}
	http.ServeContent(c.Writer, c.Request, name, fi.ModTime(), f)
}
