package auth

import (
	"cicada/internal/store"
	"fmt"
	"math/rand"
	"strings"
	"time"
)

const captchaTTLms = 2 * 60 * 1000

func NewCaptcha() (id, svg string, err error) {
	id = randString(8)
	text := captchaText(5)
	_, err = store.DB().Exec(
		`INSERT INTO captcha (id,value,createTimestamp) VALUES (?,?,?)`,
		id, text, time.Now().UnixMilli(),
	)
	if err != nil {
		return "", "", fmt.Errorf("insert captcha: %w", err)
	}
	return id, buildSVG(text), nil
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

func captchaText(n int) string {
	const chars = "abcdefghjkmnpqrstuvwxy34567891ABCDEFGHJKMNPQRSTUVWXY"
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	b := make([]byte, n)
	for i := range b {
		b[i] = chars[r.Intn(len(chars))]
	}
	return string(b)
}

func buildSVG(text string) string {
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	const w, h = 160, 60
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d">`, w, h))
	sb.WriteString(fmt.Sprintf(`<rect width="%d" height="%d" fill="#f0f0f0"/>`, w, h))
	for i := 0; i < 4; i++ {
		sb.WriteString(fmt.Sprintf(`<line x1="%d" y1="%d" x2="%d" y2="%d" stroke="#%02x%02x%02x" stroke-width="1"/>`,
			r.Intn(w), r.Intn(h), r.Intn(w), r.Intn(h), r.Intn(180), r.Intn(180), r.Intn(180)))
	}
	for i, ch := range text {
		x := 15 + i*28 + r.Intn(5)
		y := 38 + r.Intn(8) - 4
		rot := r.Intn(30) - 15
		sb.WriteString(fmt.Sprintf(`<text x="%d" y="%d" font-size="28" font-family="Arial" fill="#333" transform="rotate(%d,%d,%d)">%c</text>`,
			x, y, rot, x, y, ch))
	}
	sb.WriteString(`</svg>`)
	return sb.String()
}
