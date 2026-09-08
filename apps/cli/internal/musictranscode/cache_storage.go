package musictranscode

import (
	"encoding/json"
	"errors"
	"io"
	"os"
)

func writeSourceCache(asset, cachePath, tmpPath, contentType string) error {
	metaPath := SourceCacheMetadataPath(asset)
	tmpMetaPath := metaPath + ".tmp"
	_ = os.Remove(tmpMetaPath)

	meta := SourceCacheMetadata{ContentType: contentType}
	data, err := json.Marshal(meta)
	if err != nil {
		_ = os.Remove(tmpPath)
		return err
	}
	data = append(data, '\n')
	if err := os.WriteFile(tmpMetaPath, data, 0644); err != nil {
		_ = os.Remove(tmpPath)
		return err
	}

	if err := replaceFile(tmpPath, cachePath); err != nil {
		_ = os.Remove(tmpPath)
		_ = os.Remove(tmpMetaPath)
		return err
	}
	if err := replaceFile(tmpMetaPath, metaPath); err != nil {
		_ = os.Remove(cachePath)
		_ = os.Remove(tmpMetaPath)
		_ = os.Remove(metaPath)
		return err
	}
	return nil
}

func readSourceCacheMetadata(path string) (SourceCacheMetadata, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return SourceCacheMetadata{}, err
	}
	var meta SourceCacheMetadata
	if err := json.Unmarshal(data, &meta); err != nil {
		return SourceCacheMetadata{}, err
	}
	if meta.ContentType == "" {
		return SourceCacheMetadata{}, errors.New("missing source cache content type")
	}
	return meta, nil
}

// Cache files must be independent: their mtime records access without touching uploaded assets.
func copyFile(sourcePath, tmpPath string) error {
	in, err := os.Open(sourcePath)
	if err != nil {
		return err
	}
	defer in.Close()

	out, err := os.OpenFile(tmpPath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0644)
	if err != nil {
		return err
	}

	if _, err := io.Copy(out, in); err != nil {
		_ = out.Close()
		return err
	}
	return out.Close()
}

func replaceFile(tmpPath, targetPath string) error {
	if err := os.Rename(tmpPath, targetPath); err == nil {
		return nil
	}
	_ = os.Remove(targetPath)
	return os.Rename(tmpPath, targetPath)
}

func isRegularFile(path string) bool {
	info, err := os.Stat(path)
	return err == nil && info.Mode().IsRegular()
}
