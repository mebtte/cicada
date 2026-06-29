package handler

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"cicada/internal/api/apperr"
	"cicada/internal/config"
	"cicada/internal/musicasset"
	"cicada/internal/store"

	"github.com/gin-gonic/gin"
)

// helpers ---------------------------------------------------------------------

type apiResp struct {
	Code string          `json:"code"`
	Data json.RawMessage `json:"data"`
}

func setupChunkedTest(t *testing.T) {
	t.Helper()
	gin.SetMode(gin.TestMode)
	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
	})
}

func invokeChunkedHandler(t *testing.T, handler gin.HandlerFunc, method, path string, headers map[string]string, body []byte, userID string, params gin.Params) (*httptest.ResponseRecorder, apiResp) {
	t.Helper()
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	var reader *bytes.Reader
	if body != nil {
		reader = bytes.NewReader(body)
	} else {
		reader = bytes.NewReader(nil)
	}
	c.Request = httptest.NewRequest(method, path, reader)
	for k, v := range headers {
		c.Request.Header.Set(k, v)
	}
	if userID != "" {
		c.Set("authed_user", &store.User{ID: userID})
	}
	if params != nil {
		c.Params = params
	}
	handler(c)

	var resp apiResp
	if w.Body.Len() > 0 {
		if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
			t.Fatalf("decode response: %v", err)
		}
	}
	return w, resp
}

func sha256Hex(b []byte) string {
	h := sha256.Sum256(b)
	return hex.EncodeToString(h[:])
}

func initBody(at string, size int64, hash string, chunkSize int64, filename string) []byte {
	body, _ := json.Marshal(map[string]any{
		"assetType": at,
		"size":      size,
		"fileHash":  hash,
		"chunkSize": chunkSize,
		"filename":  filename,
	})
	return body
}

type initOK struct {
	UploadID      string `json:"uploadId"`
	Size          int64  `json:"size"`
	ReceivedBytes int64  `json:"receivedBytes"`
	ChunkSize     int64  `json:"chunkSize"`
	ExpiresAt     int64  `json:"expiresAt"`
	ID            string `json:"id"`
	Path          string `json:"path"`
}

// tests -----------------------------------------------------------------------

func TestPartialUploadInitCreatesSession(t *testing.T) {
	setupChunkedTest(t)

	payload := []byte("dummy music payload")
	hash := sha256Hex(payload)
	body := initBody(string(config.AssetTypeMusic), int64(len(payload)), hash, 1024, "song.mp3")

	w, resp := invokeChunkedHandler(t, InitPartialUpload, http.MethodPost,
		"/api/common/asset/upload",
		map[string]string{"Content-Type": "application/json"},
		body, "USER01", nil)

	if w.Code != http.StatusOK {
		t.Fatalf("status: %d", w.Code)
	}
	if resp.Code != apperr.Success {
		t.Fatalf("expected success, got %s", resp.Code)
	}
	var data initOK
	if err := json.Unmarshal(resp.Data, &data); err != nil {
		t.Fatalf("decode data: %v", err)
	}
	if data.UploadID == "" {
		t.Fatalf("expected uploadId")
	}
	if data.ReceivedBytes != 0 {
		t.Fatalf("expected receivedBytes 0, got %d", data.ReceivedBytes)
	}
	if data.Size != int64(len(payload)) {
		t.Fatalf("expected size %d, got %d", len(payload), data.Size)
	}
	if data.ExpiresAt == 0 {
		t.Fatalf("expected expiresAt")
	}
	if _, err := os.Stat(filepath.Join(musicasset.SessionDir(data.UploadID), musicasset.PartialUploadMetaFilename)); err != nil {
		t.Fatalf("session meta should exist: %v", err)
	}
}

func TestPartialUploadInitOversize(t *testing.T) {
	setupChunkedTest(t)

	maxSize, ok := config.AssetMaxSize(config.AssetTypeMusic, "")
	if !ok {
		t.Fatalf("expected music max size")
	}
	body := initBody(string(config.AssetTypeMusic), maxSize+1,
		sha256Hex([]byte("placeholder")), 1024, "big.mp3")

	_, resp := invokeChunkedHandler(t, InitPartialUpload, http.MethodPost,
		"/api/common/asset/upload",
		map[string]string{"Content-Type": "application/json"},
		body, "USER01", nil)

	if resp.Code != apperr.AssetOversize {
		t.Fatalf("expected %s, got %s", apperr.AssetOversize, resp.Code)
	}
}

