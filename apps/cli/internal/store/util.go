package store

import (
	"strings"
	"time"
)

func nowMs() int64 { return time.Now().UnixMilli() }

// Placeholders returns n comma-separated "?" for SQL IN clauses.
func Placeholders(n int) string {
	return strings.TrimRight(strings.Repeat("?,", n), ",")
}

// Strs2Any converts a string slice to []any for use as query args.
func Strs2Any(s []string) []any {
	a := make([]any, len(s))
	for i, v := range s {
		a[i] = v
	}
	return a
}
