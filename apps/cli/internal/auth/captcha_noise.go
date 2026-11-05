package auth

import (
	"image"
	"image/color"
	"math"
	"math/rand/v2"
)

func captchaCurve(dst *image.NRGBA, r *rand.Rand, c color.NRGBA, width float64) {
	y0, y1, y2, y3 := captchaFloat(r, 10, 50), captchaFloat(r, 0, 60), captchaFloat(r, 0, 60), captchaFloat(r, 10, 50)
	previousX, previousY := -3.0, y0
	for step := 1; step <= 180; step++ {
		t := float64(step) / 180
		u := 1 - t
		x := -3 + 186*t
		y := u*u*u*y0 + 3*u*u*t*y1 + 3*u*t*t*y2 + t*t*t*y3
		captchaLine(dst, previousX, previousY, x, y, width, c)
		previousX, previousY = x, y
	}
}

func captchaStrokes(dst *image.NRGBA, r *rand.Rand, count int, alpha uint8) {
	for range count {
		x, y := captchaFloat(r, 3, 177), captchaFloat(r, 4, 56)
		captchaLine(dst, x, y, x+captchaFloat(r, -9, 9), y+captchaFloat(r, -6, 6), captchaFloat(r, 0.4, 0.8), captchaColor(r, 50, 145, alpha))
	}
}

// Partial loops resemble character strokes and cross the spaces between
// letters. Sharing the glyph ink prevents simple color-based separation.
func captchaFragments(dst *image.NRGBA, r *rand.Rand, ink color.NRGBA) {
	for range 16 {
		cx, cy := captchaFloat(r, 15, 165), captchaFloat(r, 12, 48)
		rx, ry := captchaFloat(r, 1.5, 3.5), captchaFloat(r, 2.5, 5)
		start, sweep := r.Float64()*2*math.Pi, captchaFloat(r, 0.6, 1.4)*math.Pi
		px, py := cx+rx*math.Cos(start), cy+ry*math.Sin(start)
		for step := 1; step <= 20; step++ {
			angle := start + sweep*float64(step)/20
			x, y := cx+rx*math.Cos(angle), cy+ry*math.Sin(angle)
			captchaLine(dst, px, py, x, y, 0.75, ink)
			px, py = x, y
		}
	}
}

func captchaSpeckles(dst *image.NRGBA, r *rand.Rand, count int, minRadius, maxRadius float64, alpha uint8) {
	for range count {
		captchaDisc(dst, r.Float64()*captchaWidth*captchaScale, r.Float64()*captchaHeight*captchaScale,
			captchaFloat(r, minRadius, maxRadius)*captchaScale, captchaColor(r, 50, 165, alpha))
	}
}

func captchaLine(dst *image.NRGBA, x0, y0, x1, y1, width float64, c color.NRGBA) {
	x0, y0, x1, y1 = x0*captchaScale, y0*captchaScale, x1*captchaScale, y1*captchaScale
	steps := max(1, int(math.Ceil(math.Hypot(x1-x0, y1-y0)*2)))
	for i := 0; i <= steps; i++ {
		t := float64(i) / float64(steps)
		captchaDisc(dst, x0+(x1-x0)*t, y0+(y1-y0)*t, width*captchaScale/2, c)
	}
}

func captchaDisc(dst *image.NRGBA, cx, cy, radius float64, c color.NRGBA) {
	for y := max(0, int(cy-radius-1)); y < min(dst.Bounds().Dy(), int(cy+radius+2)); y++ {
		for x := max(0, int(cx-radius-1)); x < min(dst.Bounds().Dx(), int(cx+radius+2)); x++ {
			coverage := min(1.0, max(0.0, radius+0.5-math.Hypot(float64(x)+0.5-cx, float64(y)+0.5-cy)))
			alpha := coverage * float64(c.A) / 255
			if alpha == 0 {
				continue
			}
			old := dst.NRGBAAt(x, y)
			dst.SetNRGBA(x, y, color.NRGBA{
				R: uint8(float64(c.R)*alpha + float64(old.R)*(1-alpha)),
				G: uint8(float64(c.G)*alpha + float64(old.G)*(1-alpha)),
				B: uint8(float64(c.B)*alpha + float64(old.B)*(1-alpha)), A: 255,
			})
		}
	}
}

func captchaFloat(r *rand.Rand, low, high float64) float64 {
	return low + r.Float64()*(high-low)
}

func captchaColor(r *rand.Rand, low, high int, alpha uint8) color.NRGBA {
	return color.NRGBA{R: uint8(low + r.IntN(high-low)), G: uint8(low + r.IntN(high-low)), B: uint8(low + r.IntN(high-low)), A: alpha}
}
