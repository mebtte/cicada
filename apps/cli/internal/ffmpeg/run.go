package ffmpeg

import (
	"context"
	"errors"
	"fmt"
	"os/exec"
	"strings"
	"time"

	"cicada/internal/config"
	"github.com/google/uuid"
)

const stderrTailLimit = 16 * 1024

// runFFmpeg logs only process invocations; probes, cache hits and file copies
// never pass through here. Each retry receives its own call ID.
func runFFmpeg(ctx context.Context, executable string, args []string) error {
	dir := config.FFmpegLogDir()
	callID := "ffmpeg-" + uuid.NewString()
	started := time.Now()
	writeCallLog(dir, callLogRecord{
		Time: started, Event: "start", CallID: callID,
		Executable: executable, Args: args,
	})

	var stderr tailBuffer
	cmd := exec.CommandContext(ctx, executable, args...)
	cmd.Stderr = &stderr
	err := cmd.Run()
	finished := time.Now()
	duration := finished.Sub(started).Milliseconds()
	record := callLogRecord{
		Time: finished, Event: "finish", CallID: callID,
		Status: "success", DurationMS: &duration,
	}
	// A process that could not start has no exit code. Signal termination uses
	// Go's -1 exit code; status distinguishes timeout and cancellation.
	if cmd.ProcessState != nil {
		code := cmd.ProcessState.ExitCode()
		record.ExitCode = &code
	}
	if err != nil {
		record.Status = "failed"
		record.Error = err.Error()
		record.StderrTail = strings.TrimSpace(string(stderr.data))
		if ctxErr := ctx.Err(); ctxErr != nil {
			err = ctxErr
			record.Error = ctxErr.Error()
			if errors.Is(ctxErr, context.DeadlineExceeded) {
				record.Status = "timeout"
			} else {
				record.Status = "canceled"
			}
		} else if record.StderrTail != "" {
			err = fmt.Errorf("%w: %s", err, record.StderrTail)
		}
	}
	writeCallLog(dir, record)
	return err
}

// tailBuffer bounds diagnostic memory even when FFmpeg produces verbose output.
// os/exec waits for its stderr writer before Run returns, so reads need no lock.
type tailBuffer struct {
	data []byte
}

func (b *tailBuffer) Write(p []byte) (int, error) {
	n := len(p)
	if n >= stderrTailLimit {
		b.data = append(b.data[:0], p[n-stderrTailLimit:]...)
	} else {
		if excess := len(b.data) + n - stderrTailLimit; excess > 0 {
			copy(b.data, b.data[excess:])
			b.data = b.data[:len(b.data)-excess]
		}
		b.data = append(b.data, p...)
	}
	return n, nil
}
