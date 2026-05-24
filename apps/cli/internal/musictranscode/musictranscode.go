package musictranscode

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"cicada/internal/config"
	"cicada/internal/ffmpeg"
)

const (
	TranscodeTimeout   = 3 * time.Minute
	SmoothBitrateKbps  = 192
	SmoothContentType  = "audio/mp4"
	SourceContentType  = "audio/flac"
	cacheVersion       = "v1"
	smoothCacheSuffix  = "__quality-smooth_" + cacheVersion + ".m4a"
	sourceCacheSuffix  = "__quality-source_" + cacheVersion + ".audio"
	sourceMetaSuffix   = sourceCacheSuffix + ".json"
	minimumBitrateKbps = 1
)

type Quality string

const (
	QualitySmooth Quality = "smooth"
	QualitySource Quality = "source"
)

type Result struct {
	Path        string
	Name        string
	ContentType string
	Generated   bool
}

type CacheEntry struct {
	Asset   string
	Quality Quality
	Sidecar bool
}

type SourceCacheMetadata struct {
	ContentType string `json:"contentType"`
}

type transcodeCall struct {
	done   chan struct{}
	result Result
	err    error
}

type generationPlan struct {
	contentType string
	copySource  bool
	profile     ffmpeg.AudioTranscodeProfile
}

var (
	probeAudioStream = ffmpeg.ProbeAudioStream
	transcodeAudio   = ffmpeg.TranscodeAudio
	inflight         = struct {
		sync.Mutex
		calls map[string]*transcodeCall
	}{
		calls: map[string]*transcodeCall{},
	}
)

func ParseQuality(query url.Values) (Quality, bool, bool) {
	values, ok := query["quality"]
	if !ok {
		return "", false, true
	}
	if len(values) != 1 || values[0] == "" {
		return "", true, false
	}

	quality := Quality(values[0])
	switch quality {
	case QualitySmooth, QualitySource:
		return quality, true, true
	default:
		return "", true, false
	}
}

func CacheName(asset string, quality Quality) string {
	switch quality {
	case QualitySmooth:
		return asset + smoothCacheSuffix
	case QualitySource:
		return asset + sourceCacheSuffix
	default:
		return ""
	}
}

func SourceCacheMetadataName(asset string) string {
	return asset + sourceMetaSuffix
}

func CachePath(asset string, quality Quality) string {
	return filepath.Join(config.MusicTranscodeCacheDir(), CacheName(asset, quality))
}

func SourceCacheMetadataPath(asset string) string {
	return filepath.Join(config.MusicTranscodeCacheDir(), SourceCacheMetadataName(asset))
}

func ParseCacheFilename(name string) (CacheEntry, bool) {
	if asset, ok := strings.CutSuffix(name, smoothCacheSuffix); ok && asset != "" {
		return CacheEntry{Asset: asset, Quality: QualitySmooth}, true
	}
	if asset, ok := strings.CutSuffix(name, sourceCacheSuffix); ok && asset != "" {
		return CacheEntry{Asset: asset, Quality: QualitySource}, true
	}
	if asset, ok := strings.CutSuffix(name, sourceMetaSuffix); ok && asset != "" {
		return CacheEntry{Asset: asset, Quality: QualitySource, Sidecar: true}, true
	}
	return CacheEntry{}, false
}

func Ensure(ctx context.Context, asset string, quality Quality) (Result, error) {
	if asset == "" {
		return Result{}, fmt.Errorf("empty music asset")
	}
	if quality != QualitySmooth && quality != QualitySource {
		return Result{}, fmt.Errorf("unsupported music transcode quality %q", quality)
	}
	if result, ok := cachedResult(asset, quality); ok {
		return result, nil
	}

	cachePath := CachePath(asset, quality)
	call, owner := beginTranscode(cachePath)
	if !owner {
		select {
		case <-ctx.Done():
			return Result{}, ctx.Err()
		case <-call.done:
			return call.result, call.err
		}
	}

	result := Result{}
	var err error
	defer func() {
		finishTranscode(cachePath, call, result, err)
	}()

	if cached, ok := cachedResult(asset, quality); ok {
		return cached, nil
	}

	result, err = generateCache(context.WithoutCancel(ctx), asset, quality)
	return result, err
}

