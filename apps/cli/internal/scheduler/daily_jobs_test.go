package scheduler

import (
	"testing"
	"time"

	"cicada/internal/config"

	"github.com/robfig/cron/v3"
)

func TestDailyJobsModesPreserveSchedule(t *testing.T) {
	for _, mode := range []config.MusicTranscodeMode{config.MusicTranscodeEager, config.MusicTranscodeLazy} {
		t.Run(string(mode), func(t *testing.T) {
			jobs := dailyJobs(mode)
			wantCount := 10
			if mode == config.MusicTranscodeLazy {
				wantCount = 9
			}
			if len(jobs) != wantCount {
				t.Fatalf("job count = %d, want %d", len(jobs), wantCount)
			}
			wantMinutes := map[string]int{
				"remove_outdated_db":                0,
				"remove_unlinked_asset":             5,
				"clean_music_transcode_cache":       10,
				"pretranscode_music":                15,
				"remove_outdated_shared_invitation": 20,
				"remove_outdated_auth_session":      25,
				"clean_outdated_file":               30,
				"clean_outdated_access_log":         35,
				"clean_outdated_scheduler_log":      40,
				"clean_outdated_partial_upload":     45,
			}
			if mode == config.MusicTranscodeLazy {
				delete(wantMinutes, "pretranscode_music")
			}
			midnight := time.Date(2026, time.September, 4, 0, 0, 0, 0, time.UTC)
			for _, job := range jobs {
				minute, exists := wantMinutes[job.name]
				if !exists || job.fn == nil {
					t.Fatalf("unexpected, duplicate, or uncallable job: %s", job.name)
				}
				delete(wantMinutes, job.name)
				schedule, err := cron.ParseStandard(job.schedule)
				if err != nil {
					t.Fatal(err)
				}
				want := midnight.Add(4*time.Hour + time.Duration(minute)*time.Minute)
				if next := schedule.Next(midnight); !next.Equal(want) {
					t.Errorf("%s next run = %s, want %s", job.name, next, want)
				}
			}
			if len(wantMinutes) != 0 {
				t.Errorf("missing scheduled jobs: %v", wantMinutes)
			}
		})
	}
}
