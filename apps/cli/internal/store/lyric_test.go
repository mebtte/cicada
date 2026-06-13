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
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
	})
	if err := Initialize(); err != nil {
		t.Fatalf("initialize store: %v", err)
	}

	now := time.Now().UnixMilli()
	if _, err := DB().Exec(
		`INSERT INTO music (id,type,name,asset,createTimestamp) VALUES (?,?,?,?,?)`,
		"MUS001", int(MusicTypeSong), "Song", "song.mp3", now,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}
	if _, err := DB().Exec(
		`INSERT INTO lyric (musicId,lrc,lrcContent) VALUES (?,?,?)`,
		"MUS001", "[00:00.00]old", "old",
	); err != nil {
		t.Fatalf("insert old lyric: %v", err)
	}

	err := UpdateLyricsByMusicID("MUS001", []string{
		"[00:00.00]hello world",
		"[00:01.00]second line",
	})
	if err != nil {
		t.Fatalf("update lyrics: %v", err)
	}

	lyrics, err := GetLyricsByMusicID("MUS001")
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
	if total != 1 || len(ids) != 1 || ids[0] != "MUS001" {
		t.Fatalf("unexpected lyric search result: total=%d ids=%v", total, ids)
	}
}

func TestSearchMusicIDsByLyricRanksMatchesDeterministically(t *testing.T) {
	if err := ResetForTests(); err != nil {
		t.Fatalf("reset store: %v", err)
	}
	t.Cleanup(func() {
		if err := ResetForTests(); err != nil {
			t.Fatalf("cleanup store: %v", err)
		}
	})

	config.Set(config.Config{
		Mode: config.ModeProduction,
		Data: t.TempDir(),
		Port: 8000,
	})
	if err := Initialize(); err != nil {
		t.Fatalf("initialize store: %v", err)
	}

	now := time.Now().UnixMilli()
	if _, err := DB().Exec(
		`INSERT INTO music (id,type,name,asset,heat,createTimestamp) VALUES
			('SONG01',   ?, 'Exact',   'exact.mp3',   1,   ?),
			('SONG02',  ?, 'Prefix',  'prefix.mp3',  100, ?),
			('SONG03',?, 'Contains','contains.mp3',999, ?)`,
		int(MusicTypeSong), now-300,
		int(MusicTypeSong), now-200,
		int(MusicTypeSong), now-100,
	); err != nil {
		t.Fatalf("insert music: %v", err)
	}
	if _, err := DB().Exec(
		`INSERT INTO lyric (musicId,lrc,lrcContent) VALUES
			('SONG03','[00:00.00]say hello','say hello'),
			('SONG02','[00:00.00]hello world','hello world'),
			('SONG01','[00:00.00]hello','hello')`,
	); err != nil {
		t.Fatalf("insert lyrics: %v", err)
	}

	total, ids, err := SearchMusicIDsByLyric("hello", 1, 10)
	if err != nil {
		t.Fatalf("search lyrics: %v", err)
	}
	if total != 3 || len(ids) != 3 {
		t.Fatalf("unexpected lyric search result: total=%d ids=%v", total, ids)
	}
	want := []string{"SONG01", "SONG02", "SONG03"}
	for i := range want {
		if ids[i] != want[i] {
			t.Fatalf("unexpected order: got %v want %v", ids, want)
		}
	}
}
