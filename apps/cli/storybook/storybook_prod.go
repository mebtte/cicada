//go:build prod

package storybook

import (
	"embed"
	"io/fs"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

//go:embed all:static
var storybookFS embed.FS

// Register mounts the embedded Storybook static build under `/storybook`.
// Storybook 的静态产物使用相对路径引用资源，因此在子路径下托管时必须带尾斜杠，
// 否则 `index.html` 里的相对资源会解析到根路径。这里把 `/storybook` 重定向到
// `/storybook/`，其余文件交给基于 embed FS 的 FileServer 处理。
func Register(r *gin.Engine) {
	sub, err := fs.Sub(storybookFS, "static")
	if err != nil {
		panic(err)
	}
	fileServer := http.StripPrefix("/storybook/", http.FileServer(http.FS(sub)))

	r.GET("/storybook", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/storybook/")
	})
	r.GET("/storybook/*filepath", func(c *gin.Context) {
		filepath := strings.TrimPrefix(c.Param("filepath"), "/")
		// 根路径交给 FileServer 返回 index.html；其余仅当真实文件存在时才服务，
		// 未声明的路径一律 404，避免误把任意路径当作 index.html 返回。
		if filepath != "" {
			if info, err := fs.Stat(sub, filepath); err != nil || info.IsDir() {
				c.AbortWithStatus(http.StatusNotFound)
				return
			}
		}
		fileServer.ServeHTTP(c.Writer, c.Request)
	})
}
