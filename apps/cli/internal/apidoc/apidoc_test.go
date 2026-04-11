package apidoc

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestSpecIncludesCorePaths(t *testing.T) {
	spec := Spec()

	if got := spec["openapi"]; got != "3.0.3" {
		t.Fatalf("unexpected openapi version: %v", got)
	}

	paths, ok := spec["paths"].(map[string]any)
	if !ok {
		t.Fatalf("paths missing or invalid: %T", spec["paths"])
	}

	requiredPaths := []string{
		"/docs/openapi.json",
		"/base/login",
		"/api/profile",
		"/api/music",
		"/api/musicbill",
	}

	for _, path := range requiredPaths {
		if _, ok := paths[path]; !ok {
			t.Fatalf("expected path %s to be documented", path)
		}
	}

	profilePath, ok := paths["/api/profile"].(map[string]any)
	if !ok {
		t.Fatalf("profile path missing or invalid: %T", paths["/api/profile"])
	}
	profileGet, ok := profilePath["get"].(map[string]any)
	if !ok {
		t.Fatalf("profile get operation missing or invalid: %T", profilePath["get"])
	}
	if _, ok := profileGet["security"].([]any); !ok {
		t.Fatalf("expected authenticated operation to include security metadata")
	}

	loginPath, ok := paths["/base/login"].(map[string]any)
	if !ok {
		t.Fatalf("login path missing or invalid: %T", paths["/base/login"])
	}
	loginPost, ok := loginPath["post"].(map[string]any)
	if !ok {
		t.Fatalf("login post operation missing or invalid: %T", loginPath["post"])
	}
	if _, ok := loginPost["security"]; ok {
		t.Fatalf("did not expect unauthenticated login operation to include security metadata")
	}

	guide, ok := spec["x-cicada-authentication"].(map[string]any)
	if !ok {
		t.Fatalf("authentication guide missing or invalid: %T", spec["x-cicada-authentication"])
	}

	header, ok := guide["header"].(map[string]any)
	if !ok {
		t.Fatalf("authentication header missing or invalid: %T", guide["header"])
	}

	if header["name"] != "x-cicada-token" {
		t.Fatalf("unexpected authentication header name: %v", header["name"])
	}
}

func TestRegisterServesDocsPageAndSpec(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	Register(r)

	t.Run("page", func(t *testing.T) {
		w := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, "/docs", nil)
		r.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("unexpected status: %d", w.Code)
		}
		if !strings.Contains(w.Body.String(), "/docs/openapi.json") {
			t.Fatalf("docs page does not reference the OpenAPI document")
		}
		if !strings.Contains(w.Body.String(), "Authentication") {
			t.Fatalf("docs page does not include authentication section markup")
		}
		if !strings.Contains(w.Body.String(), "Auth required") {
			t.Fatalf("docs page does not include auth badge markup")
		}
	})

	t.Run("spec", func(t *testing.T) {
		w := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, "/docs/openapi.json", nil)
		r.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("unexpected status: %d", w.Code)
		}

		var payload map[string]any
		if err := json.Unmarshal(w.Body.Bytes(), &payload); err != nil {
			t.Fatalf("invalid json: %v", err)
		}
		if payload["openapi"] != "3.0.3" {
			t.Fatalf("unexpected openapi version: %v", payload["openapi"])
		}
	})
}
