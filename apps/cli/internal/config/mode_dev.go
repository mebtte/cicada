//go:build !prod

package config

func DefaultMode() Mode {
	return ModeDevelopment
}
