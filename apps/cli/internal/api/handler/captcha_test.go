package handler

import (
	"bytes"
	"cicada/internal/config"
	"cicada/internal/store"
	"encoding/base64"
	"encoding/json"
	"image/png"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestGetCaptchaReturnsPNGImageDataURL(t *testing.T) {
	previous := config.Get()
	if err := store.ResetForTests(); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		if err := store.ResetForTests(); err != nil {
			t.Errorf("reset store: %v", err)
		}
		config.Set(previous)
	})
	config.Set(config.Config{Mode: config.ModeProduction, Data: t.TempDir()})
	if err := store.Initialize(); err != nil {
		t.Fatal(err)
	}
	r := gin.New()
	r.GET("/captcha", GetCaptcha)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/captcha", nil))
	if w.Code != http.StatusOK || w.Header().Get("Cache-Control") != "no-store" {
		t.Fatalf("captcha response status=%d cache-control=%q", w.Code, w.Header().Get("Cache-Control"))
	}
	var response struct {
		Code string            `json:"code"`
		Data map[string]string `json:"data"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatal(err)
	}
	if response.Code != "success" || len(response.Data) != 2 || response.Data["id"] == "" {
		t.Fatalf("captcha response must contain only id and image, code=%s fields=%d", response.Code, len(response.Data))
	}
	const prefix = "data:image/png;base64,"
	if !strings.HasPrefix(response.Data["image"], prefix) {
		t.Fatal("captcha image must be a PNG data URL")
	}
	data, err := base64.StdEncoding.DecodeString(strings.TrimPrefix(response.Data["image"], prefix))
	if err != nil {
		t.Fatal(err)
	}
	image, err := png.DecodeConfig(bytes.NewReader(data))
	if err != nil || image.Width != image.Height*3 || image.Width < 480 {
		t.Fatalf("captcha PNG must preserve its display aspect ratio and resolution: %+v (%v)", image, err)
	}
}
