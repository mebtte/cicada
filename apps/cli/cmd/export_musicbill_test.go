package cmd

import (
	"os"
	"path/filepath"
	"testing"

	"cicada/internal/config"
	"cicada/internal/store"
)

func TestExportMusicbillToOriginal(t *testing.T) {
	dataDir := t.TempDir()
	config.Set(config.Config{Mode: config.ModeProduction, Data: dataDir})
	if err := store.Initialize(); err != nil {
		t.Fatalf("initialize store: %v", err)
	}
	t.Cleanup(func() {
		if err := store.ResetForTests(); err != nil {
			t.Fatalf("reset store: %v", err)
		}
	})

	userID, err := store.CreateUser("alice", "password", "")
	if err != nil {
		t.Fatalf("create user: %v", err)
	}

	musicbillID, err := store.CreateMusicbill(userID, "My / List")
	if err != nil {
		t.Fatalf("create musicbill: %v", err)
	}

	// 写入一个音乐资源文件到分片路径, 并建立 music + musicbill_music 关联.
	asset := "abcdef0123456789abcdef0123456789.mp3"
	assetDir, assetPath := config.AssetPath(config.AssetTypeMusic, asset)
	if err := os.MkdirAll(assetDir, 0755); err != nil {
		t.Fatalf("mkdir asset dir: %v", err)
	}
	if err := os.WriteFile(assetPath, []byte("fake audio bytes"), 0644); err != nil {
		t.Fatalf("write asset: %v", err)
	}
	musicID, err := store.CreateMusic("Song Title", store.MusicTypeSong, asset)
	if err != nil {
		t.Fatalf("create music: %v", err)
	}
	if err := store.AddMusicToMusicbill(musicbillID, musicID); err != nil {
		t.Fatalf("add music to musicbill: %v", err)
	}

	mb, err := store.GetMusicbillByID(musicbillID)
	if err != nil {
		t.Fatalf("get musicbill: %v", err)
	}

	destDir := t.TempDir()
	exported, skipped, err := exportMusicbillTo(mb, destDir, false, "")
	if err != nil {
		t.Fatalf("export: %v", err)
	}
	if exported != 1 || skipped != 0 {
		t.Fatalf("exported=%d skipped=%d, want 1/0", exported, skipped)
	}

	// 乐单名 "My / List" 中的非法字符应被过滤为子目录名 "My _ List".
	outFile := filepath.Join(destDir, "My _ List", "Song Title.mp3")
	content, err := os.ReadFile(outFile)
	if err != nil {
		t.Fatalf("read exported file: %v", err)
	}
	if string(content) != "fake audio bytes" {
		t.Fatalf("exported content = %q, want original bytes", content)
	}
}
