package handler

import "unicode/utf8"

const (
	passwordMinLength = 6
	passwordMaxLength = 32
)

func validPasswordLength(password string) bool {
	length := utf8.RuneCountInString(password)
	return length >= passwordMinLength && length <= passwordMaxLength
}
