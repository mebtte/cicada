package handler

import (
	"context"
	"crypto/md5"
	"errors"
	"fmt"
	"image"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"time"

	"cicada/internal/api"
	"cicada/internal/api/apperr"
	"cicada/internal/api/middleware"
	"cicada/internal/config"
	"cicada/internal/musicasset"

	"github.com/gabriel-vasile/mimetype"
	"github.com/gin-gonic/gin"
)

type initPartialUploadBody struct {
	AssetType string `json:"assetType" binding:"required"`
	Size      int64  `json:"size" binding:"required"`
	FileHash  string `json:"fileHash" binding:"required"`
	ChunkSize int64  `json:"chunkSize" binding:"required"`
	Filename  string `json:"filename"`
}

// fileHashHex must be a sha256 hex string (64 chars).
var fileHashRegexp = regexp.MustCompile(`^[0-9a-fA-F]{64}$`)

// InitPartialUpload creates or resumes a chunked upload session for the given
// file.
func InitPartialUpload(c *gin.Context) {
	user := middleware.GetUser(c)
	if user == nil {
		api.Fail(c, apperr.NotAuthorized)
		return
	}

	var body initPartialUploadBody
	if err := c.ShouldBindJSON(&body); err != nil {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	if body.Size <= 0 || body.ChunkSize <= 0 || body.ChunkSize > musicasset.PartialUploadMaxChunkSize {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	if !fileHashRegexp.MatchString(body.FileHash) {
		api.Fail(c, apperr.WrongParameter)
		return
	}

	at := config.AssetType(body.AssetType)
	maxSize, ok := config.AssetMaxSize(at)
	if !ok {
		api.Fail(c, apperr.WrongParameter)
		return
	}
	if body.Size > maxSize {
		api.Fail(c, apperr.AssetOversize)
		return
	}

	uploadID := musicasset.ComputeUploadID(user.ID, string(at), body.FileHash, body.Size)

	meta := musicasset.PartialUploadMeta{
		UploadID:  uploadID,
		UserID:    user.ID,
		AssetType: string(at),
		Size:      body.Size,
		FileHash:  body.FileHash,
		ChunkSize: body.ChunkSize,
		Filename:  body.Filename,
	}
	stored, err := musicasset.CreateOrResumeSession(meta)
	if err != nil {
		if errors.Is(err, musicasset.ErrSessionConflict) {
			api.Fail(c, apperr.PartialUploadHashMismatch)
			return
		}
		api.Fail(c, apperr.ServerError)
		return
	}
	api.OK(c, gin.H{
		"uploadId":      stored.UploadID,
		"receivedBytes": stored.ReceivedBytes,
		"chunkSize":     stored.ChunkSize,
		"completed":     false,
	})
}

// GetPartialUpload returns the session's current ReceivedBytes so callers can
// resume after a process restart.
func GetPartialUpload(c *gin.Context) {
	user := middleware.GetUser(c)
	if user == nil {
		api.Fail(c, apperr.NotAuthorized)
		return
	}
	uploadID := c.Param("uploadId")
	meta, err := musicasset.ReadSession(uploadID)
	if err != nil {
		if os.IsNotExist(err) {
			api.Fail(c, apperr.PartialUploadNotExisted)
			return
		}
		api.Fail(c, apperr.ServerError)
		return
	}
	if meta.UserID != user.ID {
		api.Fail(c, apperr.PartialUploadOwnerMismatch)
		return
	}
	api.OK(c, gin.H{
		"uploadId":      meta.UploadID,
		"size":          meta.Size,
		"receivedBytes": meta.ReceivedBytes,
		"chunkSize":     meta.ChunkSize,
		"updatedAt":     meta.UpdatedAt,
	})
}

var contentRangeRegexp = regexp.MustCompile(`^bytes (\d+)-(\d+)/(\d+)$`)

// PutPartialUploadChunk appends a single chunk at the offset declared by
// Content-Range. Strictly sequential: start must equal current ReceivedBytes.
func PutPartialUploadChunk(c *gin.Context) {
	user := middleware.GetUser(c)
	if user == nil {
		api.Fail(c, apperr.NotAuthorized)
		return
	}
	uploadID := c.Param("uploadId")

	matches := contentRangeRegexp.FindStringSubmatch(c.GetHeader("Content-Range"))
	if matches == nil {
		api.Fail(c, apperr.PartialUploadRangeInvalid)
		return
	}
	start, _ := strconv.ParseInt(matches[1], 10, 64)
	end, _ := strconv.ParseInt(matches[2], 10, 64)
	total, _ := strconv.ParseInt(matches[3], 10, 64)
	if start < 0 || end < start || end >= total {
		api.Fail(c, apperr.PartialUploadRangeInvalid)
		return
	}
	chunkLen := end - start + 1
	if chunkLen > musicasset.PartialUploadMaxChunkSize {
		api.Fail(c, apperr.PartialUploadRangeInvalid)
		return
	}

	// Cap reads at the declared chunk length to prevent oversized bodies from
	// being silently absorbed.
	body := http.MaxBytesReader(c.Writer, c.Request.Body, chunkLen)
	chunk, err := io.ReadAll(body)
	if err != nil {
		api.Fail(c, apperr.PartialUploadRangeInvalid)
		return
	}
	if int64(len(chunk)) != chunkLen {
		api.Fail(c, apperr.PartialUploadRangeInvalid)
		return
	}

	meta, err := musicasset.AppendChunk(uploadID, user.ID, start, chunk)
	if err != nil {
		switch {
		case os.IsNotExist(err):
			api.Fail(c, apperr.PartialUploadNotExisted)
		case errors.Is(err, musicasset.ErrOwnerMismatch):
			api.Fail(c, apperr.PartialUploadOwnerMismatch)
		case errors.Is(err, musicasset.ErrRangeOutOfOrder),
			errors.Is(err, musicasset.ErrRangeOverflow):
			api.Fail(c, apperr.PartialUploadRangeInvalid)
		default:
			api.Fail(c, apperr.ServerError)
		}
		return
	}
	if meta.Size != total {
		api.Fail(c, apperr.PartialUploadRangeInvalid)
		return
	}
	api.OK(c, gin.H{"receivedBytes": meta.ReceivedBytes})
}

// CompletePartialUpload validates the assembled payload (size + sha256 +
// MIME / audio stream check), then renames it to the final asset path.
func CompletePartialUpload(c *gin.Context) {
	user := middleware.GetUser(c)
	if user == nil {
		api.Fail(c, apperr.NotAuthorized)
		return
	}
	uploadID := c.Param("uploadId")

	meta, err := musicasset.ReadSession(uploadID)
	if err != nil {
		if os.IsNotExist(err) {
			api.Fail(c, apperr.PartialUploadNotExisted)
			return
		}
		api.Fail(c, apperr.ServerError)
		return
	}
	if meta.UserID != user.ID {
		api.Fail(c, apperr.PartialUploadOwnerMismatch)
		return
	}
	if meta.ReceivedBytes != meta.Size {
		api.Fail(c, apperr.PartialUploadRangeInvalid)
		return
	}

	at := config.AssetType(meta.AssetType)
	acceptMIMEs, ok := config.AssetAcceptMIME[at]
	if !ok {
		api.Fail(c, apperr.WrongParameter)
		return
	}

	srcPath := filepath.Join(musicasset.SessionDir(uploadID), musicasset.PartialUploadDataFilename)

	// Validate MIME / audio stream against the on-disk file. Music uses an
	// ffmpeg probe instead of MIME because the sniff list is not exhaustive
	// for the formats we accept.
	mt, err := mimetype.DetectFile(srcPath)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	mimeStr := trimMIMEParams(mt.String())
	if at == config.AssetTypeMusic {
		probeCtx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
		ok, ferr := probeUploadedMusicHasAudioStream(probeCtx, srcPath)
		cancel()
		if ferr != nil {
			_ = musicasset.CancelSession(uploadID)
			api.Fail(c, apperr.ServerError)
			return
		}
		// MP3 MIME is used as a narrow fallback when ffprobe misses a file that
		// the sniffer still recognises as MP3.
		if !ok && !isTrustedMusicMIMEFallback(mimeStr) {
			_ = musicasset.CancelSession(uploadID)
			api.Fail(c, apperr.WrongAssetType)
			return
		}
	} else {
		valid := false
		for _, m := range acceptMIMEs {
			if m == mimeStr {
				valid = true
				break
			}
		}
		if !valid {
			_ = musicasset.CancelSession(uploadID)
			api.Fail(c, apperr.WrongAssetType)
			return
		}
		if !isSquareImageFile(srcPath) {
			_ = musicasset.CancelSession(uploadID)
			api.Fail(c, apperr.WrongParameter)
			return
		}
	}

	// Final filename mirrors the legacy single-shot uploader: md5(content)+ext.
	contentMD5, err := md5File(srcPath)
	if err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	ext := filepath.Ext(meta.Filename)
	if ext == "" {
		ext = "." + mt.Extension()
	}
	finalName := contentMD5 + ext
	destDir, dest := config.AssetPath(at, finalName)
	if err := os.MkdirAll(destDir, 0755); err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}

	if _, statErr := os.Stat(dest); statErr == nil {
		// Same content has already been finalised - drop the duplicate payload
		// and reuse the existing asset.
		_ = musicasset.CancelSession(uploadID)
	} else {
		if _, err := musicasset.FinaliseSession(uploadID, user.ID, dest); err != nil {
			switch {
			case errors.Is(err, musicasset.ErrHashMismatch):
				api.Fail(c, apperr.PartialUploadHashMismatch)
			case errors.Is(err, musicasset.ErrIncomplete):
				api.Fail(c, apperr.PartialUploadRangeInvalid)
			case errors.Is(err, musicasset.ErrOwnerMismatch):
				api.Fail(c, apperr.PartialUploadOwnerMismatch)
			default:
				api.Fail(c, apperr.ServerError)
			}
			return
		}
	}
	api.OK(c, gin.H{
		"id":   finalName,
		"path": config.AssetPublicURL(finalName, at),
	})
}

// CancelPartialUpload removes the session unconditionally. Idempotent.
func CancelPartialUpload(c *gin.Context) {
	user := middleware.GetUser(c)
	if user == nil {
		api.Fail(c, apperr.NotAuthorized)
		return
	}
	uploadID := c.Param("uploadId")

	meta, err := musicasset.ReadSession(uploadID)
	if err != nil {
		if os.IsNotExist(err) {
			api.OK(c, gin.H{"removed": false})
			return
		}
		api.Fail(c, apperr.ServerError)
		return
	}
	if meta.UserID != user.ID {
		api.Fail(c, apperr.PartialUploadOwnerMismatch)
		return
	}
	if err := musicasset.CancelSession(uploadID); err != nil {
		api.Fail(c, apperr.ServerError)
		return
	}
	api.OK(c, gin.H{"removed": true})
}

func md5File(path string) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()
	h := md5.New()
	if _, err := io.Copy(h, f); err != nil {
		return "", err
	}
	return fmt.Sprintf("%x", h.Sum(nil)), nil
}

func isSquareImageFile(path string) bool {
	f, err := os.Open(path)
	if err != nil {
		return false
	}
	defer f.Close()
	// Decoder side effects (jpeg etc.) are registered in upload.go.
	cfg, _, err := image.DecodeConfig(f)
	if err != nil {
		return false
	}
	diff := cfg.Width - cfg.Height
	if diff < 0 {
		diff = -diff
	}
	return diff < 5
}
