package ffmpeg

import (
	"encoding/json"
	"log"
	"os"
	"path/filepath"
	"sync"
	"time"
)

type callLogRecord struct {
	Time       time.Time `json:"time"`
	Event      string    `json:"event"`
	CallID     string    `json:"call_id"`
	Executable string    `json:"executable,omitempty"`
	Args       []string  `json:"args,omitempty"`
	Status     string    `json:"status,omitempty"`
	DurationMS *int64    `json:"duration_ms,omitempty"`
	ExitCode   *int      `json:"exit_code,omitempty"`
	Error      string    `json:"error,omitempty"`
	StderrTail string    `json:"stderr_tail,omitempty"`
}

var callLogMu sync.Mutex

func writeCallLog(dir string, record callLogRecord) {
	// Logging must not prevent a conversion or replace its actual error.
	if err := appendCallLog(dir, record); err != nil {
		log.Printf("[ffmpeg_log] write failed: %v", err)
	}
}

func appendCallLog(dir string, record callLogRecord) error {
	line, err := json.Marshal(record)
	if err != nil {
		return err
	}
	line = append(line, '\n')
	// Keep concurrent calls as complete JSON lines in the shared daily file.
	callLogMu.Lock()
	defer callLogMu.Unlock()
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	path := filepath.Join(dir, "ffmpeg-"+record.Time.Format("2006-01-02")+".log")
	file, err := os.OpenFile(path, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	_, err = file.Write(line)
	closeErr := file.Close()
	if err != nil {
		return err
	}
	return closeErr
}
