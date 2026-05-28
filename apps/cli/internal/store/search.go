package store

import "strings"

func escapeLikeKeyword(keyword string) string {
	replacer := strings.NewReplacer(
		`\`, `\\`,
		`%`, `\%`,
		`_`, `\_`,
	)
	return replacer.Replace(keyword)
}

func containsLikePattern(keyword string) string {
	return "%" + escapeLikeKeyword(keyword) + "%"
}

func prefixLikePattern(keyword string) string {
	return escapeLikeKeyword(keyword) + "%"
}
