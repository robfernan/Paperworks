# PDF Editor

A comprehensive web-based PDF editor that allows you to manipulate PDF files with ease.

## Features

### 🔧 Core Functionality
- **Upload multiple PDF files**: Drag & drop or browse to upload multiple PDF files up to 10MB each
- **Merge PDFs**: Combine multiple PDF files into a single document
- **Visual page preview**: See all pages in a grid layout with thumbnails
- **Page selection**: Click to select/deselect pages for batch operations
- **Drag to reorder**: Drag and drop pages to rearrange them in any order

### ✏️ Text Operations
- **Add text to any page**: Insert custom text with configurable:
  - Font size (8-72pt)
  - Text color (color picker)
  - Position (X, Y coordinates)
  - Target page selection

### 📄 Page Management
- **Add blank pages**: Insert new empty pages at the end of the document
- **Delete pages**: Remove selected pages (cannot delete all pages)
- **Rotate pages**: Rotate selected pages 90° clockwise (perfect for fixing scanned documents)
- **Duplicate pages**: Create copies of selected pages
- **Reverse order**: Flip the entire document page order
- **Select all/none**: Quick selection tools for batch operations

### 💾 File Operations
- **Add more PDFs**: Add additional PDF files to the current document
- **Clear all**: Start over with a fresh document
- **Download edited PDF**: Save your edited document as a new PDF file

### ⌨️ Keyboard Shortcuts
- **Ctrl+A**: Select all pages
- **Delete**: Delete selected pages
- **Ctrl+D**: Duplicate selected pages
- **R**: Rotate selected pages

## How to Use

1. **Upload PDF(s)**
   - Click "Browse Files" or drag & drop PDF file(s) onto the upload area
   - Multiple files will be merged automatically
   - Each file is processed and page thumbnails will appear

2. **Arrange Pages**
   - **Drag and drop** page thumbnails to reorder them
   - Use "Reverse Order" to flip the entire document
   - Pages update in real-time as you move them

3. **Select Pages**
   - Click on any page thumbnail to select/deselect it
   - Selected pages will have a blue border and overlay
   - Multiple pages can be selected for batch operations
   - Use "Select All" or "Select None" for quick selection
   - **Keyboard shortcuts**: Ctrl+A to select all

4. **Edit Operations**
   - **Add Text**: Click "Add Text" button, configure text properties, and specify target page
   - **Add Blank Page**: Click "Add Blank Page" to insert a new page at the end
   - **Delete Pages**: Select pages and click "Delete Selected" or press Delete key
   - **Rotate Pages**: Select pages and click "Rotate Selected" or press R key
   - **Duplicate Pages**: Select pages and click "Duplicate Selected" or Ctrl+D

5. **File Operations**
   - **Add More PDFs**: Click "Add More PDFs" to merge additional PDF files
   - **Clear All**: Remove everything and start fresh

6. **Download**
   - Click "Download Edited PDF" to save your edited document

## Technical Details

### Libraries Used
- **PDF-lib**: For PDF manipulation (adding text, pages, rotation, deletion)
- **PDF.js**: For rendering PDF pages as canvas elements for preview
- **Modern CSS**: Responsive design with smooth animations and transitions

### Browser Support
- Modern browsers that support ES6+ and Canvas API
- Chrome, Firefox, Safari, Edge (latest versions)

### File Limitations
- Maximum file size: 10MB
- Supported format: PDF only
- Output format: PDF

## Installation

1. Clone or download this project
2. Open `index.html` in a modern web browser
3. No server setup required - runs entirely in the browser!

## Security & Privacy

- All PDF processing happens locally in your browser
- No files are uploaded to any server
- Your documents remain completely private

## Common Use Cases

- **Merging documents**: Combine multiple scanned pages or separate PDFs into one document
- **Fixing scanned documents**: Rotate pages that were scanned upside down or sideways
- **Reordering pages**: Drag and drop to arrange pages in the correct sequence
- **Adding annotations**: Insert text labels, signatures, or notes
- **Document cleanup**: Remove unwanted pages from PDFs
- **Template preparation**: Add blank pages for additional content
- **Quick edits**: Simple text additions without complex PDF editors
- **Creating duplicates**: Make copies of important pages within the same document

## Troubleshooting

### PDF won't load
- Ensure the file is a valid PDF (not corrupted)
- Check file size is under 10MB
- Try with a different PDF file

### Text appears in wrong position
- PDF coordinate system starts from bottom-left
- Higher Y values move text up
- Lower Y values move text down
- Adjust X/Y values in the text modal

### Pages won't rotate
- Ensure pages are selected (blue border visible)
- Some PDFs may have restrictions - try with a different file

### Download not working
- Ensure your browser allows downloads
- Check if popup blocker is interfering
- Try right-clicking the download button and "Save link as"

---

Made with ❤️ using modern web technologies. Perfect for quick PDF edits without needing heavy desktop software!
