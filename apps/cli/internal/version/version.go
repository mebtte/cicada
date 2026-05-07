package version

import (
	"os/exec"
	"strings"
	"sync"
)

const (
	buildProfileDevelopment = "development"
	buildProfileProduction  = "production"
)

var Version string

var (
	once   sync.Once
	cached string
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

	return buildVersion(buildProfile, latestTag())
}

func buildVersion(buildProfile, latestTagValue string) string {
	if latestTagValue == "" {
		latestTagValue = "unknown"
	}

	if buildProfile == buildProfileDevelopment {
		return latestTagValue + "-local"
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

func runGit(args ...string) string {
	output, err := exec.Command("git", args...).Output()
	if err != nil {
		return ""
	}

	return string(output)
}
