package scheduler

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"time"
)

type schedulerLogRecord struct {
	Time       string           `json:"time"`
	Job        string           `json:"job"`
	Status     string           `json:"status"`
	DurationMS int64            `json:"duration_ms"`
	Summary    string           `json:"summary,omitempty"`
	Metrics    map[string]int64 `json:"metrics,omitempty"`
	Error      string           `json:"error,omitempty"`
}

type schedulerLogger struct {
	mu  sync.Mutex
	dir string
}

func newSchedulerLogger(dir string) *schedulerLogger {
	return &schedulerLogger{dir: dir}
}

func (l *schedulerLogger) write(record schedulerLogRecord) error {
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
	path := filepath.Join(l.dir, "scheduler-"+time.Now().Format("2006-01-02")+".log")
	file, err := os.OpenFile(path, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		return err
	}
	defer file.Close()

	_, err = file.Write(line)
	return err
}
