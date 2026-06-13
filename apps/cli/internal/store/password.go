package store

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"fmt"
	"strings"
	"unicode/utf8"

	"golang.org/x/crypto/argon2"
)

const (
	PasswordMinLength = 6
	PasswordMaxLength = 32

	passwordHashMemory      = 32 * 1024
	passwordHashIterations  = 2
	passwordHashParallelism = 1
	passwordHashSaltBytes   = 16
	passwordHashKeyBytes    = 32
)

func ValidPasswordLength(password string) bool {
	length := utf8.RuneCountInString(password)
	return length >= PasswordMinLength && length <= PasswordMaxLength
}

func HashPassword(password string) (string, error) {
	salt := make([]byte, passwordHashSaltBytes)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}
	hash := argon2.IDKey(
		[]byte(password),
		salt,
		passwordHashIterations,
		passwordHashMemory,
		passwordHashParallelism,
		passwordHashKeyBytes,
	)
	return fmt.Sprintf(
		"$argon2id$v=19$m=%d,t=%d,p=%d$%s$%s",
		passwordHashMemory,
		passwordHashIterations,
		passwordHashParallelism,
		base64.RawStdEncoding.EncodeToString(salt),
		base64.RawStdEncoding.EncodeToString(hash),
	), nil
}

func VerifyPassword(hash, password string) (ok, needsUpgrade bool) {
	if strings.HasPrefix(hash, "$argon2id$") {
		return verifyArgon2id(hash, password), false
	}
	return hash == DoubleMD5(password), true
}

func verifyArgon2id(encoded, password string) bool {
	var version int
	var memory uint32
	var iterations uint32
	var parallelism uint8
	parts := strings.Split(encoded, "$")
	if len(parts) != 6 || parts[1] != "argon2id" {
		return false
	}
	if _, err := fmt.Sscanf(
		strings.Join(parts[2:4], "$"),
		"v=%d$m=%d,t=%d,p=%d",
		&version,
		&memory,
		&iterations,
		&parallelism,
	); err != nil || version != argon2.Version {
		return false
	}
	salt, err := base64.RawStdEncoding.DecodeString(parts[4])
	if err != nil {
		return false
	}
	expected, err := base64.RawStdEncoding.DecodeString(parts[5])
	if err != nil {
		return false
	}
	actual := argon2.IDKey([]byte(password), salt, iterations, memory, parallelism, uint32(len(expected)))
	return subtle.ConstantTimeCompare(actual, expected) == 1
}
