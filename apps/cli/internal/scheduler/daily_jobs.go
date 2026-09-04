package scheduler

import (
	"fmt"

	"cicada/internal/config"
)

type dailyJob struct {
	name     string
	schedule string
	fn       schedulerJobFunc
}

func dailyJobs(mode config.MusicTranscodeMode) []dailyJob {
	jobs := []dailyJob{
		{name: "remove_outdated_db", fn: removeOutdatedDB},
		{name: "remove_unlinked_asset", fn: removeUnlinkedAsset},
		{name: "clean_music_transcode_cache", fn: cleanMusicTranscodeCache},
		{name: "pretranscode_music", fn: pretranscodeMusic},
		{name: "remove_outdated_shared_invitation", fn: removeOutdatedSharedInvitation},
		{name: "remove_outdated_auth_session", fn: removeOutdatedAuthSession},
		{name: "clean_outdated_file", fn: cleanOutdatedFile},
		{name: "clean_outdated_access_log", fn: cleanOutdatedAccessLog},
		{name: "clean_outdated_scheduler_log", fn: cleanOutdatedSchedulerLog},
		{name: "clean_outdated_partial_upload", fn: cleanOutdatedPartialUpload},
	}
	selected := make([]dailyJob, 0, len(jobs))
	for i, job := range jobs {
		// Assign the original daily slot before filtering so lazy mode leaves
		// other jobs at the same time, including the 04:10 cache cleanup.
		minutes := 4*60 + i*5
		job.schedule = fmt.Sprintf("%d %d * * *", minutes%60, minutes/60)
		if mode == config.MusicTranscodeLazy && job.name == "pretranscode_music" {
			continue
		}
		selected = append(selected, job)
	}
	return selected
}
