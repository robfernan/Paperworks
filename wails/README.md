# Wails bridge scaffold

This folder documents the JS bridge contract used by `src/lib/platformBridge.ts`.

## Frontend expectations

When running in Wails, the frontend checks for:

- `window.runtime`
- `window.go.main.App.GetStorageItem(key)`
- `window.go.main.App.SetStorageItem(key, value)`
- `window.go.main.App.RemoveStorageItem(key)`

If these methods are unavailable, the app gracefully falls back to browser storage.

## Suggested backend implementation

Create a Wails app with methods that persist JSON blobs in SQLite or the filesystem.

### Example method signatures

- `func (a *App) GetStorageItem(key string) (string, error)`
- `func (a *App) SetStorageItem(key string, value string) error`
- `func (a *App) RemoveStorageItem(key string) error`

## Recommended architecture

- Keep metadata in SQLite (`documents` table).
- Keep large PDF binaries as files on disk.
- Store only file paths and hashes in metadata.
- Expose additional methods later for binary read/write and search.
