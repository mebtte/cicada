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
	"audio/mpeg":   true,
	"audio/flac":   true,
	"audio/x-flac": true,
	"audio/m4a":    true,
	"audio/x-m4a":  true,
	"audio/mp4":    true,
	"video/mp4":    true,
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
	performers := []string{"Unknown"}

	// Try to extract title/artist from filename pattern: "Artist - Title"
	if parts := strings.SplitN(name, " - ", 2); len(parts) == 2 {
		performers = []string{strings.TrimSpace(parts[0])}
		name = strings.TrimSpace(parts[1])
	}

	if !skipExistenceCheck {
		exists, _ := checkMusicExists(name, performers)
		if exists {
			log.Printf("[ %s ] already in database, ignored (use --skip-existence-check to skip)", path)
			ignored++
			return nil
		}
	}

	// Save asset file
	hash := md5.Sum(data)
	assetName := fmt.Sprintf("%x%s", hash, ext)
	destDir, destPath := config.AssetPath(config.AssetTypeMusic, assetName)
	if err := os.MkdirAll(destDir, 0755); err != nil {
		log.Printf("[ %s ] failed to mkdir asset shard: %v", path, err)
		ignored++
		return nil
	}
	if err := os.WriteFile(destPath, data, 0644); err != nil {
		log.Printf("[ %s ] failed to write asset: %v", path, err)
		ignored++
		return nil
	}

	musicID, err := store.CreateMusic(name, store.MusicTypeSong, assetName)
	if err != nil {
		log.Printf("[ %s ] failed to create music: %v", path, err)
		ignored++
		return nil
	}

	artistIDs := make([]string, 0, len(performers))
	for _, performerName := range performers {
		performerName = strings.TrimSpace(performerName)
		if performerName == "" {
			performerName = "Unknown"
		}
		artistID, _ := getOrCreateArtist(performerName)
		artistIDs = append(artistIDs, artistID)
	}
	if err := store.ReplaceMusicArtistsByRole(musicID, store.MusicArtistRolePerformer, artistIDs); err != nil {
		log.Printf("[ %s ] failed to link performers: %v", path, err)
		ignored++
		return nil
	}

	log.Printf("[ %s ] imported", path)
	successful++
	return nil
}

func checkMusicExists(name string, performers []string) (bool, error) {
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

	dbPerformers, _ := store.GetArtistsInMusicIDsByRole(musicIDs, store.MusicArtistRolePerformer)
	for _, mid := range musicIDs {
		var names []string
		for _, performer := range dbPerformers {
			if performer.MusicID == mid {
				names = append(names, performer.Name)
			}
		}
		if sliceEqual(sortedCopy(names), sortedCopy(performers)) {
			return true, nil
		}
	}
	return false, nil
}

func getOrCreateArtist(name string) (string, error) {
	var id string
	err := store.DB().QueryRow(`SELECT id FROM artist WHERE name=?`, name).Scan(&id)
	if err == nil {
		return id, nil
	}
	return store.CreateArtist(name)
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
