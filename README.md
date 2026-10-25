# Paperworks 📄💼
> **Offline-First Cross-Platform Business Automation & Document Workstation**  
> *A free, privacy-preserving, zero-telemetry alternative to Adobe Acrobat Pro, Canva, and recurring SaaS billing software.*

[![Live Web App](https://img.shields.io/badge/Live_App-GitHub_Pages-4f46e5?style=for-the-badge&logo=github)](https://robfernan.github.io/Paperworks/)
[![Built with Bun](https://img.shields.io/badge/Built_with-Bun-fbf0df?style=for-the-badge&logo=bun)](https://bun.sh)
[![React 18](https://img.shields.io/badge/React-18.x-61dafb.svg?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.x-blue.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Desktop](https://img.shields.io/badge/Desktop-Wails_v2_(Go)-00ADD8.svg?style=for-the-badge&logo=go)](https://wails.io/)
[![Mobile](https://img.shields.io/badge/Mobile-Capacitor_Android-119EFF.svg?style=for-the-badge&logo=capacitor)](https://capacitorjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg?style=for-the-badge)](./LICENSE)

---

## 🌟 Executive Overview

**Paperworks** is an enterprise-grade document creation and manipulation workstation designed to operate **100% offline with zero cloud dependency and zero remote telemetry**. It delivers high-fidelity visual layout engines, native Word `.docx` generators, prepress print-ready PDF compilers, and advanced PDF annotation tools across Web (PWA), Desktop (Windows, macOS, Linux via Wails v2 + Go), and Mobile (Android via Capacitor).

Unlike web utilities (Smallpdf, iLovePDF) that upload sensitive contracts and financial forms to third-party servers, Paperworks compiles all documents directly inside your browser engine via WebAssembly (`pdf-lib` and `jsPDF`).

🔗 **Live Web Application**: [https://robfernan.github.io/Paperworks/](https://robfernan.github.io/Paperworks/)

---

## 🛡️ The 100% Zero-Cloud Privacy Moat

| Principle | How Paperworks Protects You |
| :--- | :--- |
| **0 Remote Network Requests** | All PDF manipulation, text extraction, and invoice calculations execute on your local CPU. |
| **Encrypted Local Storage** | Invoices, resume drafts, and business cards persist in browser `IndexedDB v3` or desktop `data/blobs`. |
| **Data Sovereignty** | 1-click JSON backup export/import allows complete vault migration without vendor lock-in. |
| **Immutable PDF Flattening** | Digitally signed and stamped documents are flattened into permanent vector bytes to prevent tampering. |

---

## 🚀 Professional Feature Suites

### 1. 💼 Invoice & Proposals Studio Pro
* **Service/Product Catalog:** Save preset goods and services with unique SKUs, descriptions, and default rates for instantaneous 1-click line-item insertion.
* **Global Multi-Currency:** Seamlessly switch currencies (`$`, `€`, `£`, `¥`, `CHF`, `C$`, `A$`, `₹`).
* **Deposit & Balance Tracking:** Log partial payments, tax rates, and discounts with live **Balance Due** computation.
* **Dual Native Export:** Generates print-ready PDFs and editable, professionally formatted Word documents (`.docx`) with embedded financial tables.

### 2. 📑 PDF Pro Advanced Annotation Suite
* **Client-Side Vector Engine:** Fast asynchronous chunked processing powered by `pdf-lib` and `jsPDF`.
* **Interactive Markup:** Overlay checkmarks, rectangles, highlight boxes, circles, and sticky notes with opacity controls.
* **Digital Signature Pad:** Draw or type vector signatures with a local signature vault for instant document placement.
* **Administrative Stamps:** One-click insertion of official seals (`APPROVED`, `CONFIDENTIAL`, `VOID`, `FINAL DRAFT`).
* **Prepress Page Manipulator:** Touch-friendly and drag-and-drop page reordering, individual page rotation (90° CW/CCW), and page extraction.

### 3. 📄 Executive Resume Studio
* **ATS-Friendly Formatting:** Guaranteed single-column vector layouts engineered to pass Applicant Tracking Systems with 100% accuracy.
* **Typography Engine:** Switch between **Modern Sans** (Inter), **Executive Serif** (Georgia/Times), and **Technical Mono** (Courier).
* **Curated Themes:** *Modern Sky*, *Classic Slate*, *Executive Blue*, *Minimalist Mono*, and *Forest Emerald*.
* **Native Word & PDF:** Dual export to `.docx` retaining layout structures alongside print-ready PDFs.

### 4. 📇 Business Card Studio Pro
* **Prepress 1/8" Print Bleed:** Commercial 3.75" × 2.25" sheets complete with corner crop marks and 0.125" safety margins.
* **Precision Coordinates:** ±0.05" X/Y coordinate nudge buttons with snap-to-grid alignment.
* **Curated Finishes:** Simulates physical card stocks: *Studio White*, *Bone Stock Ivory*, *Eggshell Linen*, *Obsidian Luxury*, and *Brushed Platinum*.

### 5. 🗄️ Document Vault & Snapshot History
* Point-in-time snapshot timeline (`useDocumentHistory`) providing deep undo/redo transaction states.
* Centralized searchable archive of all created documents with 1-click backup and restore.

---

## 📊 Comparison: Paperworks vs. Legacy Incumbents

| Capability | **Paperworks** | **Canva Pro** | **Adobe Acrobat Pro** | **Smallpdf** |
| :--- | :--- | :--- | :--- | :--- |
| **Price** | **Free Forever (MIT)** | \$15 / month | \$19.99–\$29.99 / mo | \$12 / month |
| **Privacy & Telemetry** | **100% Zero-Cloud** | Cloud Upload | Adobe Cloud Sync | Cloud Upload |
| **PDF Annotation & Sign** | **Included** | Limited | Yes | Yes (Limited) |
| **ATS Resume Builder** | **Included (.docx + PDF)** | Design-heavy (Fails ATS)| None | None |
| **Itemized Invoices** | **Included (.docx + PDF)** | Basic templates | None | None |
| **Commercial Print Bleed**| **Included (0.125")** | Pro Only | InDesign Only | None |
| **Command Palette (⌘K)** | **Included** | None | None | None |

---

## 🛠️ Architecture & Tech Stack

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

---

## ⚡ Quick Start & Development

```bash
# Clone repository
git clone https://github.com/robfernan/Paperworks.git
cd Paperworks

# Install dependencies with Bun
bun install

# Start local Vite development server
bun run dev

# Build production bundle
bun run build
```

---

## 📄 License
Licensed under the **MIT License**.
