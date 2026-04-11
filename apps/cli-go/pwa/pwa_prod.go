//go:build prod

package pwa

import (
	"embed"
	"io/fs"
	"net/http"

	"github.com/gin-gonic/gin"
)

//go:embed dist
var pwaFS embed.FS

// Register mounts the embedded PWA files and serves index.html for unmatched routes.
func Register(r *gin.Engine) {
	sub, err := fs.Sub(pwaFS, "dist")
	if err != nil {
		panic(err)
	}
	fileServer := http.FileServer(http.FS(sub))

	r.NoRoute(func(c *gin.Context) {
		// try to serve static file; fall back to index.html for SPA routing
		path := c.Request.URL.Path
		if _, err := fs.Stat(sub, path[1:]); err == nil {
			fileServer.ServeHTTP(c.Writer, c.Request)
		} else {
			// serve index.html for SPA client-side routing
			c.Request.URL.Path = "/"
			fileServer.ServeHTTP(c.Writer, c.Request)
		}
	})
}
