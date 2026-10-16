# Paperworks 📄💼
> **Offline-First Cross-Platform Business Automation & Publishing Workstation**  
> *A free, open-source alternative to Adobe Acrobat Pro, InDesign, and recurring SaaS billing software.*

[![CI/CD Pipeline](https://github.com/robfernan/Paperworks/actions/workflows/ci.yml/badge.svg)](https://github.com/robfernan/Paperworks/actions)
[![TypeScript 5.x](https://img.shields.io/badge/TypeScript-5.x-blue.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 18](https://img.shields.io/badge/React-18.x-61dafb.svg?logo=react&logoColor=black)](https://react.dev/)
[![Vite 8](https://img.shields.io/badge/Vite-8.x-646CFF.svg?logo=vite&logoColor=white)](https://vite.dev/)
[![Wails v2](https://img.shields.io/badge/Desktop-Wails_v2_Go-00ADD8.svg?logo=go&logoColor=white)](https://wails.io/)
[![Capacitor Android](https://img.shields.io/badge/Mobile-Capacitor_Android-119EFF.svg?logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![Vitest](https://img.shields.io/badge/Tested_with-Vitest-FCC72B.svg?logo=vitest&logoColor=black)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🌟 Executive Overview

**Paperworks** is an enterprise-grade document creation and manipulation workstation designed to operate **100% offline with zero cloud dependency and zero telemetry**. It delivers high-fidelity visual layout engines, native Word `.docx` generators, prepress print-ready PDF compilers, and advanced PDF annotation tools across Web, Desktop (Windows, macOS, Linux via Wails v2 + Go), and Mobile (Android via Capacitor).

<div align="center">
  <img src="assets/screenshots/wails_desktop.png" alt="Wails Desktop Client" width="48%">
  <img src="assets/screenshots/wails_responsiveness.png" alt="Invoice Studio Wails" width="48%">
</div>

---

## 🏗️ Architecture & Storage Engine

Paperworks utilizes a unified, multi-tiered offline storage engine designed to prevent memory leaks, browser string overhead, and UI thread stutter.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Paperworks Presentation Layer                         │
│       React 18  •  TypeScript  •  Tailwind CSS  •  shadcn-ui Components      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                  Unified Document Core & Command Engine                     │
│   • Universal Command Palette (Ctrl+K / ⌘K)                                 │
│   • Deep Undo/Redo Transaction History (Ctrl+Z / Ctrl+Y)                    │
│   • Autosave Snapshot Timeline (IndexedDB v3 Stores)                        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    Platform Storage Bridge Abstraction                      │
│                           (src/lib/platformBridge.ts)                       │
├───────────────────────────────┬───────────────────────────────┬─────────────┤
│        Desktop (Wails)        │       Mobile (Capacitor)      │   Web/PWA   │
│   Go Native Binary Filesystem │   Capacitor Preferences API   │  IndexedDB  │
│    data/blobs direct disk I/O │   + Local Storage Fallback    │ Blob Store  │
└───────────────────────────────┴───────────────────────────────┴─────────────┘
```

### Key Architectural Tenets:
1. **Binary Offloading:** Heavy PDF payloads are decoupled from document metadata. On desktop shells, binaries are written directly to `data/blobs` on the local disk via Go backend routines (`SaveBinaryFile`, `ReadBinaryFile`), avoiding multi-megabyte base64 strings in JSON stores. On web runtimes, binaries are managed in dedicated IndexedDB object stores.
2. **Snapshot Revision History:** Every editor provides deep-state undo/redo transaction buffers and visual checkpoint timelines (`SnapshotTimeline`), allowing users to inspect and restore past revisions at any point.
3. **Universal Command Palette:** Pressing `Cmd+K` or `Ctrl+K` brings up global search across all documents, tools, and rapid document creation shortcuts.

---

## 🚀 Professional Feature Suites

### 1. 💼 Invoice & Proposals Studio Pro
- **Reusable Item/Service Catalog:** Save preset goods and services with unique SKUs, descriptions, and default rates for instantaneous 1-click line-item insertion.
- **Multi-Currency Support:** Seamlessly switch between global currencies (`$`, `€`, `£`, `¥`, `CHF`, `C$`, `A$`, `₹`).
- **Deposit & Down-Payment Tracking:** Log partial payments and deposits, dynamically calculating the real-time **Balance Due**.
- **Dual Native Export:** Generates print-ready PDFs and editable, professionally formatted Word documents (`.docx`) with embedded financial tables and company headers.

### 2. 📑 PDF Pro Advanced Annotation Suite
- **Asynchronous Chunked Processing:** High-performance PDF processing engine with progress bars for large documents.
- **Interactive Annotation Suite:** Overlay checkmarks, shape rectangles, highlight boxes, circles, and sticky text notes with customizable colors and opacity.
- **Digital Signature Library:** Integrated HTML5 signature pad with a saved signature vault for inserting reusable digital stamps.
- **Administrative Stamps & Cryptographic Sealing:** One-click insertion of official seals (`APPROVED`, `CONFIDENTIAL`, `VOID`, `FINAL DRAFT`) and cryptographic signature placeholder metadata.
- **Prepress Page Manipulator:** Touch-friendly and drag-and-drop page reordering, individual page rotation (90° CW/CCW), and page extraction.
- **Exact Coordinate Mapping:** All annotations map directly to PDF coordinate space and are permanently compiled into exported PDF bytes via `pdf-lib`.

### 3. 📄 Resume & Executive CV Studio
- **Template & Typography Engine:** Switch typography hierarchies between **Modern Sans** (Inter), **Executive Serif** (Georgia/Times), and **Technical Mono** (Courier).
- **Theme Palettes:** Curated color themes including *Modern Sky*, *Classic Slate*, *Executive Blue*, *Minimalist Mono*, and *Forest Emerald*.
- **Density Controls:** One-click toggle between standard comfortable spacing and **Compact 1-Page Layout**.
- **Native Word Export:** Instant export to `.docx` retaining typography fonts and accent colors, alongside vector PDF rendering.

### 4. 📇 Business Card Studio Pro (InDesign Grade)
- **Prepress 1/8" Print Bleed:** Toggleable 0.125" print bleed boundary exporting standard commercial 3.75" × 2.25" sheets complete with **corner crop marks**.
- **Safe Margin Guides:** Inset 0.125" cyan safety guides ensuring all vital typography avoids print guillotine trimming.
- **Granular Coordinate Controls:** Precision ±0.05" X/Y coordinate nudge buttons with snap-to-grid alignment.
- **Multi-Layer Edge Accents:** Customizable edge accent stripes (Left, Top, Bottom) in luxury hues (Amber Gold, Royal Indigo, Emerald Green, Crimson Red, Platinum).
- **Curated Finishes:** Simulates physical card stocks: *Studio White*, *Bone Stock Ivory*, *Eggshell Linen*, *Obsidian Luxury*, and *Brushed Platinum*.

### 5. 🗄️ Document Vault
- Centralized repository of all saved invoices, resumes, business cards, and PDF projects.
- Real-time search, filter by tool type, count statistics, and one-click JSON backup export/import.

---

## 🛠️ Getting Started & Local Development

### Prerequisites
- **Node.js:** v20.x or higher
- **npm:** v10.x or higher
- **Go:** v1.22+ (for Wails desktop builds)

### Installation
```bash
# Clone repository
git clone https://github.com/robfernan/Paperworks.git
cd Paperworks

# Install dependencies
npm install
```

### Running the Web App (Vite)
```bash
npm run dev
# App will be accessible at http://localhost:5173
```

### Running Desktop Shell (Wails + Go)
```bash
# Requires Wails CLI installed globally (go install github.com/wailsapp/wails/v2/cmd/wails@latest)
npm run wails:dev
```

### Running Mobile Target (Capacitor Android)
```bash
# Build production web bundle and sync native Android project
npm run cap:build

# Open project in Android Studio
npm run cap:android
```

---

## 🧪 Testing & Verification

The Paperworks test suite is powered by **Vitest**:

```bash
# Run all unit and integration tests
npm test

# Run tests in watch mode
npm run test:watch

# TypeScript typechecking
npm run typecheck

# Production bundle compilation
npm run build
```

---

## 🔒 Privacy, Security & Data Sovereignty

- **Zero Cloud Footprint:** No accounts, no subscriptions, no tracking pixels, and zero outbound network telemetries.
- **Local Native Disk Storage:** Your financial records, client lists, signatures, and confidential PDF agreements remain on your hardware under your control.
- **Pre-Press Compliant:** Output PDFs conform to PDF standards compatible with any commercial print shop.

---

## 📄 License

Paperworks is licensed under the [MIT License](LICENSE). Built for the community, businesses, and creators everywhere.
