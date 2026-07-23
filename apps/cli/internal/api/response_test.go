package api

import (
	"cicada/internal/api/apperr"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestOKReturnsStableEnvelope(t *testing.T) {
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)

	OK(context, nil)

	var body map[string]json.RawMessage
	if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if len(body) != 3 {
		t.Fatalf("expected exactly code, message, and data, got %v", body)
	}
	if string(body["code"]) != `"success"` {
		t.Fatalf("unexpected code: %s", body["code"])
	}
	if string(body["message"]) != `""` {
		t.Fatalf("success message must be empty: %s", body["message"])
	}
	if string(body["data"]) != "null" {
		t.Fatalf("nil success data must be null: %s", body["data"])
	}
}

func TestFailReturnsLocalizedStableEnvelope(t *testing.T) {
	gin.SetMode(gin.TestMode)
	tests := []struct {
		name             string
		clientLanguage   string
		acceptLanguage   string
		expectedLanguage string
	}{
		{name: "English default", expectedLanguage: apperr.LanguageEnglish},
		{
			name:             "Accept-Language is ignored",
			acceptLanguage:   apperr.LanguageSimplifiedChinese,
			expectedLanguage: apperr.LanguageEnglish,
		},
		{
			name:             "Simplified Chinese",
			clientLanguage:   apperr.LanguageSimplifiedChinese,
			expectedLanguage: apperr.LanguageSimplifiedChinese,
		},
		{
			name:             "unsupported language",
			clientLanguage:   "zh-CN",
			expectedLanguage: apperr.LanguageEnglish,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			context, _ := gin.CreateTestContext(recorder)
			url := "/api/common/profile"
			if tt.clientLanguage != "" {
				url += "?__client_language=" + tt.clientLanguage
			}
			context.Request = httptest.NewRequest(http.MethodGet, url, nil)
			context.Request.Header.Set("Accept-Language", tt.acceptLanguage)

			Fail(context, apperr.WrongParameter)

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
			expected := apperr.Message(apperr.WrongParameter, tt.expectedLanguage)
			if message != expected {
				t.Fatalf("expected message %q, got %q", expected, message)
			}
			if string(body["data"]) != "null" {
				t.Fatalf("error data must be null: %s", body["data"])
			}
			if !context.IsAborted() {
				t.Fatal("expected request chain to be aborted")
			}
		})
	}
}