func TestPartialUploadInitResumesSameUserSameFile(t *testing.T) {
	setupChunkedTest(t)

	payload := []byte("resumable")
	hash := sha256Hex(payload)
	body := initBody(string(config.AssetTypeMusic), int64(len(payload)), hash, 1024, "x.mp3")

	_, first := invokeChunkedHandler(t, InitPartialUpload, http.MethodPost,
		"/api/common/asset/upload",
		map[string]string{"Content-Type": "application/json"},
		body, "USER01", nil)
	if first.Code != apperr.Success {
		t.Fatalf("first init: %s", first.Code)
	}
	var firstData initOK
	_ = json.Unmarshal(first.Data, &firstData)

	// Append a chunk so receivedBytes > 0.
	rangeHdr := fmt.Sprintf("bytes 0-%d/%d", len(payload)-1, len(payload))
	_, putResp := invokeChunkedHandler(t, PutPartialUploadChunk, http.MethodPut,
		"/api/common/asset/upload/"+firstData.UploadID,
		map[string]string{"Content-Range": rangeHdr},
		payload, "USER01", gin.Params{{Key: "uploadId", Value: firstData.UploadID}})
	if putResp.Code != apperr.Success {
		t.Fatalf("put: %s", putResp.Code)
	}

	// Re-init with the same params: should resume and return receivedBytes>0.
	_, second := invokeChunkedHandler(t, InitPartialUpload, http.MethodPost,
		"/api/common/asset/upload",
		map[string]string{"Content-Type": "application/json"},
		body, "USER01", nil)
	if second.Code != apperr.Success {
		t.Fatalf("resume init: %s", second.Code)
	}
	var secondData initOK
	_ = json.Unmarshal(second.Data, &secondData)
	if secondData.UploadID != firstData.UploadID {
		t.Fatalf("expected same uploadId, got %s vs %s", firstData.UploadID, secondData.UploadID)
	}
	if secondData.ReceivedBytes != int64(len(payload)) {
		t.Fatalf("expected receivedBytes %d, got %d", len(payload), secondData.ReceivedBytes)
	}
}

func TestPartialUploadPutSequentialChunks(t *testing.T) {
	setupChunkedTest(t)

	payload := []byte("0123456789abcdef")
	hash := sha256Hex(payload)
	body := initBody(string(config.AssetTypeMusic), int64(len(payload)), hash, 4, "seq.mp3")

	_, init := invokeChunkedHandler(t, InitPartialUpload, http.MethodPost,
		"/api/common/asset/upload",
		map[string]string{"Content-Type": "application/json"},
		body, "USER01", nil)
	if init.Code != apperr.Success {
		t.Fatalf("init: %s", init.Code)
	}
	var initData initOK
	_ = json.Unmarshal(init.Data, &initData)

	// 4-byte chunks.
	for offset := 0; offset < len(payload); offset += 4 {
		end := offset + 3
		chunk := payload[offset : offset+4]
		rangeHdr := fmt.Sprintf("bytes %d-%d/%d", offset, end, len(payload))
		_, putResp := invokeChunkedHandler(t, PutPartialUploadChunk, http.MethodPut,
			"/api/common/asset/upload/"+initData.UploadID,
			map[string]string{"Content-Range": rangeHdr},
			chunk, "USER01", gin.Params{{Key: "uploadId", Value: initData.UploadID}})
		if putResp.Code != apperr.Success {
			t.Fatalf("put offset %d: %s", offset, putResp.Code)
		}
	}

	_, status := invokeChunkedHandler(t, GetPartialUpload, http.MethodGet,
		"/api/common/asset/upload/"+initData.UploadID,
		nil, nil, "USER01",
		gin.Params{{Key: "uploadId", Value: initData.UploadID}})
	if status.Code != apperr.Success {
		t.Fatalf("get: %s", status.Code)
	}
	var statusData struct {
		ReceivedBytes int64 `json:"receivedBytes"`
		Size          int64 `json:"size"`
	}
	_ = json.Unmarshal(status.Data, &statusData)
	if statusData.ReceivedBytes != int64(len(payload)) {
		t.Fatalf("expected %d, got %d", len(payload), statusData.ReceivedBytes)
	}
}

func TestPartialUploadCompleteAllowsMP3MIMEFallback(t *testing.T) {
	setupChunkedTest(t)

	originalProbe := probeUploadedMusicHasAudioStream
	t.Cleanup(func() {
		probeUploadedMusicHasAudioStream = originalProbe
	})
	probeUploadedMusicHasAudioStream = func(context.Context, string) (bool, error) {
		return false, nil
	}

	payload := append(
		[]byte("ID3\x03\x00\x00\x00\x00\x00\x00"),
		append([]byte{0xff, 0xfb, 0x90, 0x64}, bytes.Repeat([]byte{0}, 32)...)...,
	)
	hash := sha256Hex(payload)
	body := initBody(string(config.AssetTypeMusic), int64(len(payload)), hash, int64(len(payload)), "song.mp3")

	_, init := invokeChunkedHandler(t, InitPartialUpload, http.MethodPost,
		"/api/common/asset/upload",
		map[string]string{"Content-Type": "application/json"},
		body, "USER01", nil)
	if init.Code != apperr.Success {
		t.Fatalf("init: %s", init.Code)
	}
	var initData initOK
	_ = json.Unmarshal(init.Data, &initData)

	rangeHdr := fmt.Sprintf("bytes 0-%d/%d", len(payload)-1, len(payload))
	_, putResp := invokeChunkedHandler(t, PutPartialUploadChunk, http.MethodPut,
		"/api/common/asset/upload/"+initData.UploadID,
		map[string]string{"Content-Range": rangeHdr},
		payload, "USER01", gin.Params{{Key: "uploadId", Value: initData.UploadID}})
	if putResp.Code != apperr.Success {
		t.Fatalf("put: %s", putResp.Code)
	}

	_, complete := invokeChunkedHandler(t, CompletePartialUpload, http.MethodPost,
		"/api/common/asset/upload/"+initData.UploadID+"/complete",
		nil, nil, "USER01",
		gin.Params{{Key: "uploadId", Value: initData.UploadID}})
	if complete.Code != apperr.Success {
		t.Fatalf("complete: %s", complete.Code)
	}
}

