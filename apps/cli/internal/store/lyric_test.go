package store

import (
	"cicada/internal/config"
	"testing"
	"time"
)

func TestLRCContent(t *testing.T) {
	lrc := "[ti:Title]\n[00:00.00][00:01.00] hello world \nplain line\n[01:02.03]"

	got := LRCContent(lrc)
	want := "hello world\nplain line"
	if got != want {
		t.Fatalf("LRCContent() = %q, want %q", got, want)
	}
}

func TestUpdateLyricsByMusicIDReplacesLyricsAndSearchContent(t *testing.T) {
	if err := ResetForTests(); err != nil {
		t.Fatalf("reset store: %v", err)
	}
	t.Cleanup(func() {
		if err := ResetForTests(); err != nil {
			t.Fatalf("cleanup store: %v", err)
		}
	})

	config.Set(config.Config{
		Mode:      config.ModeProduction,
		Data:      t.TempDir(),
		Port:      8000,
		JWTExpiry: int64(180 * 24 * 60 * 60 * 1000),
	})
	if err := Initialize(); err != nil {
		t.Fatalf("initialize store: %v", err)
	}

	now := time.Now().UnixMilli()
	if _, err := DB().Exec(
		`INSERT INTO user (id,username,password,nickname,joinTimestamp) VALUES (?,?,?,?,?)`,
		"user-1", "creator", DoubleMD5("password"), "Creator", now,
	); err != nil {
		t.Fatalf("insert user: %v", err)
	}
	if _, err := DB().Exec(
		`INSERT INTO music (id,type,name,asset,createUserId,createTimestamp) VALUES (?,?,?,?,?,?)`,
		"music-1", int(MusicTypeSong), "Song", "song.mp3", "user-1", now,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}
	if _, err := DB().Exec(
		`INSERT INTO lyric (musicId,lrc,lrcContent) VALUES (?,?,?)`,
		"music-1", "[00:00.00]old", "old",
	); err != nil {
		t.Fatalf("insert old lyric: %v", err)
	}

	err := UpdateLyricsByMusicID("music-1", []string{
		"[00:00.00]hello world",
		"[00:01.00]second line",
	})
	if err != nil {
		t.Fatalf("update lyrics: %v", err)
	}

	lyrics, err := GetLyricsByMusicID("music-1")
	if err != nil {
		t.Fatalf("get lyrics: %v", err)
	}
	if len(lyrics) != 2 {
		t.Fatalf("expected 2 lyrics, got %+v", lyrics)
	}
	if lyrics[0].LRC != "[00:00.00]hello world" || lyrics[0].LRCContent != "hello world" {
		t.Fatalf("unexpected first lyric: %+v", lyrics[0])
	}
	if lyrics[1].LRC != "[00:01.00]second line" || lyrics[1].LRCContent != "second line" {
		t.Fatalf("unexpected second lyric: %+v", lyrics[1])
	}

	total, ids, err := SearchMusicIDsByLyric("hello", 1, 10)
	if err != nil {
		t.Fatalf("search lyrics: %v", err)
	}
	if total != 1 || len(ids) != 1 || ids[0] != "music-1" {
		t.Fatalf("unexpected lyric search result: total=%d ids=%v", total, ids)
	}
}
