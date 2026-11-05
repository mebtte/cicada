package auth

import (
	"cicada/internal/store"
	"crypto/rand"
	"fmt"
	"math/big"
	"strings"
	"time"
)

const captchaTTLms = 2 * 60 * 1000

func NewCaptcha() (id, image string, err error) {
	id = randString(8)
	text, err := captchaText(5)
	if err != nil {
		return "", "", err
	}
	image, err = buildCaptchaImage(text)
	if err != nil {
		return "", "", err
	}
	_, err = store.DB().Exec(
		`INSERT INTO captcha (id,value,createTimestamp) VALUES (?,?,?)`,
		id, text, time.Now().UnixMilli(),
	)
	if err != nil {
		return "", "", fmt.Errorf("insert captcha: %w", err)
	}
	return id, image, nil
}

func VerifyCaptcha(id, value string) (bool, error) {
	threshold := time.Now().UnixMilli() - captchaTTLms
	var stored string
	err := store.DB().QueryRow(
		`SELECT value FROM captcha WHERE id=? AND createTimestamp>=? AND used=0`, id, threshold,
	).Scan(&stored)
	// Always mark used
	store.DB().Exec(`UPDATE captcha SET used=1 WHERE id=?`, id)
	if err != nil {
		return false, nil
	}
	return strings.EqualFold(value, stored), nil
}

func captchaText(n int) (string, error) {
	const chars = "abcdefghjkmnpqrstuvwxy34567891ABCDEFGHJKMNPQRSTUVWXY"
	b := make([]byte, n)
	for i := range b {
		index, err := rand.Int(rand.Reader, big.NewInt(int64(len(chars))))
		if err != nil {
			return "", fmt.Errorf("generate captcha text: %w", err)
		}
		b[i] = chars[index.Int64()]
	}
	return string(b), nil
}
