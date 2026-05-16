package store

import (
	"crypto/rand"
	"math/big"
)

const (
	shortPublicIDLength   = 8
	shortPublicIDAlphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
)

func generateShortPublicID() (string, error) {
	max := big.NewInt(int64(len(shortPublicIDAlphabet)))
	bytes := make([]byte, shortPublicIDLength)
	for i := range bytes {
		n, err := rand.Int(rand.Reader, max)
		if err != nil {
			return "", err
		}
		bytes[i] = shortPublicIDAlphabet[n.Int64()]
	}
	return string(bytes), nil
}
