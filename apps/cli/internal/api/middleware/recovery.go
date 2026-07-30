package middleware

import (
	"cicada/internal/api"
	"cicada/internal/api/apperr"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func Recovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if r := recover(); r != nil {
				fmt.Printf("[PANIC] %v\n", r)
				api.FailWithStatus(c, http.StatusInternalServerError, apperr.ServerError)
			}
		}()
		c.Next()
	}
}
