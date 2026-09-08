package handler

import (
	"errors"
	"net/http"
	"os"

	"cicada/internal/musictranscode"

	"github.com/gin-gonic/gin"
)

var musicTranscodeCacheControl = "public, max-age=31536000, immutable"

func serveMusicAsset(c *gin.Context, filename, sourcePath string) {
	quality, shouldTranscode, valid := musictranscode.ParseQuality(c.Request.URL.Query())
	if !valid {
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	if !shouldTranscode {
		serveAssetFile(c, sourcePath, filename, "public, max-age=31536000, immutable", "")
		return
	}

	result, err := musictranscode.OpenForPlayback(c.Request.Context(), filename, quality)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			c.AbortWithStatus(http.StatusNotFound)
			return
		}
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	defer result.Close()
	c.Header("Cache-Control", musicTranscodeCacheControl)
	c.Header("Content-Type", result.ContentType)
	c.Header("X-Content-Type-Options", "nosniff")
	// Audio mtime is the idle clock, so HTTP validators use stable source time.
	http.ServeContent(c.Writer, c.Request, result.Name, result.ModTime, result.File)
}
