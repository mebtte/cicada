package middleware

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"cicada/internal/config"

	"github.com/gin-gonic/gin"
)

const (
	accessLogRequestIDHeader = "X-Request-ID"
	accessLogMaxSize         = int64(100 * 1024 * 1024)
)

type accessLogRecord struct {
	Time         string     `json:"time"`
	RequestID    string     `json:"request_id"`
	Method       string     `json:"method"`
	Path         string     `json:"path"`
	Query        url.Values `json:"query"`
	Status       int        `json:"status"`
	LatencyMS    int64      `json:"latency_ms"`
	ClientIP     string     `json:"client_ip"`
	UserAgent    string     `json:"user_agent"`
	Referer      string     `json:"referer"`
	UserID       string     `json:"user_id"`
	RequestSize  int64      `json:"request_size"`
	ResponseSize int        `json:"response_size"`
	Error        string     `json:"error"`
}

type accessLogger struct {
	mu          sync.Mutex
	dir         string
	maxSize     int64
	currentDate string
	currentPath string
	currentSize int64
}

func AccessLogger() gin.HandlerFunc {
	return newAccessLogger(config.AccessLogDir(), accessLogMaxSize).Middleware()
}

func newAccessLogger(dir string, maxSize int64) *accessLogger {
	return &accessLogger{
		dir:     dir,
		maxSize: maxSize,
	}
}

func (l *accessLogger) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		requestID := requestID(c.GetHeader(accessLogRequestIDHeader))
		c.Header(accessLogRequestIDHeader, requestID)

		c.Next()

		record := accessLogRecord{
			Time:         time.Now().Format(time.RFC3339Nano),
			RequestID:    requestID,
			Method:       c.Request.Method,
			Path:         requestPath(c),
			Query:        sanitizeQuery(c.Request.URL.Query()),
			Status:       c.Writer.Status(),
			LatencyMS:    time.Since(start).Milliseconds(),
			ClientIP:     c.ClientIP(),
			UserAgent:    c.Request.UserAgent(),
			Referer:      c.Request.Referer(),
			UserID:       accessLogUserID(c),
			RequestSize:  requestSize(c.Request),
			ResponseSize: responseSize(c),
			Error:        accessLogError(c),
		}
		if err := l.write(record); err != nil {
			log.Printf("[access_log] write failed: %v", err)
		}
	}
}

func (l *accessLogger) write(record accessLogRecord) error {
	line, err := json.Marshal(record)
	if err != nil {
		return err
	}
	line = append(line, '\n')

	l.mu.Lock()
	defer l.mu.Unlock()

	if err := os.MkdirAll(l.dir, 0755); err != nil {
		return err
	}

	path, err := l.nextPath(time.Now(), int64(len(line)))
	if err != nil {
		return err
	}
	file, err := os.OpenFile(path, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		return err
	}
	defer file.Close()

	n, err := file.Write(line)
	l.currentSize += int64(n)
	return err
}

func (l *accessLogger) nextPath(now time.Time, incomingSize int64) (string, error) {
	date := now.Format("2006-01-02")
	if l.currentDate == date && l.currentPath != "" && (l.maxSize <= 0 || l.currentSize+incomingSize <= l.maxSize) {
		return l.currentPath, nil
	}

	for seq := 0; ; seq++ {
		path := filepath.Join(l.dir, accessLogFilename(date, seq))
		info, err := os.Stat(path)
		switch {
		case os.IsNotExist(err):
			l.currentDate = date
			l.currentPath = path
			l.currentSize = 0
			return path, nil
		case err != nil:
			return "", err
		case info.IsDir():
			continue
		case l.maxSize <= 0 || info.Size()+incomingSize <= l.maxSize:
			l.currentDate = date
			l.currentPath = path
			l.currentSize = info.Size()
			return path, nil
		}
	}
}

func accessLogFilename(date string, seq int) string {
	if seq == 0 {
		return fmt.Sprintf("access-%s.log", date)
	}
	return fmt.Sprintf("access-%s.%d.log", date, seq)
}

func requestPath(c *gin.Context) string {
	if path := c.FullPath(); path != "" {
		return path
	}
	return c.Request.URL.Path
}

func requestSize(r *http.Request) int64 {
	if r.ContentLength > 0 {
		return r.ContentLength
	}
	return 0
}

func responseSize(c *gin.Context) int {
	size := c.Writer.Size()
	if size > 0 {
		return size
	}
	return 0
}

func accessLogUserID(c *gin.Context) string {
	if u := GetUser(c); u != nil {
		return u.ID
	}
	return ""
}

func accessLogError(c *gin.Context) string {
	if len(c.Errors) > 0 {
		return strings.TrimSpace(c.Errors.String())
	}
	status := c.Writer.Status()
	if status >= http.StatusBadRequest {
		return http.StatusText(status)
	}
	return ""
}

func sanitizeQuery(query url.Values) url.Values {
	sanitized := make(url.Values, len(query))
	for key, values := range query {
		copied := make([]string, len(values))
		if sensitiveQueryKey(key) {
			for i := range copied {
				copied[i] = "[REDACTED]"
			}
		} else {
			copy(copied, values)
		}
		sanitized[key] = copied
	}
	return sanitized
}

func sensitiveQueryKey(key string) bool {
	k := strings.ToLower(key)
	for _, part := range []string{"token", "password", "secret", "authorization", "cookie", "captcha"} {
		if strings.Contains(k, part) {
			return true
		}
	}
	return false
}

func requestID(headerValue string) string {
	if validRequestID(headerValue) {
		return headerValue
	}
	var b [16]byte
	if _, err := rand.Read(b[:]); err == nil {
		return hex.EncodeToString(b[:])
	}
	return fmt.Sprintf("%d", time.Now().UnixNano())
}

func validRequestID(value string) bool {
	if value == "" || len(value) > 128 {
		return false
	}
	for _, r := range value {
		if r < 33 || r == 127 {
			return false
		}
	}
	return true
}
