package cmd

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
	"unicode/utf8"

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
	musicID, err := store.CreateMusic("Song? Title", store.MusicTypeSong, asset)
	if err != nil {
		t.Fatalf("create music: %v", err)
	}
	singerOneID, err := store.CreateArtist("Alice/One")
	if err != nil {
		t.Fatalf("create first artist: %v", err)
	}
	singerTwoID, err := store.CreateArtist("Bob:Two")
	if err != nil {
		t.Fatalf("create second artist: %v", err)
	}
	if err := store.ReplaceMusicArtistsByRole(musicID, store.MusicArtistRolePerformer, []string{singerOneID, singerTwoID}); err != nil {
		t.Fatalf("link performers: %v", err)
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
	outFile := filepath.Join(destDir, "My _ List", "Alice_One,Bob_Two - Song_ Title.mp3")
	content, err := os.ReadFile(outFile)
	if err != nil {
		t.Fatalf("read exported file: %v", err)
	}
	if string(content) != "fake audio bytes" {
		t.Fatalf("exported content = %q, want original bytes", content)
	}
}

func TestExportUsesSharedMusicFilenameRules(t *testing.T) {
	dataDir := t.TempDir()
	config.Set(config.Config{Mode: config.ModeProduction, Data: dataDir})
	if err := store.Initialize(); err != nil {
		t.Fatalf("initialize store: %v", err)
	}
	oldExportData := exportData
	exportData = dataDir
	t.Cleanup(func() {
		exportData = oldExportData
		if err := store.ResetForTests(); err != nil {
			t.Fatalf("reset store: %v", err)
		}
	})

	// 源资源按当前 AssetPath 分片存储, export 需要从分片路径读取.
	asset := "fedcba9876543210fedcba9876543210.flac"
	assetDir, assetPath := config.AssetPath(config.AssetTypeMusic, asset)
	if err := os.MkdirAll(assetDir, 0755); err != nil {
		t.Fatalf("mkdir asset dir: %v", err)
	}
	if err := os.WriteFile(assetPath, []byte("all music export"), 0644); err != nil {
		t.Fatalf("write asset: %v", err)
	}
	musicID, err := store.CreateMusic("Song <Title>|", store.MusicTypeSong, asset)
	if err != nil {
		t.Fatalf("create music: %v", err)
	}

	artistNames := []string{"A/One", "B:Two", "C*Three", "D?Four"}
	artistIDs := make([]string, 0, len(artistNames))
	for _, name := range artistNames {
		artistID, err := store.CreateArtist(name)
		if err != nil {
			t.Fatalf("create artist %q: %v", name, err)
		}
		artistIDs = append(artistIDs, artistID)
	}
	if err := store.ReplaceMusicArtistsByRole(musicID, store.MusicArtistRolePerformer, artistIDs); err != nil {
		t.Fatalf("link performers: %v", err)
	}

	destDir := t.TempDir()
	if err := runExport(nil, []string{destDir}); err != nil {
		t.Fatalf("export: %v", err)
	}

	outFile := filepath.Join(destDir, "A_One,B_Two,C_Three,... - Song _Title__.flac")
	content, err := os.ReadFile(outFile)
	if err != nil {
		t.Fatalf("read exported file: %v", err)
	}
	if string(content) != "all music export" {
		t.Fatalf("exported content = %q, want original bytes", content)
	}
}

func TestExportMusicbillFilenameLimitsPerformersAndSanitizes(t *testing.T) {
	base := exportMusicBaseName(
		[]string{"A/One", "B:Two", "C*Three", "D?Four"},
		"Song <Title>|",
	)
	used := map[string]bool{}

	filename := exportMusicFilename(used, base, ".flac", "")
	want := "A_One,B_Two,C_Three,... - Song _Title__.flac"
	if filename != want {
		t.Fatalf("filename = %q, want %q", filename, want)
	}
	if strings.Contains(filename, "D_Four") {
		t.Fatalf("filename = %q, want only first three performers plus ellipsis", filename)
	}
}

func TestExportMusicbillFilenameReservesTranscodeTempSuffix(t *testing.T) {
	base := strings.Repeat("歌手,", 120) + " - Song Title"
	used := map[string]bool{}

	filename := exportMusicFilename(used, base, ".mp3", transcodeTempSuffix)
	if len(filename+transcodeTempSuffix) > maxFilenameBytes {
		t.Fatalf("temp filename length = %d, want <= %d", len(filename+transcodeTempSuffix), maxFilenameBytes)
	}
	if !utf8.ValidString(filename) {
		t.Fatalf("filename is not valid utf8: %q", filename)
	}
	if !strings.HasSuffix(filename, ".mp3") {
		t.Fatalf("filename = %q, want .mp3 suffix", filename)
	}
}

func TestExportMusicbillFilenameReservesDedupSuffix(t *testing.T) {
	base := strings.Repeat("歌手,", 120) + " - Song Title"
	used := map[string]bool{}

	first := exportMusicFilename(used, base, ".mp3", transcodeTempSuffix)
	second := exportMusicFilename(used, base, ".mp3", transcodeTempSuffix)
	if first == second {
		t.Fatalf("duplicate filename = %q", second)
	}
	if len(second+transcodeTempSuffix) > maxFilenameBytes {
		t.Fatalf("dedup temp filename length = %d, want <= %d", len(second+transcodeTempSuffix), maxFilenameBytes)
	}
	if !strings.HasSuffix(second, " (2).mp3") {
		t.Fatalf("second filename = %q, want dedup suffix", second)
	}
	if !utf8.ValidString(second) {
		t.Fatalf("dedup filename is not valid utf8: %q", second)
	}
}
