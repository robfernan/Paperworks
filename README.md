# Paperworks

Paperworks is an offline-first, open-source document suite built with React + TypeScript.

It currently includes:
- Business Card Studio
- Invoice Studio
- Resume Builder
- PDF Pro
- Document Vault (cross-tool manager)

## Core principles

- Free and open source
- Works offline first
- User data stays local by default
- Cross-platform architecture (Web now, Wails/Capacitor next)

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

- Primary: IndexedDB
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
  - ESLint warnings from `react-refresh/only-export-components` in some UI helper files.
  - Bundle size warning for a large main chunk.

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
- Add `src/lib/platformBridge.ts` for Wails/Capacitor filesystem + SQLite adapters.
- Keep browser adapter as default fallback.

2. Large PDF optimization
- Move large binary storage from base64-in-browser to native file storage when running on desktop/mobile shells.

3. Performance and bundle splitting
- Lazy-load heavy tool routes.
- Split PDF-specific code paths for faster startup.

4. Reliability features
- Add autosave timeline + restore snapshots.
- Add undo/redo action history persistence for PDF operations.

5. Quality/security pipeline
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
