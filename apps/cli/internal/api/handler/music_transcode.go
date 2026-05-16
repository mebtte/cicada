package handler

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"sync"
	"time"

	"cicada/internal/config"
	"cicada/internal/ffmpeg"

	"github.com/gin-gonic/gin"
)

const (
	musicTranscodeTimeout  = 3 * time.Minute
	musicSmoothBitrateKbps = 192
)

var (
	musicTranscodeCacheControl = "public, max-age=31536000, immutable"
	musicProbeAudioStream      = ffmpeg.ProbeAudioStream
	musicTranscodeAudio        = ffmpeg.TranscodeAudio
	musicTranscodeInflight     = struct {
		sync.Mutex
		calls map[string]*musicTranscodeCall
	}{
		calls: map[string]*musicTranscodeCall{},
	}
)

type musicTranscodeCall struct {
	done   chan struct{}
	result musicTranscodeResult
}

type musicTranscodeResult struct {
	ServeSource bool
	Err         error
}

type musicTranscodeProfile struct {
	CacheSuffix        string
	ContentType        string
	LosslessSourceOnly bool
	TargetBitrateKbps  int
	FFmpegProfile      ffmpeg.AudioTranscodeProfile
}

func serveMusicAsset(c *gin.Context, filename, sourcePath string) {
	profile, shouldTranscode, valid := parseMusicTranscodeProfile(c.Request.URL.Query())
	if !valid {
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	if !shouldTranscode {
		serveAssetFile(c, sourcePath, filename, "public, max-age=31536000, immutable", "")
		return
	}

	sourceFileInfo, err := os.Stat(sourcePath)
	if err != nil {
		c.AbortWithStatus(http.StatusNotFound)
		return
	}

	cachePath := filepath.Join(
		config.MusicTranscodeCacheDir(),
		fmt.Sprintf("%s_%s", filename, profile.CacheSuffix),
	)
	serveSource, err := ensureMusicTranscodeCache(
		c.Request.Context(),
		sourcePath,
		cachePath,
		sourceFileInfo.ModTime(),
		profile,
	)
	if err != nil {
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	if serveSource {
		serveAssetFile(c, sourcePath, filename, "public, max-age=31536000, immutable", "")
		return
	}
	touchFile(cachePath)
	serveAssetFile(c, cachePath, filepath.Base(cachePath), musicTranscodeCacheControl, profile.ContentType)
}

func parseMusicTranscodeProfile(query url.Values) (musicTranscodeProfile, bool, bool) {
	if len(query) == 0 {
		return musicTranscodeProfile{}, false, true
	}
	for key := range query {
		if key != "codec" && key != "bitrate" {
			return musicTranscodeProfile{}, false, false
		}
	}

	codec, hasCodec, ok := singleQueryValue(query, "codec")
	if !ok || !hasCodec {
		return musicTranscodeProfile{}, false, false
	}
	bitrate, hasBitrate, ok := singleQueryValue(query, "bitrate")
	if !ok {
		return musicTranscodeProfile{}, false, false
	}

	switch codec {
	case "aac":
		if !hasBitrate || bitrate != "192" {
			return musicTranscodeProfile{}, false, false
		}
		return newAACMusicTranscodeProfile(musicSmoothBitrateKbps), true, true
	case "flac":
		if hasBitrate {
			return musicTranscodeProfile{}, false, false
		}
		return musicTranscodeProfile{
			CacheSuffix:        "codec-flac.flac",
			ContentType:        "audio/flac",
			LosslessSourceOnly: true,
			FFmpegProfile: ffmpeg.AudioTranscodeProfile{
				Codec: "flac",
			},
		}, true, true
	default:
		return musicTranscodeProfile{}, false, false
	}
}

func newAACMusicTranscodeProfile(bitrateKbps int) musicTranscodeProfile {
	return musicTranscodeProfile{
		CacheSuffix:       fmt.Sprintf("codec-aac_bitrate-%dk.m4a", bitrateKbps),
		ContentType:       "audio/mp4",
		TargetBitrateKbps: bitrateKbps,
		FFmpegProfile: ffmpeg.AudioTranscodeProfile{
			Codec:   "aac",
			Bitrate: fmt.Sprintf("%dk", bitrateKbps),
		},
	}
}

func applyMusicTranscodeSourceLimits(profile musicTranscodeProfile, streamInfo ffmpeg.AudioStreamInfo) musicTranscodeProfile {
	if profile.FFmpegProfile.Codec != "aac" || profile.TargetBitrateKbps <= 0 || streamInfo.BitRate <= 0 {
		return profile
	}
	if streamInfo.BitRate >= int64(profile.TargetBitrateKbps)*1000 {
		return profile
	}

	effectiveBitrateKbps := int(streamInfo.BitRate / 1000)
	if effectiveBitrateKbps < 1 {
		effectiveBitrateKbps = 1
	}
	profile.FFmpegProfile.Bitrate = fmt.Sprintf("%dk", effectiveBitrateKbps)
	return profile
}

func singleQueryValue(query url.Values, key string) (string, bool, bool) {
	values, ok := query[key]
	if !ok {
		return "", false, true
	}
	if len(values) != 1 || values[0] == "" {
		return "", true, false
	}
	return values[0], true, true
}

func ensureMusicTranscodeCache(ctx context.Context, sourcePath, cachePath string, sourceModTime time.Time, profile musicTranscodeProfile) (bool, error) {
	if isFreshMusicTranscodeCache(cachePath, sourceModTime) {
		return false, nil
	}

	call, owner := beginMusicTranscode(cachePath)
	if !owner {
		select {
		case <-ctx.Done():
			return false, ctx.Err()
		case <-call.done:
			if call.result.Err != nil {
				return false, call.result.Err
			}
			if call.result.ServeSource {
				return true, nil
			}
			if !isFreshMusicTranscodeCache(cachePath, sourceModTime) {
				return false, fmt.Errorf("music transcode cache was not created: %s", cachePath)
			}
			return false, nil
		}
	}

	result := musicTranscodeResult{}
	defer func() {
		finishMusicTranscode(cachePath, call, result)
	}()

	if isFreshMusicTranscodeCache(cachePath, sourceModTime) {
		return false, nil
	}

	effectiveProfile, serveSource, err := resolveMusicTranscodeProfileForSource(context.WithoutCancel(ctx), sourcePath, profile)
	if err != nil {
		result.Err = err
		return false, err
	}
	if serveSource {
		result.ServeSource = true
		return true, nil
	}

	err = generateMusicTranscodeCache(context.WithoutCancel(ctx), sourcePath, cachePath, effectiveProfile.FFmpegProfile)
	result.Err = err
	return false, err
}

func resolveMusicTranscodeProfileForSource(ctx context.Context, sourcePath string, profile musicTranscodeProfile) (musicTranscodeProfile, bool, error) {
	if !profile.LosslessSourceOnly && profile.TargetBitrateKbps <= 0 {
		return profile, false, nil
	}

	streamInfo, err := musicProbeAudioStream(ctx, sourcePath)
	if err != nil {
		return profile, false, err
	}
	if profile.LosslessSourceOnly && !streamInfo.Lossless() {
		return profile, true, nil
	}
	return applyMusicTranscodeSourceLimits(profile, streamInfo), false, nil
}

func beginMusicTranscode(cachePath string) (*musicTranscodeCall, bool) {
	musicTranscodeInflight.Lock()
	defer musicTranscodeInflight.Unlock()

	if call, ok := musicTranscodeInflight.calls[cachePath]; ok {
		return call, false
	}

	call := &musicTranscodeCall{done: make(chan struct{})}
	musicTranscodeInflight.calls[cachePath] = call
	return call, true
}

func finishMusicTranscode(cachePath string, call *musicTranscodeCall, result musicTranscodeResult) {
	musicTranscodeInflight.Lock()
	defer musicTranscodeInflight.Unlock()

	call.result = result
	if musicTranscodeInflight.calls[cachePath] == call {
		delete(musicTranscodeInflight.calls, cachePath)
	}
	close(call.done)
}

func generateMusicTranscodeCache(ctx context.Context, sourcePath, cachePath string, profile ffmpeg.AudioTranscodeProfile) error {
	if err := os.MkdirAll(filepath.Dir(cachePath), 0755); err != nil {
		return err
	}

	transcodeCtx, cancel := context.WithTimeout(ctx, musicTranscodeTimeout)
	defer cancel()

	tmpPath := cachePath + ".tmp"
	_ = os.Remove(tmpPath)
	if err := musicTranscodeAudio(transcodeCtx, sourcePath, tmpPath, profile); err != nil {
		_ = os.Remove(tmpPath)
		return err
	}
	if err := os.Rename(tmpPath, cachePath); err != nil {
		_ = os.Remove(tmpPath)
		return err
	}
	return nil
}

func isFreshMusicTranscodeCache(cachePath string, sourceModTime time.Time) bool {
	info, err := os.Stat(cachePath)
	if err != nil || info.IsDir() {
		return false
	}
	return !info.ModTime().Before(sourceModTime)
}

func touchFile(path string) {
	now := time.Now()
	_ = os.Chtimes(path, now, now)
}
