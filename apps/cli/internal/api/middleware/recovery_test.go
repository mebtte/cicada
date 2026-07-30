package middleware

import (
	"cicada/internal/api/apperr"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestRecoveryReturnsStableLocalizedEnvelope(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(Recovery())
	router.GET("/panic", func(_ *gin.Context) {
		panic("test panic")
	})

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(
		http.MethodGet,
		"/panic?__client_language=zh-Hans",
		nil,
	)
	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusInternalServerError {
		t.Fatalf("expected status 500, got %d", recorder.Code)
	}
	var body map[string]json.RawMessage
	if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if len(body) != 3 {
		t.Fatalf("expected exactly code, message, and data, got %v", body)
	}
	var message string
	if err := json.Unmarshal(body["message"], &message); err != nil {
		t.Fatalf("decode message: %v", err)
	}
	if expected := apperr.Message(apperr.ServerError, apperr.LanguageSimplifiedChinese); message != expected {
		t.Fatalf("expected message %q, got %q", expected, message)
	}
	if string(body["data"]) != "null" {
		t.Fatalf("error data must be null: %s", body["data"])
	}
}
