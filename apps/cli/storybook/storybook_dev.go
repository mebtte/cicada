//go:build !prod

package storybook

import "github.com/gin-gonic/gin"

// Register is a no-op in development mode. Run Storybook with its own dev
// server (`npm run storybook --prefix apps/pwa`) instead.
func Register(r *gin.Engine) {}
