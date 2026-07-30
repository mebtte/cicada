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
		"/apidoc/openapi.json",
		"/api/base/login",
		"/api/common/profile",
		"/api/common/music",
		"/api/admin/music",
		"/api/common/musicbill",
	}

	for _, path := range requiredPaths {
		if _, ok := paths[path]; !ok {
			t.Fatalf("expected path %s to be documented", path)
		}
	}

	profilePath, ok := paths["/api/common/profile"].(map[string]any)
	if !ok {
		t.Fatalf("profile path missing or invalid: %T", paths["/api/common/profile"])
	}
	profileGet, ok := profilePath["get"].(map[string]any)
	if !ok {
		t.Fatalf("profile get operation missing or invalid: %T", profilePath["get"])
	}
	if _, ok := profileGet["security"].([]any); !ok {
		t.Fatalf("expected authenticated operation to include security metadata")
	}

	adminMusicPath, ok := paths["/api/admin/music"].(map[string]any)
	if !ok {
		t.Fatalf("admin music path missing or invalid: %T", paths["/api/admin/music"])
	}
	adminMusicPost, ok := adminMusicPath["post"].(map[string]any)
	if !ok {
		t.Fatalf("admin music post operation missing or invalid: %T", adminMusicPath["post"])
	}
	if adminMusicPost["x-cicada-admin"] != true {
		t.Fatalf("expected admin music write operation to require admin")
	}

	loginPath, ok := paths["/api/base/login"].(map[string]any)
	if !ok {
		t.Fatalf("login path missing or invalid: %T", paths["/api/base/login"])
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

func TestSpecDocumentsClientLanguageOnEveryAPI(t *testing.T) {
	paths := Spec()["paths"].(map[string]any)
	oldCommonParams := map[string]bool{
		"__v":      true,
		"__lang":   true,
		"version":  true,
		"language": true,
	}

	for path, rawPathItem := range paths {
		if !strings.HasPrefix(path, "/api/") {
			continue
		}
		pathItem := rawPathItem.(map[string]any)
		for method, rawOperation := range pathItem {
			operation := rawOperation.(map[string]any)
			parameters, ok := operation["parameters"].([]map[string]any)
			if !ok {
				t.Fatalf("%s %s does not document parameters", method, path)
			}

			clientLanguageCount := 0
			for _, parameter := range parameters {
				name, _ := parameter["name"].(string)
				if oldCommonParams[name] {
					t.Fatalf("%s %s still documents old common parameter %q", method, path, name)
				}
				if name != "__client_language" {
					continue
				}
				clientLanguageCount++
				if parameter["required"] != false {
					t.Fatalf("%s %s client language must be optional", method, path)
				}
				schema := parameter["schema"].(map[string]any)
				values := schema["enum"].([]any)
				if len(values) != 3 || values[0] != "en" || values[1] != "zh-Hans" || values[2] != "zh-Hant" {
					t.Fatalf("%s %s has unexpected client languages: %v", method, path, values)
				}
			}
			if clientLanguageCount != 1 {
				t.Fatalf("%s %s documents client language %d times", method, path, clientLanguageCount)
			}
		}
	}
}

func TestEnvelopeExamplesAlwaysContainStableFields(t *testing.T) {
	success := successEnvelopeExample(nil)
	if len(success) != 3 || success["code"] != "success" || success["message"] != "" {
		t.Fatalf("unexpected success envelope: %v", success)
	}
	if data, ok := success["data"]; !ok || data != nil {
		t.Fatalf("success envelope must contain null data: %v", success)
	}

	failure := errorEnvelopeExample("wrong_parameter")
	if len(failure) != 3 || failure["code"] != "wrong_parameter" {
		t.Fatalf("unexpected error envelope: %v", failure)
	}
	if message, _ := failure["message"].(string); message == "" || message == "wrong_parameter" {
		t.Fatalf("error envelope must contain a friendly message: %v", failure)
	}
	if data, ok := failure["data"]; !ok || data != nil {
		t.Fatalf("error envelope must contain null data: %v", failure)
	}
}

func TestRegisterServesDocsPageAndSpec(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	Register(r)

	t.Run("page", func(t *testing.T) {
		w := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, "/apidoc", nil)
		r.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("unexpected status: %d", w.Code)
		}
		if !strings.Contains(w.Body.String(), "/apidoc/openapi.json") {
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
		req := httptest.NewRequest(http.MethodGet, "/apidoc/openapi.json", nil)
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
