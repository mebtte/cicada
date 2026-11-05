package config

import (
	"fmt"
	"strings"
)

// ParseBasePath validates and canonicalizes an HTTP mount path. Keeping the
// accepted alphabet unescaped avoids ambiguities between proxy and Gin paths.
func ParseBasePath(value string) (string, error) {
	if value == "" || value == "/" {
		return "", nil
	}
	if !strings.HasPrefix(value, "/") {
		return "", fmt.Errorf("base path must start with / (for example /cicada)")
	}
	path := strings.TrimSuffix(value, "/")
	for _, segment := range strings.Split(path[1:], "/") {
		if segment == "" || segment == "." || segment == ".." {
			return "", fmt.Errorf("base path must not contain empty, . or .. segments")
		}
		for _, ch := range segment {
			if ch >= 'a' && ch <= 'z' || ch >= 'A' && ch <= 'Z' || ch >= '0' && ch <= '9' || strings.ContainsRune("-._~", ch) {
				continue
			}
			return "", fmt.Errorf("base path segments may only contain ASCII letters, digits, -, ., _ and ~")
		}
	}
	return path, nil
}
