package cmd

import (
	"cicada/internal/config"
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
	startCmd.Flags().StringVar(&startData, "data", "cicada", "Data directory")
	startCmd.Flags().IntVar(&startPort, "port", 8000, "HTTP listen port")
	startCmd.Flags().StringVar(&startJWTExpiry, "jwt-expiry", "180d", "JWT expiry duration (e.g. 7d, 24h)")
	rootCmd.AddCommand(startCmd)
}

func runStart(cmd *cobra.Command, args []string) error {
	jwtExpiry := parseExpiry(startJWTExpiry)

	cfg := config.Config{
		Mode:      config.ModeProduction,
		Data:      startData,
		Port:      startPort,
		JWTExpiry: jwtExpiry,
	}
	config.Set(cfg)

	fmt.Println("---")
	fmt.Printf("data: %s\n", cfg.Data)
	fmt.Printf("port: %d\n", cfg.Port)
	fmt.Printf("jwtExpiry: %dms\n", cfg.JWTExpiry)
	fmt.Println("---")

	if err := store.Initialize(); err != nil {
		return fmt.Errorf("initialize: %w", err)
	}

	scheduler.Start()

	r := server.NewServer()
	pwa.Register(r)

	addr := fmt.Sprintf(":%d", cfg.Port)
	log.Printf("cicada listening on %s", addr)
	return http.ListenAndServe(addr, r)
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
