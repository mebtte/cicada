package musictranscode

import (
	"cicada/internal/ffmpeg"
	"errors"
	"fmt"
	"path/filepath"
	"strings"
)

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
