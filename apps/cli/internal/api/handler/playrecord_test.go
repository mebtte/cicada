package handler

import (
	"bytes"
	"cicada/internal/api/apperr"
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

func TestCreateMusicPlayRecordBeaconNormalizesPercent(t *testing.T) {
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

	now := time.Now().UnixMilli()
	if _, err := store.DB().Exec(
		`INSERT INTO user (id,username,password,nickname,joinTimestamp) VALUES (?,?,?,?,?)`,
		"user-1", "listener", store.DoubleMD5("password"), "Listener", now,
	); err != nil {
		t.Fatalf("insert user: %v", err)
	}
	if _, err := store.DB().Exec(
		`INSERT INTO music (id,type,name,asset,createUserId,createTimestamp) VALUES (?,?,?,?,?,?)`,
		"music-1", int(store.MusicTypeSong), "Song", "song.mp3", "user-1", now,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}

	token, tokenPrefix, tokenHash, err := auth.NewSessionToken()
	if err != nil {
		t.Fatalf("create session token: %v", err)
	}
	if _, err := store.CreateAuthSession(
		"user-1",
		tokenHash,
		tokenPrefix,
		"Test Device",
		"test-agent",
		"127.0.0.1",
	); err != nil {
		t.Fatalf("create auth session: %v", err)
	}

	body, err := json.Marshal(map[string]any{
		"token":   token,
		"musicId": "music-1",
		"percent": 1.0000001,
	})
	if err != nil {
		t.Fatalf("encode request: %v", err)
	}

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/base/music_play_record", bytes.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")

	CreateMusicPlayRecordBeacon(c)

	var resp struct {
		Code string `json:"code"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.Code != apperr.Success {
		t.Fatalf("expected success, got %s", resp.Code)
	}

	var percent float64
	if err := store.DB().QueryRow(`SELECT percent FROM music_play_record WHERE userId=? AND musicId=?`, "user-1", "music-1").Scan(&percent); err != nil {
		t.Fatalf("query play record: %v", err)
	}
	if percent != 1 {
		t.Fatalf("expected percent to be normalized to 1, got %v", percent)
	}

	var heat int64
	if err := store.DB().QueryRow(`SELECT heat FROM music WHERE id=?`, "music-1").Scan(&heat); err != nil {
		t.Fatalf("query music heat: %v", err)
	}
	if heat != 1 {
		t.Fatalf("expected heat to increment, got %d", heat)
	}
}
