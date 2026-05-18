# Paperworks

Paperworks is an offline-first, open-source document suite built with React + TypeScript.

It currently includes:
- Business Card Studio
- Invoice Studio
- Resume Builder
- PDF Pro
- Document Vault (cross-tool manager)

## Screenshots

<div align="center">
  <img src="assets/screenshots/wails_desktop.png" alt="Wails Desktop Client" width="45%">
  <img src="assets/screenshots/wails_responsiveness.png" alt="Invoice Studio Wails" width="45%">
  <img src="assets/screenshots/capacitor_mobile.png" alt="Invoice Studio Capacitor" width="45%">
</div>

## Core principles

- Free and open source
- Works offline first
- User data stays local by default
- Cross-platform architecture (Web now, Wails/Capacitor next)

## Release: Multi-platform Beta

- Platforms supported: **Web (Vite)**, **Desktop (Wails)**, and **Mobile (Capacitor Android)** — all confirmed working in dev and production builds.
- Storage model: web-first (IndexedDB + localStorage fallback). We intentionally avoid introducing separate native storage layers to keep the application simple and consistent across platforms.
- How to run each platform:
  - Web (dev): `npm run dev -- --host`
  - Web (prod build): `npm run build`
  - Desktop (Wails dev): `wails dev` (requires Wails CLI & Go)
  - Mobile (Capacitor Android): `npm run build` then `npx cap sync android` and `npx cap open android` to run in Android Studio

This release focuses on a single, portable storage model and consistent UX across all platforms so users can jump between web, desktop and mobile without migration friction.

## Features

### 1) Business Card Studio
- Multi-document CRUD (create, open, update, duplicate, delete)
- Theme presets and text alignment presets
- Front/back card layouts
- Logo upload
- PDF export

### 2) Invoice Studio
- Multi-document CRUD
- Company/client sections and invoice metadata
- Dynamic line items with totals, tax, and discount
- Logo upload
- PDF export

### 3) Resume Builder
- Multi-document CRUD
- Dynamic experience/education/project sections
- Theme presets
- PDF export

### 4) PDF Pro
- Multi-project CRUD
- Load PDF and preview edited output
- Reorder pages and rotate pages
- Draw signature and stamp first page
- Download edited PDF

### 5) Document Vault
- Unified library for all saved tool documents
- Filter by tool type
- Deep-link open into each editor with `?doc=<id>`

## Storage model (offline-first)

- Primary (web): IndexedDB
- Native bridge (Android/Wails): key-value bridge storage via `src/lib/platformBridge.ts`
- Fallback: localStorage
- Shared abstraction: `src/lib/documentStore.ts`
- PDF bytes are currently stored in browser storage as base64 for portability.

## Why load/upload can look like a download

In browsers, file inputs and PDF previews may create temporary object URLs/blobs to render local files safely. This can appear like a duplicate file event depending on browser/device behavior.

What is expected in Paperworks:
- Loading a file should only import into app state.
- A real file download should only happen when you click explicit export actions (for example `Download Edited PDF` or PDF export buttons).

Hardening added:
- App `Button` now defaults to `type="button"` unless explicitly overridden, preventing accidental form submissions that can trigger unintended behavior in some flows.

## Security status

- Dependency vulnerabilities: **0** (verified with `npm audit` after dependency remediation).
- Current non-blocking issues:
  - Vite warning from `vite:react-swc` about an `esbuild` option deprecation.

## Native targets added

### Android (Capacitor)

Capacitor dependencies and config are now included:
- `@capacitor/core`
- `@capacitor/android`
- `@capacitor/preferences`
- `@capacitor/cli`
- `capacitor.config.ts`

Scripts:
- `npm run cap:build`
- `npm run cap:sync`
- `npm run cap:android`

First-time setup:

```bash
npm install
npm run build
npx cap add android
npm run cap:sync
npm run cap:android
```

### Desktop (Wails)

Frontend bridge contract is scaffolded and documented in `wails/README.md`.

Expected JS bridge methods from Wails backend:
- `GetStorageItem(key)`
- `SetStorageItem(key, value)`
- `RemoveStorageItem(key)`

Optional scripts (require Wails CLI installed globally):
- `npm run wails:dev`
- `npm run wails:build`

## Quick start

Requirements:
- Node.js 20+
- npm 10+

```bash
git clone https://github.com/robfernan/Paperworks.git
cd Paperworks
npm install
npm run dev -- --host
```

Build production assets:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## Update to GitHub

If you already have remote `origin` configured:

```bash
git add .
git commit -m "chore: security updates, docs refresh, and offline-suite hardening"
git push origin main
```

If no remote exists yet:

```bash
git remote add origin https://github.com/<your-user>/<your-repo>.git
git branch -M main
git push -u origin main
```

## What’s still missing (high impact)

1. Native storage bridge
- Add binary file APIs (read/write/delete) in Wails backend and Capacitor filesystem adapter.
- Keep metadata in native SQLite and store large PDFs on disk.

2. Large PDF optimization
- Move large binary storage from base64-in-browser to native file storage when running on desktop/mobile shells.

3. Performance and bundle splitting
- Keep route-level lazy loading and add per-tool component splitting.
- Split PDF-specific code paths for faster startup.

4. Responsive polish
- Add touch-first drag/reorder interactions for mobile PDF page ordering.
- Improve small-screen toolbars with stacked/floating actions.

5. Reliability features
- Add autosave timeline + restore snapshots.
- Add undo/redo action history persistence for PDF operations.

6. Quality/security pipeline
- Add CI for lint/build/test/audit.
- Add unit tests for `documentStore` and integration tests for tool CRUD flows.

## Recommended cross-platform stack

- Web/PWA: current Vite + React stack
- Desktop: Wails + Go backend for filesystem and PDF batch operations
- Mobile: Capacitor + Filesystem/SQLite plugins
- Shared app core: React UI + adapter-based storage/services

## Tech stack

- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn-ui
- `pdf-lib` and `jspdf`
- IndexedDB/localStorage persistence

## License

Paperworks © 2026
