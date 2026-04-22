package version

import (
	"os"
	"os/exec"
	"strings"
	"sync"
	"time"
)

const (
	betaBranch              = "beta"
	buildProfileBeta        = "beta"
	buildProfileDevelopment = "development"
	buildProfileProduction  = "production"
)

var Version string

var (
	nowFunc = time.Now
	once    sync.Once
	cached  string
)

func Get() string {
	once.Do(func() {
		cached = resolveCurrentVersion(currentBuildProfile)
	})

	return cached
}

func resolveCurrentVersion(buildProfile string) string {
	if injected := strings.TrimSpace(Version); injected != "" {
		return injected
	}

	return buildVersion(buildProfile, latestTag(), currentBranch(), nowFunc())
}

func buildVersion(buildProfile, latestTagValue, branch string, now time.Time) string {
	if latestTagValue == "" {
		latestTagValue = "unknown"
	}

	if buildProfile == buildProfileDevelopment {
		return latestTagValue + "-local"
	}

	if buildProfile == buildProfileBeta || branch == betaBranch {
		return latestTagValue + "-beta-" + now.Format("200601021504")
	}

	return latestTagValue
}

func latestTag() string {
	tag := runGit(
		"for-each-ref",
		"--sort=-creatordate",
		"--count=1",
		"--format=%(refname:short)",
		"refs/tags",
	)
	return strings.TrimSpace(tag)
}

func currentBranch() string {
	for _, key := range []string{"GITHUB_REF_NAME", "CI_COMMIT_REF_NAME", "BRANCH_NAME"} {
		if value := strings.TrimSpace(os.Getenv(key)); value != "" {
			return value
		}
	}

	return strings.TrimSpace(runGit("branch", "--show-current"))
}

func runGit(args ...string) string {
	output, err := exec.Command("git", args...).Output()
	if err != nil {
		return ""
	}

	return string(output)
}
