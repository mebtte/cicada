package imagethumb

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"image/jpeg"

	"github.com/disintegration/imaging"
)

const (
	Size        = 16
	jpegQuality = 32
)

func DataURLFromFile(path string) (string, error) {
	src, err := imaging.Open(path)
	if err != nil {
		return "", fmt.Errorf("open image: %w", err)
	}

	thumb := imaging.Fill(src, Size, Size, imaging.Center, imaging.Lanczos)
	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, thumb, &jpeg.Options{Quality: jpegQuality}); err != nil {
		return "", fmt.Errorf("encode thumbnail: %w", err)
	}
	return "data:image/jpeg;base64," + base64.StdEncoding.EncodeToString(buf.Bytes()), nil
}
