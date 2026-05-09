package handler

import "testing"

func TestValidPasswordLength(t *testing.T) {
	tests := []struct {
		name     string
		password string
		want     bool
	}{
		{name: "under minimum", password: "12345", want: false},
		{name: "minimum", password: "123456", want: true},
		{name: "maximum", password: "12345678901234567890123456789012", want: true},
		{name: "over maximum", password: "123456789012345678901234567890123", want: false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := validPasswordLength(tt.password); got != tt.want {
				t.Fatalf("validPasswordLength(%q) = %v, want %v", tt.password, got, tt.want)
			}
		})
	}
}
