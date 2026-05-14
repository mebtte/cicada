package musicasset

import (
	"context"
	"os"

	"cicada/internal/ffmpeg"
)

type Info struct {
	Size       int64
	DurationMs int64
	Codec      string
	BitRate    int64
}

func Inspect(ctx context.Context, path string) (Info, error) {
	stat, err := os.Stat(path)
	if err != nil {
		return Info{}, err
	}

	info := Info{Size: stat.Size()}
	streamInfo, err := ffmpeg.ProbeAudioStream(ctx, path)
	if err != nil {
		return info, err
	}
	info.DurationMs = streamInfo.DurationMs
	info.Codec = streamInfo.CodecName
	info.BitRate = streamInfo.BitRate
	return info, nil
}
