package handler

import (
	"cicada/internal/config"
	"os"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

const aliasDivider = "♫"

func splitAliases(s string) []string {
	if s == "" {
		return []string{}
	}
	return strings.Split(s, aliasDivider)
}

func joinAliases(aliases []string) string {
	return strings.Join(aliases, aliasDivider)
}

func queryInt(c *gin.Context, key string, defaultVal int) int {
	s := c.Query(key)
	if s == "" {
		return defaultVal
	}
	n, err := strconv.Atoi(s)
	if err != nil {
		return defaultVal
	}
	return n
}

func assetExists(filename string, t config.AssetType) bool {
	if filename == "" {
		return false
	}
	_, path := config.AssetPath(t, filename)
	_, err := os.Stat(path)
	return err == nil
}
