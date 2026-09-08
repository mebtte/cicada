package config

import "fmt"

type MusicTranscodeMode string

const (
	MusicTranscodeEager MusicTranscodeMode = "eager"
	MusicTranscodeLazy  MusicTranscodeMode = "lazy"
)

func ParseMusicTranscodeMode(value string) (MusicTranscodeMode, error) {
	switch mode := MusicTranscodeMode(value); mode {
	case MusicTranscodeEager, MusicTranscodeLazy:
		return mode, nil
	default:
		return "", fmt.Errorf("invalid --music-transcode value %q: expected eager or lazy", value)
	}
}
