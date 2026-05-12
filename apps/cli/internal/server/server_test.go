package server

import (
	"cicada/internal/config"
	"testing"
)

func TestNewServerDoesNotPanic(t *testing.T) {
	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
	})
	_ = NewServer()
}
