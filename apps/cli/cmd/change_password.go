package cmd

import (
	"database/sql"
	"fmt"
	"time"

	"cicada/internal/config"
	"cicada/internal/store"

	"github.com/spf13/cobra"
)

var changePasswordCmd = &cobra.Command{
	Use:   "change-password --username <username> <password>",
	Short: "Change a user's password",
	Args:  cobra.ExactArgs(1),
	RunE:  runChangePassword,
}

var (
	changePasswordData     string
	changePasswordUsername string
)

func init() {
	changePasswordCmd.Flags().StringVar(&changePasswordData, "data", "", "Data directory, defaults to <exe_dir>/cicada_data (env: CICADA_DATA)")
	changePasswordCmd.Flags().StringVar(&changePasswordUsername, "username", "", "Username whose password will be changed")
	rootCmd.AddCommand(changePasswordCmd)
}

func runChangePassword(cmd *cobra.Command, args []string) error {
	if changePasswordUsername == "" {
		return fmt.Errorf("username is required")
	}

	password := args[0]
	if !store.ValidPasswordLength(password) {
		return fmt.Errorf("password length must be between %d and %d characters", store.PasswordMinLength, store.PasswordMaxLength)
	}

	data := changePasswordData
	if data == "" {
		data = config.DefaultDataPath()
	}

	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: data,
	})

	if err := store.Initialize(); err != nil {
		return fmt.Errorf("initialize: %w", err)
	}

	user, err := store.GetUserByUsername(changePasswordUsername)
	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("user %q not found", changePasswordUsername)
		}
		return fmt.Errorf("get user: %w", err)
	}

	passwordHash, err := store.HashPassword(password)
	if err != nil {
		return fmt.Errorf("hash password: %w", err)
	}

	// Resetting a password invalidates existing authentication material.
	if err := store.ResetUserPasswordAndDisable2FA(user.ID, passwordHash, time.Now().UnixMilli(), "cli_change_password"); err != nil {
		return fmt.Errorf("change password: %w", err)
	}

	fmt.Printf("password changed for user %s\n", user.Username)
	return nil
}
