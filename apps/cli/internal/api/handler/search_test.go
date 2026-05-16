package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestSearchHandlersRequireKeyword(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name    string
		path    string
		handler func(*gin.Context)
	}{
		{
			name:    "music",
			path:    "/api/music/search?page=1&pageSize=10",
			handler: SearchMusic,
		},
		{
			name:    "singer",
			path:    "/api/singer/search?keyword=%20%20%20&page=1&pageSize=10",
			handler: SearchSinger,
		},
		{
			name:    "public_musicbill",
			path:    "/api/public_musicbill/search?page=1&pageSize=10",
			handler: SearchPublicMusicbill,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = httptest.NewRequest(http.MethodGet, tt.path, nil)

			tt.handler(c)

			var resp struct {
				Code string `json:"code"`
			}
			if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
				t.Fatalf("decode response: %v", err)
			}
			if resp.Code != "wrong_parameter" {
				t.Fatalf("expected wrong_parameter, got %s", resp.Code)
			}
		})
	}
}
