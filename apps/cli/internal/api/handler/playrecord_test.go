package handler

import (
	"bytes"
	"cicada/internal/api/apperr"
	"cicada/internal/api/middleware"
	"cicada/internal/auth"
	"cicada/internal/config"
	"cicada/internal/store"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

func TestCreateMusicPlayRecordUpsertsClientRecord(t *testing.T) {
	gin.SetMode(gin.TestMode)
	if err := store.ResetForTests(); err != nil {
		t.Fatalf("reset store: %v", err)
	}
	t.Cleanup(func() {
		if err := store.ResetForTests(); err != nil {
			t.Fatalf("cleanup store: %v", err)
		}
	})

	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
	})
	if err := store.Initialize(); err != nil {
		t.Fatalf("initialize store: %v", err)
	}

	now := time.Now().Add(-time.Minute).UnixMilli()
	if _, err := store.DB().Exec(
		`INSERT INTO user (id,username,password,nickname,joinTimestamp) VALUES (?,?,?,?,?)`,
		"USER01", "listener", store.DoubleMD5("password"), "Listener", now,
	); err != nil {
		t.Fatalf("insert user: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO music (id,type,name,asset,createTimestamp) VALUES (?,?,?,?,?)`,
		"MUS001", int(store.MusicTypeSong), "Song", "song.mp3", now,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}

	token, tokenPrefix, tokenHash, err := auth.NewSessionToken()
	if err != nil {
		t.Fatalf("create session token: %v", err)
	}
	if _, err := store.CreateAuthSession(
		"USER01",
		tokenHash,
		tokenPrefix,
		"Test Device",
	); err != nil {
		t.Fatalf("create auth session: %v", err)
	}

	router := gin.New()
	router.POST("/api/music_play_record", middleware.Auth(), CreateMusicPlayRecord)

	call := func(percent float64, playedAt int64) {
		t.Helper()

		body, err := json.Marshal(map[string]any{
			"musicId":        "MUS001",
			"clientRecordId": "client-record-1",
			"percent":        percent,
			"playedAt":       playedAt,
		})
		if err != nil {
			t.Fatalf("encode request: %v", err)
		}

		w := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodPost, "/api/music_play_record", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("x-cicada-token", token)
		router.ServeHTTP(w, req)

		var resp struct {
			Code string `json:"code"`
		}
		if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
			t.Fatalf("decode response: %v", err)
		}
		if resp.Code != apperr.Success {
			t.Fatalf("expected success, got %s", resp.Code)
		}
	}

	call(0.7, now)
	call(1.0000001, now+2000)
	call(0.8, now+1000)

	var percent float64
	var playedAt int64
	var count int
	if err := store.DB().QueryRow(
		`SELECT COUNT(1), MAX(percent), MAX(playedAt) FROM music_play_record WHERE userId=? AND musicId=? AND clientRecordId=?`,
		"USER01", "MUS001", "client-record-1",
	).Scan(&count, &percent, &playedAt); err != nil {
		t.Fatalf("query play record: %v", err)
	}
	if count != 1 {
		t.Fatalf("expected one play record, got %d", count)
	}
	if percent != 1 {
		t.Fatalf("expected percent to be normalized to 1, got %v", percent)
	}
	if playedAt != now+2000 {
		t.Fatalf("expected playedAt to keep latest play time, got %d", playedAt)
	}

	var heat int64
	if err := store.DB().QueryRow(`SELECT heat FROM music WHERE id=?`, "MUS001").Scan(&heat); err != nil {
		t.Fatalf("query music heat: %v", err)
	}
	if heat != 1 {
		t.Fatalf("expected heat to increment, got %d", heat)
	}
}
