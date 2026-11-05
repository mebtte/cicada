package auth

import (
	"bytes"
	"cicada/internal/config"
	"cicada/internal/store"
	"encoding/base64"
	"encoding/binary"
	"image/color"
	"image/png"
	"strings"
	"testing"
	"time"
)

func captchaRaster(t *testing.T, imageData string) []byte {
	t.Helper()
	const prefix = "data:image/png;base64,"
	if !strings.HasPrefix(imageData, prefix) {
		t.Fatal("captcha image is not a PNG data URL")
	}
	data, err := base64.StdEncoding.DecodeString(strings.TrimPrefix(imageData, prefix))
	if err != nil {
		t.Fatalf("decode captcha PNG data URL: %v", err)
	}
	image, err := png.Decode(bytes.NewReader(data))
	if err != nil {
		t.Fatalf("decode captcha PNG: %v", err)
	}
	if bounds := image.Bounds(); bounds.Dx() != 480 || bounds.Dy() != 160 {
		t.Fatalf("captcha raster dimensions = %v; want 480x160", bounds)
	}
	if palette, ok := image.ColorModel().(color.Palette); !ok || len(palette) > 256 {
		t.Fatal("captcha PNG must use an indexed palette to keep its payload small")
	}
	if len(data) > 48*1024 {
		t.Fatalf("captcha PNG exceeds its 48 KiB payload budget: %d bytes", len(data))
	}
	// Check PNG chunk types rather than searching compressed bytes, where an
	// accidental match to a short answer would make the test flaky.
	for offset := 8; offset < len(data); {
		if len(data)-offset < 12 {
			t.Fatal("truncated PNG chunk")
		}
		length := int(binary.BigEndian.Uint32(data[offset : offset+4]))
		if length > len(data)-offset-12 {
			t.Fatal("invalid PNG chunk length")
		}
		kind := string(data[offset+4 : offset+8])
		switch kind {
		case "tEXt", "zTXt", "iTXt", "eXIf":
			t.Fatalf("captcha PNG contains metadata chunk %s", kind)
		}
		offset += 12 + length
		if kind == "IEND" {
			if offset != len(data) {
				t.Fatal("captcha PNG contains data after IEND")
			}
			break
		}
	}
	return data
}

func TestCaptchaImageIsRasterWithoutAnswerMetadata(t *testing.T) {
	const answer = "aB3xY"
	imageData, err := buildCaptchaImage(answer)
	if err != nil {
		t.Fatal(err)
	}
	captchaRaster(t, imageData)
}

func TestCaptchaImageVariesForTheSameAnswer(t *testing.T) {
	const answer = "aB3xY"
	first, err := buildCaptchaImage(answer)
	if err != nil {
		t.Fatal(err)
	}
	second, err := buildCaptchaImage(answer)
	if err != nil {
		t.Fatal(err)
	}
	if bytes.Equal(captchaRaster(t, first), captchaRaster(t, second)) {
		t.Fatal("repeated captcha rendering produced the same raster")
	}
}

func TestCaptchaImagesRenderIndependentlyInParallel(t *testing.T) {
	const answer = "aB3xY"
	type result struct {
		image string
		err   error
	}
	results := make(chan result, 4)
	for range cap(results) {
		go func() {
			image, err := buildCaptchaImage(answer)
			results <- result{image: image, err: err}
		}()
	}
	seen := make(map[string]bool)
	for range cap(results) {
		r := <-results
		if r.err != nil {
			t.Fatal(r.err)
		}
		captchaRaster(t, r.image)
		if seen[r.image] {
			t.Fatal("concurrent challenges shared a rendered image")
		}
		seen[r.image] = true
	}
}

func TestNewCaptchaVerification(t *testing.T) {
	previous := config.Get()
	if err := store.ResetForTests(); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		if err := store.ResetForTests(); err != nil {
			t.Errorf("reset store: %v", err)
		}
		config.Set(previous)
	})
	config.Set(config.Config{Mode: config.ModeProduction, Data: t.TempDir()})
	if err := store.Initialize(); err != nil {
		t.Fatal(err)
	}

	newChallenge := func(t *testing.T) (string, string) {
		t.Helper()
		id, imageData, err := NewCaptcha()
		if err != nil {
			t.Fatal(err)
		}
		if id == "" {
			t.Fatal("captcha ID is empty")
		}
		var answer string
		if err := store.DB().QueryRow(`SELECT value FROM captcha WHERE id=?`, id).Scan(&answer); err != nil {
			t.Fatal(err)
		}
		if len(answer) != 5 {
			t.Fatalf("captcha answer length = %d; want 5", len(answer))
		}
		captchaRaster(t, imageData)
		return id, answer
	}

	t.Run("accepts uppercase and cannot be reused", func(t *testing.T) {
		id, answer := newChallenge(t)
		if ok, err := VerifyCaptcha(id, strings.ToUpper(answer)); err != nil || !ok {
			t.Fatalf("uppercase captcha verification = %v, %v; want true", ok, err)
		}
		if ok, err := VerifyCaptcha(id, answer); err != nil || ok {
			t.Fatalf("captcha replay = %v, %v; want false", ok, err)
		}
	})
	t.Run("incorrect answer consumes the challenge", func(t *testing.T) {
		id, answer := newChallenge(t)
		if ok, err := VerifyCaptcha(id, "*****"); err != nil || ok {
			t.Fatalf("incorrect captcha verification = %v, %v; want false", ok, err)
		}
		if ok, err := VerifyCaptcha(id, answer); err != nil || ok {
			t.Fatalf("captcha after incorrect attempt = %v, %v; want false", ok, err)
		}
	})
	t.Run("expired answer is rejected", func(t *testing.T) {
		id, answer := newChallenge(t)
		if _, err := store.DB().Exec(`UPDATE captcha SET createTimestamp=? WHERE id=?`, time.Now().Add(-2*time.Minute-time.Second).UnixMilli(), id); err != nil {
			t.Fatal(err)
		}
		if ok, err := VerifyCaptcha(id, answer); err != nil || ok {
			t.Fatalf("expired captcha verification = %v, %v; want false", ok, err)
		}
	})
	t.Run("answer remains valid within two minutes", func(t *testing.T) {
		id, answer := newChallenge(t)
		if _, err := store.DB().Exec(`UPDATE captcha SET createTimestamp=? WHERE id=?`, time.Now().Add(-110*time.Second).UnixMilli(), id); err != nil {
			t.Fatal(err)
		}
		if ok, err := VerifyCaptcha(id, answer); err != nil || !ok {
			t.Fatalf("unexpired captcha verification = %v, %v; want true", ok, err)
		}
	})
	t.Run("unknown challenge is rejected", func(t *testing.T) {
		if ok, err := VerifyCaptcha("missing-captcha", "aB3xY"); err != nil || ok {
			t.Fatalf("unknown captcha verification = %v, %v; want false", ok, err)
		}
	})
}
