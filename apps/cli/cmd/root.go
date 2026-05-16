package cmd

import (
	"cicada/internal/version"
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:     "cicada",
	Short:   "A multi-user music service for self-hosting.",
	Version: version.Get(),
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
