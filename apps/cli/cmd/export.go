package cmd

import (
	"cicada/internal/config"
	"cicada/internal/store"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/spf13/cobra"
)

var exportCmd = &cobra.Command{
	Use:   "export [destination]",
	Short: "Export all music files to a directory",
	Args:  cobra.MaximumNArgs(1),
	RunE:  runExport,
}

var exportData string

func init() {
	exportCmd.Flags().StringVar(&exportData, "data", "", "Data directory, defaults to <exe_dir>/cicada_data (env: CICADA_DATA)")
	rootCmd.AddCommand(exportCmd)
}

func runExport(cmd *cobra.Command, args []string) error {
	dest := "."
	if len(args) > 0 {
		dest = args[0]
	}

	data := exportData
	if data == "" {
		data = config.DefaultDataPath()
	}

	cfg := config.Config{
		Mode: config.ModeProduction,
		Data: data,
	}
	config.Set(cfg)

	if err := store.Initialize(); err != nil {
		return fmt.Errorf("initialize: %w", err)
	}

	musics, err := store.GetAllMusic()
	if err != nil {
		return fmt.Errorf("get music: %w", err)
	}

	if len(musics) == 0 {
		fmt.Println("no music found")
		return nil
	}

	musicIDs := make([]string, len(musics))
	for i, m := range musics {
		musicIDs[i] = m.ID
	}

	performerRelations, err := store.GetArtistsInMusicIDsByRole(musicIDs, store.MusicArtistRolePerformer)
	if err != nil {
		return fmt.Errorf("get performers: %w", err)
	}

	performerMap := make(map[string][]string)
	for _, pr := range performerRelations {
		performerMap[pr.MusicID] = append(performerMap[pr.MusicID], pr.Name)
	}

	if err := os.MkdirAll(dest, 0755); err != nil {
		return fmt.Errorf("create destination: %w", err)
	}

	musicDir := config.AssetDir(config.AssetTypeMusic)
	exported, skipped := 0, 0

	for _, m := range musics {
		ext := filepath.Ext(m.Asset)
		performers := performerMap[m.ID]

		var filename string
		if len(performers) > 0 {
			filename = strings.Join(performers, ",") + " - " + m.Name + ext
		} else {
			filename = m.Name + ext
		}
		filename = sanitizeFilename(filename)

		src := filepath.Join(musicDir, m.Asset)
		dst := filepath.Join(dest, filename)

		if err := exportCopyFile(src, dst); err != nil {
			fmt.Fprintf(os.Stderr, "skip %s: %v\n", filename, err)
			skipped++
			continue
		}
		fmt.Println(filename)
		exported++
	}

	fmt.Printf("\nexported %d", exported)
	if skipped > 0 {
		fmt.Printf(", skipped %d", skipped)
	}
	fmt.Println()
	return nil
}

func sanitizeFilename(name string) string {
	return strings.NewReplacer(
		"/", "_", "\\", "_", ":", "_", "*", "_",
		"?", "_", "\"", "_", "<", "_", ">", "_", "|", "_",
	).Replace(name)
}

func exportCopyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, in)
	return err
}
