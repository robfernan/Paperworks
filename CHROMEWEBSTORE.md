# Paperworks - Form Simplicity PDF Editor
## Chrome Web Store Listing & Compliance Metadata

**Last Updated:** November 2, 2026  
**Extension Name:** Paperworks - Form Simplicity PDF Editor  
**Version:** 1.0.0  
**Category:** Productivity / Workflow & Planning  

---

### 1. Store Listing Copy

#### Summary (max 132 chars)
Seamlessly intercept, fill, sign, and flatten real-estate contracts and PDF forms directly in your browser with Form Simplicity tools.

#### Detailed Description
Paperworks is an offline-first PDF editor engineered specifically for transaction workflows, real-estate contracts, and fast document signing.

Key Features:
- **Automatic PDF Interception:** Open any web PDF or local contract directly inside the Form Simplicity editor with a single click or keyboard shortcut.
- **Form Simplicity Toolset:**
  * Baseline Alignment Guide: Ensure typed text aligns cleanly with pre-printed document lines.
  * Auto-Shrink Text: Long text automatically scales down font size to fit neatly inside constrained form fields without overflowing.
  * Digital Signature & Initial Pads: Smooth bezier-curve signatures and stamp placement for multiple parties.
  * Checkmark and Crossmark Stamps: Rapidly fill checkboxes across multi-page disclosure packets.
  * Date Stamps: One-click current date stamping.
- **Transaction Parties Drawer:** Store Buyer, Seller, Property, and Escrow details for instant one-click auto-filling.
- **One-Click Flattening:** Permanently embed all annotations, signatures, and fields into an archival-grade, read-only PDF using `pdf-lib`.
- **100% Private & Offline-First:** All processing and cryptographic operations run locally on your device. Your contracts and client information never leave your machine.

---

### 2. Permissions Justification

| Permission | Plain-English Reason for Review Team |
| :--- | :--- |
| `declarativeNetRequest` | Used to redirect PDF preview URLs directly to the local Paperworks editor tab so users can immediately edit forms. |
| `storage` | Stores user transaction parties (Buyer, Seller, Property data) and offline preference toggles locally. |
| `contextMenus` | Provides the "Open and Fill in Paperworks" right-click option on links and PDF documents. |
| `activeTab` | Allows the user to load the current tab's PDF into Paperworks when triggered by user gesture. |
| `tabs` | Needed to open the Form Simplicity editor in a tab with the target document query parameters. |
| Host Permissions (`<all_urls>`, `file://*`) | Required to intercept online PDF contract links across any domain and allow users to open local PDFs stored on their machine. |

---

### 3. Privacy & Data Use
- **Remote Data Transmission:** None. Zero analytics, zero telemetric tracking, zero external server communication.
- **Data Collection:** The extension does not collect, sell, or transmit any user information or document contents.
- **Local Storage:** Only local draft states and form field preferences are stored in IndexedDB and `chrome.storage.local`.
