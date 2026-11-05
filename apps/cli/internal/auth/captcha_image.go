package auth

import (
	cryptorand "crypto/rand"
	"encoding/base64"
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"math/rand/v2"

	"github.com/disintegration/imaging"
)

const (
	captchaWidth  = 180
	captchaHeight = 60
	// Render slightly above the output size for smooth transformed glyphs.
	captchaScale = 3
	// PWA displays at up to 240x80 CSS pixels, so the exported image is 2x.
	captchaImageWidth  = 480
	captchaImageHeight = 160
)

// buildCaptchaImage sends pixels only: no text nodes, glyph outlines, or
// answer-bearing metadata that a client can extract instead of solving it.
func buildCaptchaImage(text string) (string, error) {
	var seed [32]byte
	if _, err := cryptorand.Read(seed[:]); err != nil {
		return "", fmt.Errorf("generate captcha image seed: %w", err)
	}
	r := rand.New(rand.NewChaCha8(seed))
	fonts, err := loadCaptchaFonts()
	if err != nil {
		return "", err
	}
	canvas := image.NewNRGBA(image.Rect(0, 0, captchaWidth*captchaScale, captchaHeight*captchaScale))
	base := captchaColor(r, 232, 245, 255)
	for y := 0; y < canvas.Bounds().Dy(); y++ {
		for x := 0; x < canvas.Bounds().Dx(); x++ {
			light := uint8(9 * (float64(x)/float64(canvas.Bounds().Dx()) + float64(y)/float64(canvas.Bounds().Dy())) / 2)
			canvas.SetNRGBA(x, y, color.NRGBA{R: base.R + light, G: base.G + light, B: base.B + light, A: 255})
		}
	}
	for range 3 {
		captchaCurve(canvas, r, captchaColor(r, 95, 150, 90), captchaFloat(r, 0.6, 1.1))
	}
	captchaSpeckles(canvas, r, 120, 0.25, 0.9, 75)
	captchaStrokes(canvas, r, 18, 95)

	letters := image.NewNRGBA(canvas.Bounds())
	ink := captchaColor(r, 30, 85, 255)
	for i, ch := range text {
		glyph, err := captchaGlyph(ch, fonts[r.IntN(len(fonts))], r, ink)
		if err != nil {
			return "", err
		}
		centerX := (31 + float64(i)*29 + captchaFloat(r, -3, 3)) * captchaScale
		centerY := (30 + captchaFloat(r, -4, 4)) * captchaScale
		at := image.Pt(int(centerX)-glyph.Bounds().Dx()/2, int(centerY)-glyph.Bounds().Dy()/2)
		draw.Draw(letters, glyph.Bounds().Add(at), glyph, image.Point{}, draw.Over)
	}
	letters = warpCaptchaLetters(letters, r)
	draw.Draw(canvas, canvas.Bounds(), letters, image.Point{}, draw.Over)
	// Fine interruptions break clean character contours without covering large
	// areas of a glyph. The readable shape remains visible around each cut.
	for range 10 {
		x, y := captchaFloat(r, 20, 162), captchaFloat(r, 15, 45)
		captchaLine(canvas, x, y, x+captchaFloat(r, -7, 7), y+captchaFloat(r, -3, 3), captchaFloat(r, 0.35, 0.65), base)
	}

	// Foreground curves and short strokes intersect glyphs, so removing only
	// the background does not isolate the characters. Keep these thin enough
	// to leave the letter shapes and counters readable.
	for range 6 {
		captchaCurve(canvas, r, ink, captchaFloat(r, 0.65, 1.3))
	}
	captchaFragments(canvas, r, ink)
	captchaStrokes(canvas, r, 24, 165)
	captchaSpeckles(canvas, r, 90, 0.25, 0.8, 150)
	canvas = imaging.Resize(canvas, captchaImageWidth, captchaImageHeight, imaging.Lanczos)
	data, err := encodeCaptchaPNG(canvas)
	if err != nil {
		return "", fmt.Errorf("encode captcha PNG: %w", err)
	}
	return "data:image/png;base64," + base64.StdEncoding.EncodeToString(data), nil
}
