package auth

import (
	"bytes"
	"image"
	"image/color"
	"image/png"
	"sort"
)

type captchaColorBin struct {
	count, red, green, blue uint32
}

// Captchas consist mostly of flat colors and antialiased edges. An adaptive
// palette reduces their payload without resizing or blurring the characters.
// Color precision is reduced slightly; no dithering is added to the image.
func encodeCaptchaPNG(src *image.NRGBA) ([]byte, error) {
	bins := make([]captchaColorBin, 1<<15)
	var used []int
	for y := src.Bounds().Min.Y; y < src.Bounds().Max.Y; y++ {
		for x := src.Bounds().Min.X; x < src.Bounds().Max.X; x++ {
			c := src.NRGBAAt(x, y)
			key := captchaColorKey(c)
			bin := &bins[key]
			if bin.count == 0 {
				used = append(used, key)
			}
			bin.count++
			bin.red += uint32(c.R)
			bin.green += uint32(c.G)
			bin.blue += uint32(c.B)
		}
	}
	sort.Slice(used, func(i, j int) bool { return bins[used[i]].count > bins[used[j]].count })
	palette := make(color.Palette, min(256, len(used)))
	for i := range palette {
		palette[i] = bins[used[i]].average()
	}
	// Resolve each 5-bit RGB bin once rather than scanning the entire palette
	// for every pixel. The source is opaque, so no transparency entry is needed.
	lookup := make([]uint8, len(bins))
	for _, key := range used {
		lookup[key] = uint8(palette.Index(bins[key].average()))
	}
	indexed := image.NewPaletted(src.Bounds(), palette)
	for y := src.Bounds().Min.Y; y < src.Bounds().Max.Y; y++ {
		for x := src.Bounds().Min.X; x < src.Bounds().Max.X; x++ {
			indexed.SetColorIndex(x, y, lookup[captchaColorKey(src.NRGBAAt(x, y))])
		}
	}
	var data bytes.Buffer
	encoder := png.Encoder{CompressionLevel: png.BestCompression}
	if err := encoder.Encode(&data, indexed); err != nil {
		return nil, err
	}
	return data.Bytes(), nil
}

func captchaColorKey(c color.NRGBA) int {
	return int(c.R>>3)<<10 | int(c.G>>3)<<5 | int(c.B>>3)
}

func (bin captchaColorBin) average() color.RGBA {
	return color.RGBA{R: uint8(bin.red / bin.count), G: uint8(bin.green / bin.count), B: uint8(bin.blue / bin.count), A: 255}
}
