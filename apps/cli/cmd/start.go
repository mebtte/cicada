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
	startData string
	startPort int
)

func init() {
	startCmd.Flags().StringVar(&startData, "data", "", "Data directory, defaults to <exe_dir>/cicada_data (env: CICADA_DATA)")
	startCmd.Flags().IntVar(&startPort, "port", 0, "HTTP listen port (env: CICADA_PORT, default 8000)")
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
	cfg := config.Config{
		Mode: config.DefaultMode(),
		Data: data,
		Port: port,
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
