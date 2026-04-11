//go:build !prod

package pwa

import "github.com/gin-gonic/gin"

// Register is a no-op in development mode.
func Register(r *gin.Engine) {}
