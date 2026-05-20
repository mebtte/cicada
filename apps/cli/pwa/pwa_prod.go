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

// Register mounts the embedded PWA files. PWA 使用 HashRouter，客户端路由全部在 `#`
// 后，后端只需服务 "/"（index.html）以及 dist 中真实存在的静态文件；其它未声明的
// 路径直接返回 404，避免将拼错的接口路径误响应为 PWA 的 index.html。
func Register(r *gin.Engine) {
	sub, err := fs.Sub(pwaFS, "dist")
	if err != nil {
		panic(err)
	}
	fileServer := http.FileServer(http.FS(sub))

	r.NoRoute(func(c *gin.Context) {
		path := c.Request.URL.Path
		// 根路径交给 FileServer 返回 index.html
		if path == "/" {
			fileServer.ServeHTTP(c.Writer, c.Request)
			return
		}
		// 仅当 dist 中存在对应的真实文件（非目录）时才服务，否则一律 404
		if info, err := fs.Stat(sub, path[1:]); err == nil && !info.IsDir() {
			fileServer.ServeHTTP(c.Writer, c.Request)
			return
		}
		c.AbortWithStatus(http.StatusNotFound)
	})
}
