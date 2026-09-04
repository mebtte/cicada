package ffmpeg

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestCallLogRotatesUsingEventDate(t *testing.T) {
	dir := t.TempDir()
	start := time.Date(2026, 9, 4, 23, 59, 59, 0, time.FixedZone("CST", 8*60*60))
	for _, record := range []callLogRecord{
		{Time: start, Event: "start", CallID: "cross-midnight"},
		{Time: start.Add(2 * time.Second), Event: "finish", CallID: "cross-midnight"},
	} {
		if err := appendCallLog(dir, record); err != nil {
			t.Fatal(err)
		}
	}
	for date, event := range map[string]string{"2026-09-04": "start", "2026-09-05": "finish"} {
		data, err := os.ReadFile(filepath.Join(dir, "ffmpeg-"+date+".log"))
		if err != nil || !strings.Contains(string(data), `"event":"`+event+`"`) || strings.Count(string(data), "\n") != 1 {
			t.Fatalf("daily log %s = %s, %v", date, data, err)
		}
	}
}

func TestStderrTailAcrossChunkBoundaries(t *testing.T) {
	var buffer tailBuffer
	var full strings.Builder
	for _, chunk := range []string{strings.Repeat("a", 12000), strings.Repeat("b", 9000), "", strings.Repeat("c", 20000), "last diagnostic"} {
		full.WriteString(chunk)
		n, err := buffer.Write([]byte(chunk))
		if n != len(chunk) || err != nil {
			t.Fatalf("Write = %d, %v", n, err)
		}
		want := full.String()
		if len(want) > stderrTailLimit {
			want = want[len(want)-stderrTailLimit:]
		}
		if string(buffer.data) != want {
			t.Fatal("buffer lost the most recent diagnostic bytes")
		}
	}
}
