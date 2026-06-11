package store

import (
	"crypto/rand"
	"math/big"
)

const (
	publicIDLength   = 6
	publicIDAlphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
)

func generatePublicID() (string, error) {
	max := big.NewInt(int64(len(publicIDAlphabet)))
	bytes := make([]byte, publicIDLength)
	for i := range bytes {
		n, err := rand.Int(rand.Reader, max)
		if err != nil {
			return "", err
		}
		bytes[i] = publicIDAlphabet[n.Int64()]
	}
	return string(bytes), nil
}
