package importer

import (
	"cicada/internal/config"
	"cicada/internal/store"
	"crypto/md5"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/gabriel-vasile/mimetype"
)

var (
	successful int
	ignored    int
)

var musicMIMEs = map[string]bool{
	"audio/mpeg": true,
	"audio/flac": true,
	"audio/x-flac": true,
	"audio/m4a":  true,
	"audio/x-m4a": true,
	"audio/mp4":  true,
	"video/mp4":  true,
}

// Run imports music from source (file or directory) into the cicada data directory.
func Run(source, uid string, recursive, skipExistenceCheck bool) error {
	user, err := store.GetUserByID(uid)
	if err != nil {
		return fmt.Errorf("user [id=%s] doesn't exist", uid)
	}
	_ = user

	info, err := os.Stat(source)
	if err != nil {
		return fmt.Errorf("source not found: %s", source)
	}

	if info.IsDir() {
		err = importDir(source, uid, recursive, skipExistenceCheck)
	} else {
		err = importFile(source, uid, skipExistenceCheck)
	}

	fmt.Printf("\nSuccessful %d, ignored %d\n", successful, ignored)
	return err
}

func importDir(dir, uid string, recursive, skipExistenceCheck bool) error {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return err
	}
	for _, e := range entries {
		if strings.HasPrefix(e.Name(), ".") {
			continue
		}
		abs := filepath.Join(dir, e.Name())
		if e.IsDir() {
			if recursive {
				importDir(abs, uid, recursive, skipExistenceCheck)
			} else {
				log.Printf("[ %s ] is a directory, ignored (use -r to recurse)", abs)
				ignored++
			}
		} else {
			importFile(abs, uid, skipExistenceCheck)
		}
	}
	return nil
}

func importFile(path, uid string, skipExistenceCheck bool) error {
	data, err := os.ReadFile(path)
	if err != nil {
		log.Printf("[ %s ] cannot read: %v, ignored", path, err)
		ignored++
		return nil
	}

	mt := mimetype.Detect(data)
	mimeStr := mt.String()
	if i := strings.Index(mimeStr, ";"); i >= 0 {
		mimeStr = strings.TrimSpace(mimeStr[:i])
	}
	if !musicMIMEs[mimeStr] {
		log.Printf("[ %s ] not a valid music format (%s), ignored", path, mimeStr)
		ignored++
		return nil
	}

	// Parse metadata from filename as fallback
	base := filepath.Base(path)
	ext := filepath.Ext(base)
	name := strings.TrimSuffix(base, ext)
	if name == "" {
		name = "Unknown"
	}
	singers := []string{"Unknown"}

	// Try to extract title/artist from filename pattern: "Artist - Title"
	if parts := strings.SplitN(name, " - ", 2); len(parts) == 2 {
		singers = []string{strings.TrimSpace(parts[0])}
		name = strings.TrimSpace(parts[1])
	}

	if !skipExistenceCheck {
		exists, _ := checkMusicExists(name, singers)
		if exists {
			log.Printf("[ %s ] already in database, ignored (use --skip-existence-check to skip)", path)
			ignored++
			return nil
		}
	}

	// Save asset file
	hash := md5.Sum(data)
	assetName := fmt.Sprintf("%x%s", hash, ext)
	destPath := filepath.Join(config.AssetDir(config.AssetTypeMusic), assetName)
	if err := os.WriteFile(destPath, data, 0644); err != nil {
		log.Printf("[ %s ] failed to write asset: %v", path, err)
		ignored++
		return nil
	}

	musicID, err := store.CreateMusic(name, store.MusicTypeSong, uid, assetName)
	if err != nil {
		log.Printf("[ %s ] failed to create music: %v", path, err)
		ignored++
		return nil
	}

	for _, singerName := range singers {
		singerName = strings.TrimSpace(singerName)
		if singerName == "" {
			singerName = "Unknown"
		}
		singerID, _ := getOrCreateSinger(singerName, uid)
		store.DB().Exec(
			`INSERT OR IGNORE INTO music_singer_relation (musicId,singerId) VALUES (?,?)`,
			musicID, singerID,
		)
	}

	log.Printf("[ %s ] imported", path)
	successful++
	return nil
}

func checkMusicExists(name string, singers []string) (bool, error) {
	rows, err := store.DB().Query(`SELECT id FROM music WHERE name=?`, name)
	if err != nil {
		return false, err
	}
	defer rows.Close()

	var musicIDs []string
	for rows.Next() {
		var id string
		rows.Scan(&id)
		musicIDs = append(musicIDs, id)
	}
	rows.Close()

	if len(musicIDs) == 0 {
		return false, nil
	}

	dbSingers, _ := store.GetSingersInMusicIDs(musicIDs)
	for _, mid := range musicIDs {
		var names []string
		for _, s := range dbSingers {
			if s.MusicID == mid {
				names = append(names, s.Name)
			}
		}
		if sliceEqual(sortedCopy(names), sortedCopy(singers)) {
			return true, nil
		}
	}
	return false, nil
}

func getOrCreateSinger(name, uid string) (string, error) {
	var id string
	err := store.DB().QueryRow(`SELECT id FROM singer WHERE name=?`, name).Scan(&id)
	if err == nil {
		return id, nil
	}
	return store.CreateSinger(name, uid)
}

func sortedCopy(s []string) []string {
	cp := make([]string, len(s))
	copy(cp, s)
	// simple insertion sort
	for i := 1; i < len(cp); i++ {
		for j := i; j > 0 && cp[j] < cp[j-1]; j-- {
			cp[j], cp[j-1] = cp[j-1], cp[j]
		}
	}
	return cp
}

func sliceEqual(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

