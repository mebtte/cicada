package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"strings"
	"time"
)

const (
	SessionTokenPrefix = "cicada_"

	SessionIdleTimeout   = 180 * 24 * time.Hour
	SessionRetention     = 90 * 24 * time.Hour
	SessionTouchInterval = time.Minute

	sessionTokenBytes = 32
)

func NewSessionToken() (token, tokenPrefix, tokenHash string, err error) {
	raw := make([]byte, sessionTokenBytes)
	if _, err := rand.Read(raw); err != nil {
		return "", "", "", err
	}
	token = SessionTokenPrefix + base64.RawURLEncoding.EncodeToString(raw)
	tokenPrefix = token
	if len(tokenPrefix) > 18 {
		tokenPrefix = tokenPrefix[:18]
	}
	return token, tokenPrefix, SessionTokenHash(token), nil
}

func SessionTokenHash(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func ValidSessionToken(token string) bool {
	if !strings.HasPrefix(token, SessionTokenPrefix) {
		return false
	}
	raw := strings.TrimPrefix(token, SessionTokenPrefix)
	decoded, err := base64.RawURLEncoding.DecodeString(raw)
	return err == nil && len(decoded) == sessionTokenBytes
}

func SessionActiveAfter(now time.Time) int64 {
	return now.Add(-SessionIdleTimeout).UnixMilli()
}

func SessionInactiveCleanupBefore(now time.Time) int64 {
	return now.Add(-SessionIdleTimeout - SessionRetention).UnixMilli()
}

func SessionRevokedCleanupBefore(now time.Time) int64 {
	return now.Add(-SessionRetention).UnixMilli()
}
