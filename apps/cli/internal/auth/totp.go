package auth

import "github.com/pquerna/otp/totp"

const UnusedTOTPPrefix = "unused_"

func NewTOTPSecret(accountName, issuer string) (secret, url string, err error) {
	key, err := totp.Generate(totp.GenerateOpts{Issuer: issuer, AccountName: accountName})
	if err != nil {
		return "", "", err
	}
	return UnusedTOTPPrefix + key.Secret(), key.URL(), nil
}

func ValidateTOTP(token, secret string) bool {
	if len(secret) >= len(UnusedTOTPPrefix) && secret[:len(UnusedTOTPPrefix)] == UnusedTOTPPrefix {
		secret = secret[len(UnusedTOTPPrefix):]
	}
	return totp.Validate(token, secret)
}

func TOTPEnabled(secret string) bool {
	return secret != "" && !(len(secret) >= len(UnusedTOTPPrefix) && secret[:len(UnusedTOTPPrefix)] == UnusedTOTPPrefix)
}
