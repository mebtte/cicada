package handler

import (
	"context"
	"crypto/md5"
	"errors"
	"fmt"
	"image"
	_ "image/jpeg"
	"io"
	"net/http"
	"os"
	"time"

	"cicada/internal/api"
	"cicada/internal/api/apperr"
	"cicada/internal/api/middleware"
	"cicada/internal/config"
	"cicada/internal/ffmpeg"

	"github.com/gabriel-vasile/mimetype"
	"github.com/gin-gonic/gin"
)

const (
	directUploadBodyMaxSize     int64 = 64 * 1024 * 1024
	directUploadMultipartMemory int64 = 8 * 1024 * 1024
)

func UploadAsset(c *gin.Context) {
	_ = middleware.GetUser(c) // ensure authenticated

	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, directUploadBodyMaxSize)
	if err := c.Request.ParseMultipartForm(directUploadMultipartMemory); err != nil {
		var maxBytesErr *http.MaxBytesError
		if errors.As(err, &maxBytesErr) {
			api.Fail(c, apperr.AssetOversize)
			return
		}
		api.Fail(c, apperr.WrongParameter)
		return
	}
	if c.Request.MultipartForm != nil {
		defer c.Request.MultipartForm.RemoveAll()
	}

	assetTypeStr := c.PostForm("assetType")
	if assetTypeStr == "" {
		api.Fail(c, apperr.WrongParameter)
		return
	}

	at := config.AssetType(assetTypeStr)
	acceptMIMEs, ok := config.AssetAcceptMIME[at]
	if !ok {
		api.Fail(c, apperr.WrongParameter)
		return
	}

	fh, err := c.FormFile("asset")
	if err != nil {
		api.Fail(c, apperr.WrongParameter)
		return
	}

	// Early gate: when mime is still unknown the music asset falls back to
	// max(audio, video) so an oversized request is rejected before the body
	// is read. The category-specific cap is re-checked once MIME is sniffed.
	maxSize, ok := config.AssetMaxSize(at, "")
	if !ok {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	if fh.Size > maxSize {
		api.Fail(c, apperr.AssetOversize)
		return
	}

	f, err := fh.Open()
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	defer f.Close()

	data, err := io.ReadAll(f)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}

	// detect MIME
	mt := mimetype.Detect(data)
	mimeStr := trimMIMEParams(mt.String())
	if categoryMax, ok := config.AssetMaxSize(at, mimeStr); ok {
		if int64(len(data)) > categoryMax {
			api.Fail(c, apperr.AssetOversize)
			return
		}
	}
	if at == config.AssetTypeMusic {
		validAudio, err := uploadedMusicHasAudioStream(
			c.Request.Context(),
			data,
			mimeStr,
		)
		if err != nil {
			api.Fail(c, apperr.ServerError)
			return
		}
		if !validAudio {
			api.Fail(c, apperr.WrongAssetType)
			return
		}
	} else {
		validMIME := false
		for _, m := range acceptMIMEs {
			if m == mimeStr {
				validMIME = true
				break
			}
		}
		if !validMIME {
			api.Fail(c, apperr.WrongAssetType)
			return
		}

		if !isSquareImage(data) {
			api.Fail(c, apperr.WrongParameter)
			return
		}
	}

	// generate filename: md5(data) + ext
	hash := md5.Sum(data)
	// Extension is derived from the sniffed MIME, never from fh.Filename, so
	// the on-disk name (and thus the response Content-Type) cannot be coerced
	// into HTML/SVG by a polyglot upload.
	ext := safeAssetExt(mimeStr)
	if ext == "" {
		ext = "." + mt.Extension()
	}
	filename := fmt.Sprintf("%x%s", hash, ext)
	destDir, dest := config.AssetPath(at, filename)
	if err := os.MkdirAll(destDir, 0755); err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}

	if err := os.WriteFile(dest, data, 0644); err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}

	api.OK(c, gin.H{
		"id":   filename,
		"path": config.AssetPublicURL(filename, at),
	})
}

var probeUploadedMusicHasAudioStream = ffmpeg.HasAudioStream

func trimMIMEParams(mimeStr string) string {
	for i, ch := range mimeStr {
		if ch == ';' {
			return mimeStr[:i]
		}
	}
	return mimeStr
}

func isTrustedMusicMIMEFallback(mimeStr string) bool {
	switch mimeStr {
	case "audio/mpeg", "audio/mp3", "audio/x-mpeg":
		return true
	default:
		return false
	}
}

func uploadedMusicHasAudioStream(
	ctx context.Context,
	data []byte,
	mimeStr string,
) (bool, error) {
	if err := os.MkdirAll(config.CacheDir(), 0755); err != nil {
		return false, err
	}
	tmp, err := os.CreateTemp(config.CacheDir(), "upload_music_*")
	if err != nil {
		return false, err
	}
	tmpPath := tmp.Name()
	defer os.Remove(tmpPath)

	if _, err := tmp.Write(data); err != nil {
		tmp.Close()
		return false, err
	}
	if err := tmp.Close(); err != nil {
		return false, err
	}

	probeCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()
	ok, err := probeUploadedMusicHasAudioStream(probeCtx, tmpPath)
	if err != nil || ok {
		return ok, err
	}
	// Some valid MP3 files can be rejected by the probe path, but the MIME
	// sniffer can still identify their MP3 frame/ID3 signature.
	return isTrustedMusicMIMEFallback(mimeStr), nil
}

func isSquareImage(data []byte) bool {
	cfg, _, err := image.DecodeConfig(newBytesReader(data))
	if err != nil {
		return false
	}
	diff := cfg.Width - cfg.Height
	if diff < 0 {
		diff = -diff
	}
	return diff < 5
}

// newBytesReader wraps a byte slice in an io.Reader that supports Seek.
type bytesReader struct {
	data []byte
	pos  int
}

func newBytesReader(data []byte) *bytesReader { return &bytesReader{data: data} }

func (b *bytesReader) Read(p []byte) (int, error) {
	if b.pos >= len(b.data) {
		return 0, io.EOF
	}
	n := copy(p, b.data[b.pos:])
	b.pos += n
	return n, nil
}
