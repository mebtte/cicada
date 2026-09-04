package config

import "testing"

func TestParseMusicTranscodeMode(t *testing.T) {
	for _, value := range []string{"eager", "lazy"} {
		got, err := ParseMusicTranscodeMode(value)
		if err != nil || string(got) != value {
			t.Errorf("ParseMusicTranscodeMode(%q) = %q, %v", value, got, err)
		}
	}
	for _, value := range []string{"", "EAGER", " lazy ", "disabled"} {
		if _, err := ParseMusicTranscodeMode(value); err == nil {
			t.Errorf("ParseMusicTranscodeMode(%q) should reject invalid mode", value)
		}
	}
}

func TestConfigMusicTranscodeDefaultAndOverride(t *testing.T) {
	previous := Get()
	t.Cleanup(func() { Set(previous) })
	Set(Config{})
	if got := Get().MusicTranscode; got != MusicTranscodeEager {
		t.Fatalf("default mode = %q, want eager", got)
	}
	Set(Config{MusicTranscode: MusicTranscodeLazy})
	if got := Get().MusicTranscode; got != MusicTranscodeLazy {
		t.Fatalf("explicit mode = %q, want lazy", got)
	}
}