func TestPartialUploadPutOutOfOrderReturnsCurrentOffset(t *testing.T) {
	setupChunkedTest(t)

	payload := []byte("abcdefgh")
	hash := sha256Hex(payload)
	body := initBody(string(config.AssetTypeMusic), int64(len(payload)), hash, 4, "ooo.mp3")

	_, init := invokeChunkedHandler(t, InitPartialUpload, http.MethodPost,
		"/api/common/asset/upload",
		map[string]string{"Content-Type": "application/json"},
		body, "USER01", nil)
	var initData initOK
	_ = json.Unmarshal(init.Data, &initData)

	// Skip the first chunk, try to upload bytes 4-7 first.
	chunk := payload[4:]
	rangeHdr := fmt.Sprintf("bytes 4-7/%d", len(payload))
	_, putResp := invokeChunkedHandler(t, PutPartialUploadChunk, http.MethodPut,
		"/api/common/asset/upload/"+initData.UploadID,
		map[string]string{"Content-Range": rangeHdr},
		chunk, "USER01", gin.Params{{Key: "uploadId", Value: initData.UploadID}})
	if putResp.Code != apperr.Success {
		t.Fatalf("expected success, got %s", putResp.Code)
	}
	var putData struct {
		ReceivedBytes int64 `json:"receivedBytes"`
		NextOffset    int64 `json:"nextOffset"`
	}
	_ = json.Unmarshal(putResp.Data, &putData)
	if putData.ReceivedBytes != 0 || putData.NextOffset != 0 {
		t.Fatalf("expected current offset 0, got receivedBytes=%d nextOffset=%d", putData.ReceivedBytes, putData.NextOffset)
	}
}

func TestPartialUploadOwnerIsolation(t *testing.T) {
	setupChunkedTest(t)

	payload := []byte("private")
	hash := sha256Hex(payload)
	body := initBody(string(config.AssetTypeMusic), int64(len(payload)), hash, 4, "p.mp3")

	_, init := invokeChunkedHandler(t, InitPartialUpload, http.MethodPost,
		"/api/common/asset/upload",
		map[string]string{"Content-Type": "application/json"},
		body, "USER01", nil)
	var initData initOK
	_ = json.Unmarshal(init.Data, &initData)

	// Different user attempts to read the session.
	_, status := invokeChunkedHandler(t, GetPartialUpload, http.MethodGet,
		"/api/common/asset/upload/"+initData.UploadID,
		nil, nil, "USER02",
		gin.Params{{Key: "uploadId", Value: initData.UploadID}})
	if status.Code != apperr.PartialUploadOwnerMismatch {
		t.Fatalf("expected %s, got %s", apperr.PartialUploadOwnerMismatch, status.Code)
	}
}

func TestPartialUploadRejectsInvalidUploadID(t *testing.T) {
	setupChunkedTest(t)

	_, resp := invokeChunkedHandler(t, GetPartialUpload, http.MethodGet,
		"/api/common/asset/upload/not-a-valid-upload-id",
		nil, nil, "USER01",
		gin.Params{{Key: "uploadId", Value: "not-a-valid-upload-id"}})
	if resp.Code != apperr.WrongParameter {
		t.Fatalf("expected %s, got %s", apperr.WrongParameter, resp.Code)
	}
}

func TestPartialUploadInitRejectsBadHash(t *testing.T) {
	setupChunkedTest(t)

	body := initBody(string(config.AssetTypeMusic), 16, "not-a-hex-hash", 4, "bad.mp3")
	_, resp := invokeChunkedHandler(t, InitPartialUpload, http.MethodPost,
		"/api/common/asset/upload",
		map[string]string{"Content-Type": "application/json"},
		body, "USER01", nil)
	if resp.Code != apperr.WrongParameter {
		t.Fatalf("expected %s, got %s", apperr.WrongParameter, resp.Code)
	}
}
