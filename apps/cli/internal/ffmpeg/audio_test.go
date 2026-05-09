package ffmpeg

import "testing"

func TestAudioStreamInfoLossless(t *testing.T) {
	tests := []struct {
		name     string
		codec    string
		lossless bool
	}{
		{
			name:     "flac",
			codec:    "flac",
			lossless: true,
		},
		{
			name:     "pcm",
			codec:    "pcm_s16le",
			lossless: true,
		},
		{
			name:  "mp3",
			codec: "mp3",
		},
		{
			name:  "aac",
			codec: "aac",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			info := AudioStreamInfo{CodecName: tt.codec}
			if info.Lossless() != tt.lossless {
				t.Fatalf("Lossless() = %v", info.Lossless())
			}
		})
	}
}

func TestRewriteAudioMetadataArgsIncludesLyrics(t *testing.T) {
	lyrics := "[00:00.00]hello\n[00:01.00]world"
	args := rewriteAudioMetadataArgs("in.mp3", "out.mp3", AudioMetadata{
		Title:  "Title",
		Artist: "Artist",
		Date:   "2026",
		Lyrics: lyrics,
	}, "")

	if !containsArgPair(args, "-map_metadata", "-1") {
		t.Fatalf("expected metadata rewrite to clear existing metadata, args=%v", args)
	}
	if !containsArgPair(args, "-metadata", "lyrics="+lyrics) {
		t.Fatalf("expected lyrics metadata, args=%v", args)
	}
}

func containsArgPair(args []string, key, value string) bool {
	for i := 0; i < len(args)-1; i++ {
		if args[i] == key && args[i+1] == value {
			return true
		}
	}
	return false
}
