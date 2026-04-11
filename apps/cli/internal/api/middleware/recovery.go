package middleware

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func Recovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if r := recover(); r != nil {
				fmt.Printf("[PANIC] %v\n", r)
				c.JSON(http.StatusInternalServerError, gin.H{"code": "server_error", "message": "server_error"})
				c.Abort()
			}
		}()
		c.Next()
	}
}
