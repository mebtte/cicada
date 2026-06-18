package version

import (
	"os/exec"
	"regexp"
	"strings"
	"sync"
)

const (
	buildProfileDevelopment = "development"
	buildProfileProduction  = "production"
)

var Version string

var baseVersionPattern = regexp.MustCompile(`^\d+\.\d+\.\d+$`)

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

	baseVersion := BaseVersion(latestTagValue)
	if buildProfile == buildProfileDevelopment {
		return baseVersion + "-local"
	}

	return baseVersion
}

func BaseVersion(version string) string {
	base, _, _ := strings.Cut(strings.TrimSpace(version), "-")
	return base
}

func latestTag() string {
	tags := runGit(
		"for-each-ref",
		"--sort=-creatordate",
		"--format=%(refname:short)",
		"refs/tags",
	)
	for _, tag := range strings.Fields(tags) {
		if baseVersionPattern.MatchString(tag) {
			return tag
		}
	}
	return ""
}

func runGit(args ...string) string {
	output, err := exec.Command("git", args...).Output()
	if err != nil {
		return ""
	}

	return string(output)
}
