package middleware

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"cicada/internal/store"

	"github.com/gin-gonic/gin"
)

func TestAccessLoggerWritesStructuredRecord(t *testing.T) {
	gin.SetMode(gin.TestMode)

	dir := t.TempDir()
	logger := newAccessLogger(dir, accessLogMaxSize)
	r := gin.New()
	r.Use(logger.Middleware())
	r.POST("/api/music/:id", func(c *gin.Context) {
		c.Set(ctxUser, &store.User{ID: "u1"})
		c.String(http.StatusCreated, "ok")
	})

	req := httptest.NewRequest(
		http.MethodPost,
		"/api/music/42?keyword=hello&token=secret&password=pw",
		strings.NewReader("hello"),
	)
	req.Header.Set(accessLogRequestIDHeader, "req-test")
	req.Header.Set("User-Agent", "test-agent")
	req.Header.Set("Referer", "https://example.test/from")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if got := w.Header().Get(accessLogRequestIDHeader); got != "req-test" {
		t.Fatalf("expected request id response header, got %q", got)
	}

	record := readAccessLogRecord(t, dir)
	if record.RequestID != "req-test" {
		t.Fatalf("request id = %q", record.RequestID)
	}
	if record.Method != http.MethodPost {
		t.Fatalf("method = %q", record.Method)
	}
	if record.Path != "/api/music/:id" {
		t.Fatalf("path = %q", record.Path)
	}
	if record.Status != http.StatusCreated {
		t.Fatalf("status = %d", record.Status)
	}
	if record.UserID != "u1" {
		t.Fatalf("user id = %q", record.UserID)
	}
	if record.RequestSize != 5 {
		t.Fatalf("request size = %d", record.RequestSize)
	}
	if record.ResponseSize != 2 {
		t.Fatalf("response size = %d", record.ResponseSize)
	}
	if record.UserAgent != "test-agent" {
		t.Fatalf("user agent = %q", record.UserAgent)
	}
	if record.Referer != "https://example.test/from" {
		t.Fatalf("referer = %q", record.Referer)
	}
	if got := record.Query.Get("keyword"); got != "hello" {
		t.Fatalf("keyword query = %q", got)
	}
	if got := record.Query.Get("token"); got != "[REDACTED]" {
		t.Fatalf("token query = %q", got)
	}
	if got := record.Query.Get("password"); got != "[REDACTED]" {
		t.Fatalf("password query = %q", got)
	}
}

func TestAccessLoggerRotatesBySize(t *testing.T) {
	dir := t.TempDir()
	logger := newAccessLogger(dir, 1)

	record := accessLogRecord{
		Time:      time.Now().Format(time.RFC3339Nano),
		RequestID: "req-test",
		Method:    http.MethodGet,
		Path:      "/api/test",
		Query:     map[string][]string{},
		Status:    http.StatusOK,
	}
	if err := logger.write(record); err != nil {
		t.Fatalf("write first record: %v", err)
	}
	if err := logger.write(record); err != nil {
		t.Fatalf("write second record: %v", err)
	}

	date := time.Now().Format("2006-01-02")
	for _, name := range []string{
		"access-" + date + ".log",
		"access-" + date + ".1.log",
	} {
		if _, err := os.Stat(filepath.Join(dir, name)); err != nil {
			t.Fatalf("expected rotated log %s: %v", name, err)
		}
	}
}

func readAccessLogRecord(t *testing.T, dir string) accessLogRecord {
	t.Helper()

	date := time.Now().Format("2006-01-02")
	data, err := os.ReadFile(filepath.Join(dir, "access-"+date+".log"))
	if err != nil {
		t.Fatalf("read access log: %v", err)
	}
	lines := strings.Split(strings.TrimSpace(string(data)), "\n")
	if len(lines) != 1 {
		t.Fatalf("expected one log line, got %d", len(lines))
	}

	var record accessLogRecord
	if err := json.Unmarshal([]byte(lines[0]), &record); err != nil {
		t.Fatalf("unmarshal access log: %v", err)
	}
	return record
}