func ReadSourceCacheMetadata(asset string) (SourceCacheMetadata, error) {
	return readSourceCacheMetadata(SourceCacheMetadataPath(asset))
}

func cachedResult(asset string, quality Quality) (Result, bool) {
	cachePath := CachePath(asset, quality)
	if !isRegularFile(cachePath) {
		return Result{}, false
	}

	switch quality {
	case QualitySmooth:
		return Result{
			Path:        cachePath,
			Name:        CacheName(asset, quality),
			ContentType: SmoothContentType,
		}, true
	case QualitySource:
		meta, err := readSourceCacheMetadata(SourceCacheMetadataPath(asset))
		if err != nil {
			return Result{}, false
		}
		return Result{
			Path:        cachePath,
			Name:        CacheName(asset, quality),
			ContentType: meta.ContentType,
		}, true
	default:
		return Result{}, false
	}
}

func beginTranscode(cachePath string) (*transcodeCall, bool) {
	inflight.Lock()
	defer inflight.Unlock()

	if call, ok := inflight.calls[cachePath]; ok {
		return call, false
	}

	call := &transcodeCall{done: make(chan struct{})}
	inflight.calls[cachePath] = call
	return call, true
}

func finishTranscode(cachePath string, call *transcodeCall, result Result, err error) {
	inflight.Lock()
	defer inflight.Unlock()

	call.result = result
	call.err = err
	if inflight.calls[cachePath] == call {
		delete(inflight.calls, cachePath)
	}
	close(call.done)
}

func generateCache(ctx context.Context, asset string, quality Quality) (Result, error) {
	sourcePath := filepath.Join(config.AssetDir(config.AssetTypeMusic), asset)
	if _, err := os.Stat(sourcePath); err != nil {
		return Result{}, err
	}
	if err := os.MkdirAll(config.MusicTranscodeCacheDir(), 0755); err != nil {
		return Result{}, err
	}

	transcodeCtx, cancel := context.WithTimeout(ctx, TranscodeTimeout)
	defer cancel()

	streamInfo, err := probeAudioStream(transcodeCtx, sourcePath)
	if err != nil {
		return Result{}, err
	}
	plan, err := buildGenerationPlan(quality, sourcePath, streamInfo)
	if err != nil {
		return Result{}, err
	}

	cachePath := CachePath(asset, quality)
	tmpPath := cachePath + ".tmp"
	_ = os.Remove(tmpPath)

	// 缓存写入先落到临时文件, 确认完整后再替换正式缓存, 避免请求读到半成品。
	if plan.copySource {
		if err := linkOrCopyFile(sourcePath, tmpPath); err != nil {
			_ = os.Remove(tmpPath)
			return Result{}, err
		}
	} else if err := transcodeAudio(transcodeCtx, sourcePath, tmpPath, plan.profile); err != nil {
		_ = os.Remove(tmpPath)
		return Result{}, err
	}

	if quality == QualitySource {
		if err := writeSourceCache(asset, cachePath, tmpPath, plan.contentType); err != nil {
			return Result{}, err
		}
	} else if err := replaceFile(tmpPath, cachePath); err != nil {
		_ = os.Remove(tmpPath)
		return Result{}, err
	}

	return Result{
		Path:        cachePath,
		Name:        CacheName(asset, quality),
		ContentType: plan.contentType,
		Generated:   true,
	}, nil
}

func buildGenerationPlan(quality Quality, sourcePath string, streamInfo ffmpeg.AudioStreamInfo) (generationPlan, error) {
	switch quality {
	case QualitySmooth:
		return generationPlan{
			contentType: SmoothContentType,
			profile: ffmpeg.AudioTranscodeProfile{
				Codec:   "aac",
				Bitrate: smoothBitrate(streamInfo),
			},
		}, nil
	case QualitySource:
		if streamInfo.Lossless() {
			return generationPlan{
				contentType: SourceContentType,
				profile: ffmpeg.AudioTranscodeProfile{
					Codec: "flac",
				},
			}, nil
		}
		if contentType, ok := playableLossySourceContentType(sourcePath, streamInfo); ok {
			return generationPlan{
				contentType: contentType,
				copySource:  true,
			}, nil
		}
		bitrate, err := sourceBitrate(streamInfo)
		if err != nil {
			return generationPlan{}, err
		}
		return generationPlan{
			contentType: SmoothContentType,
			profile: ffmpeg.AudioTranscodeProfile{
				Codec:   "aac",
				Bitrate: bitrate,
			},
		}, nil
	default:
		return generationPlan{}, fmt.Errorf("unsupported music transcode quality %q", quality)
	}
}

