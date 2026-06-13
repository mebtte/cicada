package cmd

import (
	"database/sql"
	"path/filepath"
	"strings"
	"testing"

	"cicada/internal/config"
	"cicada/internal/store"
)

func TestRunChangePassword(t *testing.T) {
	dataDir := t.TempDir()
	setupChangePasswordUser(t, dataDir)

	restore := setChangePasswordFlagsForTest(dataDir, "alice")
	defer restore()

	if err := runChangePassword(nil, []string{"new-password"}); err != nil {
		t.Fatalf("change password: %v", err)
	}

	user, err := store.GetUserByUsername("alice")
	if err != nil {
		t.Fatalf("get user: %v", err)
	}
	if ok, _ := store.VerifyPassword(user.Password, "new-password"); !ok {
		t.Fatal("password was not updated")
	}
	if user.TwoFASecret.Valid {
		t.Fatal("two-factor secret should be cleared")
	}

	var revokedAt sql.NullInt64
	var reason string
	if err := store.DB().QueryRow(
		`SELECT revokeTimestamp,revokeReason FROM auth_session WHERE userId=?`,
		user.ID,
	).Scan(&revokedAt, &reason); err != nil {
		t.Fatalf("get session: %v", err)
	}
	if !revokedAt.Valid || reason != "cli_change_password" {
		t.Fatalf("session revoke state = %v %q, want cli_change_password", revokedAt, reason)
	}
}

func TestRunChangePasswordRequiresUsername(t *testing.T) {
	restore := setChangePasswordFlagsForTest(t.TempDir(), "")
	defer restore()

	err := runChangePassword(nil, []string{"new-password"})
	if err == nil || !strings.Contains(err.Error(), "username is required") {
		t.Fatalf("error = %v, want username required", err)
	}
}

func TestRunChangePasswordRejectsShortPassword(t *testing.T) {
	restore := setChangePasswordFlagsForTest(t.TempDir(), "alice")
	defer restore()

	err := runChangePassword(nil, []string{"short"})
	if err == nil || !strings.Contains(err.Error(), "password length") {
		t.Fatalf("error = %v, want password length error", err)
	}
}

func TestRunChangePasswordMissingUser(t *testing.T) {
	dataDir := t.TempDir()
	setupChangePasswordData(t, dataDir)

	restore := setChangePasswordFlagsForTest(dataDir, "missing")
	defer restore()

	err := runChangePassword(nil, []string{"new-password"})
	if err == nil || !strings.Contains(err.Error(), `user "missing" not found`) {
		t.Fatalf("error = %v, want missing user", err)
	}
}

func setupChangePasswordUser(t *testing.T, dataDir string) {
	t.Helper()
	setupChangePasswordData(t, dataDir)

	userID, err := store.CreateUser("alice", "old-password", "")
	if err != nil {
		t.Fatalf("create user: %v", err)
	}
	if err := store.UpdateUser(userID, "twoFASecret", "SECRET"); err != nil {
		t.Fatalf("set two-factor secret: %v", err)
	}
	if _, err := store.CreateAuthSession(userID, "token-hash", "token", "test device"); err != nil {
		t.Fatalf("create session: %v", err)
	}

	// Close the setup connection so the command opens the database like real CLI use.
	if err := store.ResetForTests(); err != nil {
		t.Fatalf("reset store: %v", err)
	}
}

func setupChangePasswordData(t *testing.T, dataDir string) {
	t.Helper()
	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: dataDir,
	})
	if err := store.Initialize(); err != nil {
		t.Fatalf("initialize store: %v", err)
	}
	t.Cleanup(func() {
		if err := store.ResetForTests(); err != nil {
			t.Fatalf("reset store: %v", err)
		}
	})
}

func setChangePasswordFlagsForTest(dataDir, username string) func() {
	prevData := changePasswordData
	prevUsername := changePasswordUsername
	changePasswordData = filepath.Clean(dataDir)
	changePasswordUsername = username
	return func() {
		changePasswordData = prevData
		changePasswordUsername = prevUsername
	}
}
