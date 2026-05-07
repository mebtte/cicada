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
