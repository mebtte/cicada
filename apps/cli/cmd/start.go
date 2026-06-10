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
	"os"

	"github.com/spf13/cobra"
)

var startCmd = &cobra.Command{
	Use:   "start",
	Short: "Start the cicada server",
	RunE:  runStart,
}

var (
	startData             string
	startPort             int
	startImageFileMaxSize string
	startAudioFileMaxSize string
	startVideoFileMaxSize string
)

func init() {
	startCmd.Flags().StringVar(&startData, "data", "", "Data directory, defaults to <exe_dir>/cicada_data (env: CICADA_DATA)")
	startCmd.Flags().IntVar(&startPort, "port", 0, "HTTP listen port (env: CICADA_PORT, default 8000)")
	startCmd.Flags().StringVar(&startImageFileMaxSize, "image-file-max-size", "", "Maximum image file upload size, supports b/kb/mb/gb suffixes (env: CICADA_IMAGE_FILE_MAX_SIZE, default 5mb)")
	startCmd.Flags().StringVar(&startAudioFileMaxSize, "audio-file-max-size", "", "Maximum audio file upload size, supports b/kb/mb/gb suffixes (env: CICADA_AUDIO_FILE_MAX_SIZE, default 200mb)")
	startCmd.Flags().StringVar(&startVideoFileMaxSize, "video-file-max-size", "", "Maximum video file upload size, supports b/kb/mb/gb suffixes (env: CICADA_VIDEO_FILE_MAX_SIZE, default 1gb)")
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
	imageFileMaxSize, err := parseStartFileMaxSize(
		"image file max size",
		startImageFileMaxSize,
		config.ImageFileMaxSizeEnvVar,
		config.DefaultImageFileMaxSize,
	)
	if err != nil {
		return err
	}
	audioFileMaxSize, err := parseStartFileMaxSize(
		"audio file max size",
		startAudioFileMaxSize,
		config.AudioFileMaxSizeEnvVar,
		config.DefaultAudioFileMaxSize,
	)
	if err != nil {
		return err
	}
	videoFileMaxSize, err := parseStartFileMaxSize(
		"video file max size",
		startVideoFileMaxSize,
		config.VideoFileMaxSizeEnvVar,
		config.DefaultVideoFileMaxSize,
	)
	if err != nil {
		return err
	}
	cfg := config.Config{
		Mode:             config.DefaultMode(),
		Data:             data,
		Port:             port,
		ImageFileMaxSize: imageFileMaxSize,
		AudioFileMaxSize: audioFileMaxSize,
		VideoFileMaxSize: videoFileMaxSize,
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
	fmt.Printf("imageFileMaxSize: %d\n", cfg.ImageFileMaxSize)
	fmt.Printf("audioFileMaxSize: %d\n", cfg.AudioFileMaxSize)
	fmt.Printf("videoFileMaxSize: %d\n", cfg.VideoFileMaxSize)
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

func parseStartFileMaxSize(name, value, envVar string, fallback int64) (int64, error) {
	if value != "" {
		size, err := config.ParseFileSize(value)
		if err != nil {
			return 0, fmt.Errorf("parse %s: %w", name, err)
		}
		return size, nil
	}

	envValue := os.Getenv(envVar)
	if envValue == "" {
		return fallback, nil
	}
	size, err := config.ParseFileSize(envValue)
	if err != nil {
		return 0, fmt.Errorf("parse %s from %s: %w", name, envVar, err)
	}
	return size, nil
}
