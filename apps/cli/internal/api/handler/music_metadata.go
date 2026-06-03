package handler

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"cicada/internal/config"
	"cicada/internal/ffmpeg"
	"cicada/internal/store"
)

const musicMetadataWriteTimeout = 3 * time.Minute

func syncMusicMetadataToAsset(musicID string) {
	m, err := store.GetMusicByID(musicID)
	if err != nil {
		log.Printf("sync music metadata: get music %s: %v", musicID, err)
		return
	}

	_, sourcePath := config.AssetPath(config.AssetTypeMusic, m.Asset)
	if _, err := os.Stat(sourcePath); err != nil {
		log.Printf("sync music metadata: stat source %s: %v", sourcePath, err)
		return
	}

	metadata := ffmpeg.AudioMetadata{
		Title:  m.Name,
		Artist: musicArtist(musicID),
		Lyrics: musicLyrics(musicID),
	}
	if m.Year.Valid {
		metadata.Date = strconv.FormatInt(m.Year.Int64, 10)
	}

	coverPath := ""
	if m.Cover != "" {
		_, path := config.AssetPath(config.AssetTypeMusicCover, m.Cover)
		if _, err := os.Stat(path); err == nil {
			coverPath = path
		}
	}

	tmpPath, err := metadataTempPath(sourcePath)
	if err != nil {
		log.Printf("sync music metadata: create temp for %s: %v", sourcePath, err)
		return
	}
	defer os.Remove(tmpPath)

	ctx, cancel := context.WithTimeout(context.Background(), musicMetadataWriteTimeout)
	defer cancel()
	if err := ffmpeg.RewriteAudioMetadata(ctx, sourcePath, tmpPath, metadata, coverPath); err != nil {
		log.Printf("sync music metadata: rewrite %s: %v", sourcePath, err)
		return
	}
	if err := replaceFile(sourcePath, tmpPath); err != nil {
		log.Printf("sync music metadata: replace %s: %v", sourcePath, err)
	}
}

func musicArtist(musicID string) string {
	singers, err := store.GetSingersInMusicIDs([]string{musicID})
	if err != nil {
		log.Printf("sync music metadata: get singers for %s: %v", musicID, err)
		return ""
	}

	names := make([]string, 0, len(singers))
	for _, s := range singers {
		names = append(names, s.Name)
	}
	return strings.Join(names, ", ")
}

func musicLyrics(musicID string) string {
	lyrics, err := store.GetLyricsByMusicID(musicID)
	if err != nil {
		log.Printf("sync music metadata: get lyrics for %s: %v", musicID, err)
		return ""
	}

	lrcs := make([]string, 0, len(lyrics))
	for _, l := range lyrics {
		if l.LRC != "" {
			lrcs = append(lrcs, l.LRC)
		}
	}
	return strings.Join(lrcs, "\n\n")
}

func metadataTempPath(sourcePath string) (string, error) {
	dir := filepath.Dir(sourcePath)
	base := filepath.Base(sourcePath)
	ext := filepath.Ext(base)
	stem := strings.TrimSuffix(base, ext)
	if stem == "" {
		stem = "music"
	}

	f, err := os.CreateTemp(dir, fmt.Sprintf(".%s_metadata_*%s", stem, ext))
	if err != nil {
		return "", err
	}
	path := f.Name()
	if err := f.Close(); err != nil {
		os.Remove(path)
		return "", err
	}
	if err := os.Remove(path); err != nil {
		return "", err
	}
	return path, nil
}

func replaceFile(path, replacement string) error {
	dir := filepath.Dir(path)
	base := filepath.Base(path)
	backup, err := os.CreateTemp(dir, "."+base+"_backup_*")
	if err != nil {
		return err
	}
	backupPath := backup.Name()
	if err := backup.Close(); err != nil {
		os.Remove(backupPath)
		return err
	}
	if err := os.Remove(backupPath); err != nil {
		return err
	}

	if err := os.Rename(path, backupPath); err != nil {
		return err
	}
	if err := os.Rename(replacement, path); err != nil {
		_ = os.Rename(backupPath, path)
		return err
	}
	_ = os.Remove(backupPath)
	return nil
}
