package main

import (
	"context"
	"errors"
	"os"
	"path/filepath"
)

// App struct
type App struct {
	ctx     context.Context
	dataDir string
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{dataDir: "data"}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	_ = os.MkdirAll(a.dataDir, 0o755)
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
