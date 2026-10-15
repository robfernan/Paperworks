package main

import (
	"context"
	"encoding/base64"
	"errors"
	"os"
	"path/filepath"
	"strings"
)

// App struct
type App struct {
	ctx      context.Context
	dataDir  string
	blobsDir string
}

// NewApp creates a new App application struct
func NewApp() *App {
	data := "data"
	return &App{
		dataDir:  data,
		blobsDir: filepath.Join(data, "blobs"),
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	_ = os.MkdirAll(a.dataDir, 0o755)
	_ = os.MkdirAll(a.blobsDir, 0o755)
}

// GetStorageItem retrieves a stored value by key
func (a *App) GetStorageItem(key string) (string, error) {
	if key == "" {
		return "", errors.New("empty key")
	}
	p := filepath.Join(a.dataDir, key+".json")
	b, err := os.ReadFile(p)
	if os.IsNotExist(err) {
		return "", nil
	}
	if err != nil {
		return "", err
	}
	return string(b), nil
}

// SetStorageItem stores a value by key
func (a *App) SetStorageItem(key, value string) error {
	if key == "" {
		return errors.New("empty key")
	}
	p := filepath.Join(a.dataDir, key+".json")
	return os.WriteFile(p, []byte(value), 0o644)
}

// RemoveStorageItem deletes a stored value by key
func (a *App) RemoveStorageItem(key string) error {
	if key == "" {
		return errors.New("empty key")
	}
	p := filepath.Join(a.dataDir, key+".json")
	if err := os.Remove(p); err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	return nil
}

// sanitizeFilename prevents directory traversal
func sanitizeFilename(name string) string {
	base := filepath.Base(name)
	base = strings.ReplaceAll(base, "..", "")
	return base
}

// SaveBinaryFile stores a binary file payload directly on disk to prevent memory overhead
func (a *App) SaveBinaryFile(filename string, base64Data string) (string, error) {
	cleanName := sanitizeFilename(filename)
	if cleanName == "" || cleanName == "." {
		return "", errors.New("invalid filename")
	}

	_ = os.MkdirAll(a.blobsDir, 0o755)
	targetPath := filepath.Join(a.blobsDir, cleanName)

	data, err := base64.StdEncoding.DecodeString(base64Data)
	if err != nil {
		return "", err
	}

	if err := os.WriteFile(targetPath, data, 0o644); err != nil {
		return "", err
	}

	return targetPath, nil
}

// ReadBinaryFile reads a stored binary file and returns its base64 string
func (a *App) ReadBinaryFile(filename string) (string, error) {
	cleanName := sanitizeFilename(filename)
	targetPath := filepath.Join(a.blobsDir, cleanName)

	data, err := os.ReadFile(targetPath)
	if err != nil {
		return "", err
	}

	return base64.StdEncoding.EncodeToString(data), nil
}

// DeleteBinaryFile removes a stored binary file from disk
func (a *App) DeleteBinaryFile(filename string) error {
	cleanName := sanitizeFilename(filename)
	targetPath := filepath.Join(a.blobsDir, cleanName)

	err := os.Remove(targetPath)
	if err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}

// ListBinaryFiles returns the list of all stored binary file identifiers
func (a *App) ListBinaryFiles() ([]string, error) {
	_ = os.MkdirAll(a.blobsDir, 0o755)
	entries, err := os.ReadDir(a.blobsDir)
	if err != nil {
		return nil, err
	}

	var results []string
	for _, entry := range entries {
		if !entry.IsDir() {
			results = append(results, entry.Name())
		}
	}
	return results, nil
}