func smoothBitrate(streamInfo ffmpeg.AudioStreamInfo) string {
	if streamInfo.Lossless() || streamInfo.BitRate <= 0 {
		return fmt.Sprintf("%dk", SmoothBitrateKbps)
	}
	kbps := bitrateKbps(streamInfo.BitRate)
	if kbps > SmoothBitrateKbps {
		kbps = SmoothBitrateKbps
	}
	return fmt.Sprintf("%dk", kbps)
}

func sourceBitrate(streamInfo ffmpeg.AudioStreamInfo) (string, error) {
	if streamInfo.BitRate <= 0 {
		return "", errors.New("source bitrate is required for lossy source transcode")
	}
	return fmt.Sprintf("%dk", bitrateKbps(streamInfo.BitRate)), nil
}

func bitrateKbps(bitRate int64) int {
	kbps := int(bitRate / 1000)
	if kbps < minimumBitrateKbps {
		return minimumBitrateKbps
	}
	return kbps
}

func playableLossySourceContentType(sourcePath string, streamInfo ffmpeg.AudioStreamInfo) (string, bool) {
	ext := strings.ToLower(filepath.Ext(sourcePath))
	switch streamInfo.CodecName {
	case "mp3":
		return "audio/mpeg", true
	case "aac":
		if ext == ".m4a" || ext == ".mp4" {
			return "audio/mp4", true
		}
	}
	return "", false
}

func writeSourceCache(asset, cachePath, tmpPath, contentType string) error {
	metaPath := SourceCacheMetadataPath(asset)
	tmpMetaPath := metaPath + ".tmp"
	_ = os.Remove(tmpMetaPath)

	meta := SourceCacheMetadata{ContentType: contentType}
	data, err := json.Marshal(meta)
	if err != nil {
		_ = os.Remove(tmpPath)
		return err
	}
	data = append(data, '\n')
	if err := os.WriteFile(tmpMetaPath, data, 0644); err != nil {
		_ = os.Remove(tmpPath)
		return err
	}

	if err := replaceFile(tmpPath, cachePath); err != nil {
		_ = os.Remove(tmpPath)
		_ = os.Remove(tmpMetaPath)
		return err
	}
	if err := replaceFile(tmpMetaPath, metaPath); err != nil {
		_ = os.Remove(cachePath)
		_ = os.Remove(tmpMetaPath)
		_ = os.Remove(metaPath)
		return err
	}
	return nil
}

func readSourceCacheMetadata(path string) (SourceCacheMetadata, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return SourceCacheMetadata{}, err
	}
	var meta SourceCacheMetadata
	if err := json.Unmarshal(data, &meta); err != nil {
		return SourceCacheMetadata{}, err
	}
	if meta.ContentType == "" {
		return SourceCacheMetadata{}, errors.New("missing source cache content type")
	}
	return meta, nil
}

func linkOrCopyFile(sourcePath, tmpPath string) error {
	if err := os.Link(sourcePath, tmpPath); err == nil {
		return nil
	}

	in, err := os.Open(sourcePath)
	if err != nil {
		return err
	}
	defer in.Close()

	out, err := os.OpenFile(tmpPath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0644)
	if err != nil {
		return err
	}

	if _, err := io.Copy(out, in); err != nil {
		_ = out.Close()
		return err
	}
	return out.Close()
}

func replaceFile(tmpPath, targetPath string) error {
	if err := os.Rename(tmpPath, targetPath); err == nil {
		return nil
	}
	_ = os.Remove(targetPath)
	return os.Rename(tmpPath, targetPath)
}

func isRegularFile(path string) bool {
	info, err := os.Stat(path)
	return err == nil && info.Mode().IsRegular()
}
