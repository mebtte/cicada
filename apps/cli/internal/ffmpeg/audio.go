package ffmpeg

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os/exec"
	"strings"
)

type AudioTranscodeProfile struct {
	Codec   string
	Bitrate string
}

type AudioMetadata struct {
	Title  string
	Artist string
	Date   string
	Lyrics string
}

type AudioStreamInfo struct {
	CodecName string
	BitRate   int64
}

func HasAudioStream(ctx context.Context, path string) (bool, error) {
	paths, err := PrepareEmbeddedTools()
	if err != nil {
		return false, err
	}

	output, err := exec.CommandContext(
		ctx,
		paths.FFprobe,
		"-v", "error",
		"-select_streams", "a:0",
		"-show_entries", "stream=codec_type",
		"-of", "csv=p=0",
		path,
	).Output()
	if err != nil {
		var exitErr *exec.ExitError
		if errors.As(err, &exitErr) {
			return false, nil
		}
		return false, err
	}
	return strings.TrimSpace(string(output)) == "audio", nil
}

func ProbeAudioStream(ctx context.Context, path string) (AudioStreamInfo, error) {
	paths, err := PrepareEmbeddedTools()
	if err != nil {
		return AudioStreamInfo{}, err
	}

	output, err := exec.CommandContext(
		ctx,
		paths.FFprobe,
		"-v", "error",
		"-select_streams", "a:0",
		"-show_entries", "stream=codec_name,bit_rate:format=bit_rate",
		"-of", "json",
		path,
	).Output()
	if err != nil {
		if ctx.Err() != nil {
			return AudioStreamInfo{}, ctx.Err()
		}
		return AudioStreamInfo{}, err
	}

	var result struct {
		Streams []struct {
			CodecName string `json:"codec_name"`
			BitRate   string `json:"bit_rate"`
		} `json:"streams"`
		Format struct {
			BitRate string `json:"bit_rate"`
		} `json:"format"`
	}
	if err := json.Unmarshal(output, &result); err != nil {
		return AudioStreamInfo{}, err
	}
	if len(result.Streams) == 0 {
		return AudioStreamInfo{}, errors.New("audio stream not found")
	}

	bitRate := parseBitRate(result.Streams[0].BitRate)
	if bitRate == 0 {
		bitRate = parseBitRate(result.Format.BitRate)
	}
	return AudioStreamInfo{
		CodecName: strings.ToLower(result.Streams[0].CodecName),
		BitRate:   bitRate,
	}, nil
}

func (info AudioStreamInfo) Lossless() bool {
	switch info.CodecName {
	case "flac", "alac", "ape", "tta", "wavpack", "mlp", "truehd":
		return true
	case "pcm_s16le", "pcm_s24le", "pcm_s32le", "pcm_f32le", "pcm_f64le",
		"pcm_s16be", "pcm_s24be", "pcm_s32be", "pcm_f32be", "pcm_f64be":
		return true
	default:
		return false
	}
}

func parseBitRate(value string) int64 {
	var n int64
	if _, err := fmt.Sscanf(value, "%d", &n); err != nil {
		return 0
	}
	return n
}

func TranscodeAudio(ctx context.Context, inputPath, outputPath string, profile AudioTranscodeProfile) error {
	paths, err := PrepareEmbeddedTools()
	if err != nil {
		return err
	}

	args := []string{
		"-y",
		"-i", inputPath,
		"-vn",
		"-map", "0:a:0",
		"-map_metadata", "-1",
		"-map_chapters", "-1",
	}
	switch profile.Codec {
	case "aac":
		if profile.Bitrate == "" {
			return fmt.Errorf("missing aac bitrate")
		}
		args = append(args,
			"-c:a", "aac",
			"-b:a", profile.Bitrate,
			"-movflags", "+faststart",
			"-f", "mp4",
		)
	case "flac":
		args = append(args,
			"-c:a", "flac",
			"-compression_level", "8",
			"-f", "flac",
		)
	default:
		return fmt.Errorf("unsupported audio codec %q", profile.Codec)
	}
	args = append(args, outputPath)

	output, err := exec.CommandContext(ctx, paths.FFmpeg, args...).CombinedOutput()
	if err != nil {
		if ctx.Err() != nil {
			return ctx.Err()
		}
		return fmt.Errorf("%w: %s", err, strings.TrimSpace(string(output)))
	}
	return nil
}

func RewriteAudioMetadata(ctx context.Context, inputPath, outputPath string, metadata AudioMetadata, coverPath string) error {
	err := rewriteAudioMetadata(ctx, inputPath, outputPath, metadata, coverPath)
	if err != nil && coverPath != "" {
		return rewriteAudioMetadata(ctx, inputPath, outputPath, metadata, "")
	}
	return err
}

func rewriteAudioMetadata(ctx context.Context, inputPath, outputPath string, metadata AudioMetadata, coverPath string) error {
	paths, err := PrepareEmbeddedTools()
	if err != nil {
		return err
	}

	args := rewriteAudioMetadataArgs(inputPath, outputPath, metadata, coverPath)
	output, err := exec.CommandContext(ctx, paths.FFmpeg, args...).CombinedOutput()
	if err != nil {
		if ctx.Err() != nil {
			return ctx.Err()
		}
		return fmt.Errorf("%w: %s", err, strings.TrimSpace(string(output)))
	}
	return nil
}

func rewriteAudioMetadataArgs(inputPath, outputPath string, metadata AudioMetadata, coverPath string) []string {
	args := []string{
		"-y",
		"-i", inputPath,
	}
	if coverPath != "" {
		args = append(args, "-i", coverPath)
	}
	args = append(args,
		"-map", "0:a",
		"-map_metadata", "-1",
		"-map_chapters", "-1",
		"-c:a", "copy",
	)
	if metadata.Title != "" {
		args = append(args, "-metadata", "title="+metadata.Title)
	}
	if metadata.Artist != "" {
		args = append(args,
			"-metadata", "artist="+metadata.Artist,
			"-metadata", "album_artist="+metadata.Artist,
		)
	}
	if metadata.Date != "" {
		args = append(args,
			"-metadata", "date="+metadata.Date,
			"-metadata", "year="+metadata.Date,
		)
	}
	if metadata.Lyrics != "" {
		args = append(args, "-metadata", "lyrics="+metadata.Lyrics)
	}
	if coverPath != "" {
		args = append(args,
			"-map", "1:v:0",
			"-c:v", "mjpeg",
			"-disposition:v:0", "attached_pic",
			"-metadata:s:v", "title=Album cover",
			"-metadata:s:v", "comment=Cover (front)",
		)
	}
	args = append(args, outputPath)

	return args
}
