package handler

import "cicada/internal/store"

func validPasswordLength(password string) bool {
	return store.ValidPasswordLength(password)
}
