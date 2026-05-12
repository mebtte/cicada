package cmd

import (
	"cicada/internal/config"
	"cicada/internal/ffmpeg"
	"cicada/internal/scheduler"
	"cicada/internal/server"
	"cicada/internal/store"
	"cicada/pwa"
	"fmt"
	"log"
	"net/http"

	"github.com/spf13/cobra"
)

var startCmd = &cobra.Command{
	Use:   "start",
	Short: "Start the cicada server",
	RunE:  runStart,
}

var (
	startData      string
	startPort      int
	startJWTExpiry string
)

func init() {
	startCmd.Flags().StringVar(&startData, "data", "", "Data directory, defaults to <exe_dir>/cicada_data (env: CICADA_DATA)")
	startCmd.Flags().IntVar(&startPort, "port", 0, "HTTP listen port (env: CICADA_PORT, default 8000)")
	startCmd.Flags().StringVar(&startJWTExpiry, "jwt-expiry", "", "JWT expiry duration, e.g. 7d, 24h (env: CICADA_JWT_EXPIRY, default 180d)")
	rootCmd.AddCommand(startCmd)
}

func runStart(cmd *cobra.Command, args []string) error {
	data := startData
	if data == "" {
		data = config.DefaultDataPath()
	}
	port := startPort
	if port == 0 {
		port = config.DefaultPort()
	}
	expiryStr := startJWTExpiry
	if expiryStr == "" {
		expiryStr = config.DefaultJWTExpiry()
	}
	jwtExpiry := parseExpiry(expiryStr)

	cfg := config.Config{
		Mode:      config.DefaultMode(),
		Data:      data,
		Port:      port,
		JWTExpiry: jwtExpiry,
	}
	config.Set(cfg)

	if err := store.Initialize(); err != nil {
		return fmt.Errorf("initialize: %w", err)
	}

	paths, err := ffmpeg.PrepareEmbeddedTools()
	if err != nil {
		return fmt.Errorf("prepare embedded ffmpeg tools: %w", err)
	}

	fmt.Println("---")
	fmt.Printf("data: %s\n", cfg.Data)
	fmt.Printf("mode: %s\n", cfg.Mode)
	fmt.Printf("port: %d\n", cfg.Port)
	fmt.Printf("jwtExpiry: %s\n", formatExpiry(cfg.JWTExpiry))
	fmt.Printf("ffmpegPath: %s\n", paths.FFmpeg)
	fmt.Printf("ffprobePath: %s\n", paths.FFprobe)
	fmt.Println("---")

	scheduler.Start()

	r := server.NewServer()
	pwa.Register(r)

	addr := fmt.Sprintf(":%d", cfg.Port)
	log.Printf("cicada listening on %s", addr)
	return http.ListenAndServe(addr, r)
}

// formatExpiry converts milliseconds to a human-readable duration string.
func formatExpiry(ms int64) string {
	const (
		msPerDay  = 24 * 60 * 60 * 1000
		msPerHour = 60 * 60 * 1000
		msPerMin  = 60 * 1000
		msPerSec  = 1000
	)
	switch {
	case ms%msPerDay == 0:
		return fmt.Sprintf("%dd", ms/msPerDay)
	case ms%msPerHour == 0:
		return fmt.Sprintf("%dh", ms/msPerHour)
	case ms%msPerMin == 0:
		return fmt.Sprintf("%dm", ms/msPerMin)
	case ms%msPerSec == 0:
		return fmt.Sprintf("%ds", ms/msPerSec)
	default:
		return fmt.Sprintf("%dms", ms)
	}
}

// parseExpiry converts strings like "180d", "24h", "60m" to milliseconds.
func parseExpiry(s string) int64 {
	if len(s) < 2 {
		return int64(180 * 24 * 60 * 60 * 1000)
	}
	unit := s[len(s)-1]
	var n int64
	fmt.Sscanf(s[:len(s)-1], "%d", &n)
	switch unit {
	case 'd':
		return n * 24 * 60 * 60 * 1000
	case 'h':
		return n * 60 * 60 * 1000
	case 'm':
		return n * 60 * 1000
	case 's':
		return n * 1000
	default:
		return int64(180 * 24 * 60 * 60 * 1000)
	}
}
