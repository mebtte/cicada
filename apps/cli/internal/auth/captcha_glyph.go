package auth

import (
	"fmt"
	"image"
	"image/color"
	"math"
	"math/rand/v2"
	"sync"

	"github.com/disintegration/imaging"
	"golang.org/x/image/font"
	"golang.org/x/image/font/gofont/gobold"
	"golang.org/x/image/font/gofont/gobolditalic"
	"golang.org/x/image/font/gofont/gomonobold"
	"golang.org/x/image/font/opentype"
	"golang.org/x/image/math/fixed"
)

var loadCaptchaFonts = sync.OnceValues(func() ([]*opentype.Font, error) {
	var fonts []*opentype.Font
	for _, data := range [][]byte{gobold.TTF, gobolditalic.TTF, gomonobold.TTF} {
		parsed, err := opentype.Parse(data)
		if err != nil {
			return nil, fmt.Errorf("parse captcha font: %w", err)
		}
		fonts = append(fonts, parsed)
	}
	return fonts, nil
})

func captchaGlyph(ch rune, parsed *opentype.Font, r *rand.Rand, ink color.NRGBA) (*image.NRGBA, error) {
	// Faces contain mutable glyph caches and must never be shared by requests.
	face, err := opentype.NewFace(parsed, &opentype.FaceOptions{Size: captchaFloat(r, 30, 36) * captchaScale, DPI: 72})
	if err != nil {
		return nil, fmt.Errorf("create captcha font face: %w", err)
	}
	defer face.Close()
	bounds, _ := font.BoundString(face, string(ch))
	x0, y0 := bounds.Min.X.Floor(), bounds.Min.Y.Floor()
	w, h := bounds.Max.X.Ceil()-x0+4, bounds.Max.Y.Ceil()-y0+4
	glyph := image.NewNRGBA(image.Rect(0, 0, w, h))
	drawer := font.Drawer{
		Dst: glyph, Src: image.NewUniform(ink), Face: face,
		Dot: fixed.P(2-x0, 2-y0),
	}
	drawer.DrawString(string(ch))
	width := min(int(float64(w)*captchaFloat(r, 0.85, 1.12)), 28*captchaScale)
	glyph = imaging.Resize(glyph, max(width, 1), h, imaging.Lanczos)
	return imaging.Rotate(glyph, captchaFloat(r, -23, 23), color.Transparent), nil
}

func warpCaptchaLetters(src *image.NRGBA, r *rand.Rand) *image.NRGBA {
	dst := image.NewNRGBA(src.Bounds())
	phaseX, phaseY := r.Float64()*2*math.Pi, r.Float64()*2*math.Pi
	periodX, periodY := captchaFloat(r, 36, 58), captchaFloat(r, 28, 42)
	ampX, ampY := captchaFloat(r, 0.9, 1.6), captchaFloat(r, 1.8, 2.8)
	for y := 0; y < dst.Bounds().Dy(); y++ {
		xShift := ampX * math.Sin(2*math.Pi*float64(y)/captchaScale/periodY+phaseX) * captchaScale
		for x := 0; x < dst.Bounds().Dx(); x++ {
			yShift := ampY * math.Sin(2*math.Pi*float64(x)/captchaScale/periodX+phaseY) * captchaScale
			sx, sy := x+int(xShift), y+int(yShift)
			if image.Pt(sx, sy).In(src.Bounds()) {
				dst.SetNRGBA(x, y, src.NRGBAAt(sx, sy))
			}
		}
	}
	return dst
}
