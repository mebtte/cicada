package scheduler

import (
	"fmt"
	"time"

	"cicada/internal/config"
)

// FFmpeg logs use the same 30-day retention as the other scratch logs.
func cleanOutdatedFFmpegLog() (schedulerJobResult, error) {
	removed, err := cleanOutdatedEntries(config.FFmpegLogDir(), 30*24*time.Hour, "")
	return schedulerJobResult{
		Summary: fmt.Sprintf("removed %d outdated ffmpeg log entries", removed),
		Metrics: map[string]int64{"removed_ffmpeg_log_entries": removed},
	}, err
}
