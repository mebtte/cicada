package auth

import (
	"cicada/internal/config"
	"errors"
	"fmt"
	"os"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	secretOnce sync.Once
	secret     []byte
)

func jwtSecret() []byte {
	secretOnce.Do(func() {
		path := config.JWTSecretPath()
		if raw, err := os.ReadFile(path); err == nil {
			secret = raw
		} else {
			secret = []byte(randString(64))
			_ = os.WriteFile(path, secret, 0600)
		}
	})
	return secret
}

type claims struct {
	UserID          string `json:"userId"`
	TokenIdentifier string `json:"tokenIdentifier"`
	jwt.RegisteredClaims
}

func JWTSign(userID, tokenIdentifier string) (string, error) {
	expiry := time.Duration(config.Get().JWTExpiry) * time.Millisecond
	c := claims{
		UserID:          userID,
		TokenIdentifier: tokenIdentifier,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiry)),
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, c).SignedString(jwtSecret())
}

func JWTVerify(tokenStr string) (userID, tokenIdentifier string, err error) {
	t, err := jwt.ParseWithClaims(tokenStr, &claims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return jwtSecret(), nil
	})
	if err != nil {
		return "", "", err
	}
	c, ok := t.Claims.(*claims)
	if !ok || !t.Valid {
		return "", "", errors.New("invalid token")
	}
	return c.UserID, c.TokenIdentifier, nil
}
