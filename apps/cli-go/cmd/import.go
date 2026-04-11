package cmd

import (
	"cicada/internal/config"
	"cicada/internal/importer"
	"cicada/internal/store"
	"fmt"

	"github.com/spf13/cobra"
)

var importCmd = &cobra.Command{
	Use:   "import <source>",
	Short: "Import music files into cicada",
	Args:  cobra.ExactArgs(1),
	RunE:  runImport,
}

var (
	importData              string
	importUID               string
	importRecursive         bool
	importSkipExistenceCheck bool
)

func init() {
	importCmd.Flags().StringVar(&importData, "data", "cicada", "Data directory")
	importCmd.Flags().StringVar(&importUID, "uid", "", "User ID to assign imported music to")
	importCmd.Flags().BoolVarP(&importRecursive, "recursive", "r", false, "Recursively scan subdirectories")
	importCmd.Flags().BoolVar(&importSkipExistenceCheck, "skip-existence-check", false, "Skip existence check")
	importCmd.MarkFlagRequired("uid")
	rootCmd.AddCommand(importCmd)
}

func runImport(cmd *cobra.Command, args []string) error {
	source := args[0]

	cfg := config.Config{
		Mode: config.ModeProduction,
		Data: importData,
	}
	config.Set(cfg)

	if err := store.Initialize(); err != nil {
		return fmt.Errorf("initialize: %w", err)
	}

	return importer.Run(source, importUID, importRecursive, importSkipExistenceCheck)
}
