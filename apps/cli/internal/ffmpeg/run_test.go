package ffmpeg

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"reflect"
	"strings"
	"sync"
	"testing"
	"time"

	"cicada/internal/config"
)

// Reuse the test executable so process tests need neither an FFmpeg bundle nor
// a platform-specific shell. The arguments after -- select child behavior.
func TestFFmpegHelperProcess(t *testing.T) {
	for i, arg := range os.Args {
		if arg != "--" || i+1 >= len(os.Args) {
			continue
		}
		switch os.Args[i+1] {
		case "success":
			fmt.Fprintln(os.Stderr, "normal diagnostic")
			os.Exit(0)
		case "failed":
			fmt.Fprint(os.Stderr, strings.Repeat("x", stderrTailLimit*2)+"invalid input")
			os.Exit(7)
		case "wait":
			fmt.Fprintln(os.Stderr, "diagnostic before termination")
			if err := os.WriteFile(os.Args[i+2], []byte("ready"), 0600); err != nil {
				os.Exit(2)
			}
			time.Sleep(time.Minute)
			os.Exit(0)
		}
	}
}

func configureCallLogs(t *testing.T) string {
	t.Helper()
	previous := config.Get()
	t.Cleanup(func() { config.Set(previous) })
	config.Set(config.Config{Scratch: t.TempDir()})
	return config.FFmpegLogDir()
}

func helperCommand(t *testing.T, mode string, extra ...string) (string, []string) {
	t.Helper()
	executable, err := os.Executable()
	if err != nil {
		t.Fatal(err)
	}
	return executable, append([]string{"-test.run=^TestFFmpegHelperProcess$", "--", mode}, extra...)
}

func readCallLogs(t *testing.T, dir string) []callLogRecord {
	t.Helper()
	paths, err := filepath.Glob(filepath.Join(dir, "ffmpeg-*.log"))
	if err != nil {
		t.Fatal(err)
	}
	var records []callLogRecord
	for _, path := range paths {
		data, err := os.ReadFile(path)
		if err != nil {
			t.Fatal(err)
		}
		for _, line := range strings.Split(strings.TrimSpace(string(data)), "\n") {
			var record callLogRecord
			if err := json.Unmarshal([]byte(line), &record); err != nil {
				t.Fatalf("invalid JSON log: %v", err)
			}
			records = append(records, record)
		}
	}
	return records
}

func TestRunFFmpegLogsSuccessAndFailure(t *testing.T) {
	for _, mode := range []string{"success", "failed"} {
		t.Run(mode, func(t *testing.T) {
			dir := configureCallLogs(t)
			executable, args := helperCommand(t, mode, "path with spaces", "lyrics=line one\nline two")
			err := runFFmpeg(context.Background(), executable, args)
			records := readCallLogs(t, dir)
			if len(records) != 2 {
				t.Fatalf("records = %d, want 2", len(records))
			}
			start, finish := records[0], records[1]
			if start.Event != "start" || start.CallID == "" || start.Executable != executable || !reflect.DeepEqual(start.Args, args) {
				t.Fatalf("unexpected start: %+v", start)
			}
			if finish.Event != "finish" || finish.CallID != start.CallID || finish.Status != mode || finish.DurationMS == nil || *finish.DurationMS < 0 || finish.Time.Before(start.Time) {
				t.Fatalf("unexpected finish: %+v", finish)
			}
			if mode == "success" {
				if err != nil || finish.ExitCode == nil || *finish.ExitCode != 0 || finish.StderrTail != "" || finish.Error != "" {
					t.Fatalf("success = %+v, %v", finish, err)
				}
			} else {
				var exitErr *exec.ExitError
				if !errors.As(err, &exitErr) || finish.ExitCode == nil || *finish.ExitCode != 7 || finish.Error == "" {
					t.Fatalf("failure status = %+v, %v", finish, err)
				}
				if len(finish.StderrTail) != stderrTailLimit || !strings.HasSuffix(finish.StderrTail, "invalid input") {
					t.Fatal("failure must preserve only the bounded stderr tail")
				}
			}
		})
	}
}

func TestRunFFmpegTerminationPreservesDiagnostics(t *testing.T) {
	for _, status := range []string{"timeout", "canceled"} {
		t.Run(status, func(t *testing.T) {
			dir := configureCallLogs(t)
			ready := filepath.Join(t.TempDir(), "ready")
			executable, args := helperCommand(t, "wait", ready)
			ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
			defer cancel()
			if status == "canceled" {
				go func() {
					ticker := time.NewTicker(10 * time.Millisecond)
					defer ticker.Stop()
					for {
						select {
						case <-ctx.Done():
							return
						case <-ticker.C:
							if _, err := os.Stat(ready); err == nil {
								cancel()
								return
							}
						}
					}
				}()
			}
			err := runFFmpeg(ctx, executable, args)
			wantErr := context.DeadlineExceeded
			if status == "canceled" {
				wantErr = context.Canceled
			}
			records := readCallLogs(t, dir)
			if !errors.Is(err, wantErr) || len(records) != 2 {
				t.Fatalf("termination: %v, %d records", err, len(records))
			}
			finish := records[1]
			if finish.Status != status || finish.StderrTail != "diagnostic before termination" || finish.Error != wantErr.Error() {
				t.Fatalf("unexpected termination record: %+v", finish)
			}
		})
	}
}

func TestRunFFmpegStartFailure(t *testing.T) {
	dir := configureCallLogs(t)
	if err := runFFmpeg(context.Background(), filepath.Join(t.TempDir(), "missing-ffmpeg"), nil); err == nil {
		t.Fatal("expected executable start error")
	}
	records := readCallLogs(t, dir)
	if len(records) != 2 || records[1].Status != "failed" || records[1].ExitCode != nil || records[1].Error == "" {
		t.Fatalf("unexpected records: %+v", records)
	}
}

func TestRunFFmpegContinuesWhenLogCannotBeWritten(t *testing.T) {
	dir := configureCallLogs(t)
	if err := os.MkdirAll(filepath.Dir(dir), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(dir, []byte("not a directory"), 0600); err != nil {
		t.Fatal(err)
	}
	executable, args := helperCommand(t, "success")
	if err := runFFmpeg(context.Background(), executable, args); err != nil {
		t.Fatalf("logging must not prevent process success: %v", err)
	}
}

func TestConcurrentFFmpegCallsHaveSeparateRecords(t *testing.T) {
	dir := configureCallLogs(t)
	executable, args := helperCommand(t, "success")
	var wg sync.WaitGroup
	for range 6 {
		wg.Go(func() {
			if err := runFFmpeg(context.Background(), executable, args); err != nil {
				t.Errorf("run: %v", err)
			}
		})
	}
	wg.Wait()
	calls := map[string][]string{}
	for _, record := range readCallLogs(t, dir) {
		calls[record.CallID] = append(calls[record.CallID], record.Event)
	}
	if len(calls) != 6 {
		t.Fatalf("distinct calls = %d", len(calls))
	}
	for id, events := range calls {
		if !reflect.DeepEqual(events, []string{"start", "finish"}) {
			t.Fatalf("call %s events: %v", id, events)
		}
	}
}
