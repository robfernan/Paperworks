
// Ensure all blocks are closed
class PDFEditor {
    constructor() {
        this.currentPDF = null;
        this.pdfDoc = null;
        this.selectedPages = new Set();
        this.pages = [];
        this.sourceFiles = []; // Track source files for merging
        this.draggedElement = null;
        this.needsPreviewUpdate = false;
        this.updateTimeout = null;
        this.isUpdating = false;
        this.loadingOperations = new Set();
        this.isDirty = false; // Track if PDF needs saving
        this.pageElements = new Map(); // Cache page elements
        this.actionHistory = []; // Undo/redo history
        this.currentHistoryIndex = -1;
        this.maxHistorySize = 20;
        this.isProcessingFiles = false;
        this.init();
    }

    init() {
        // Configure pdf.js worker if available to avoid deprecated warning
        if (window['pdfjsLib'] && pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
            // Use same CDN version already loaded
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
        this.setupEventListeners();
        this.setupDragAndDrop();
    }

    setupEventListeners() {
        // File input - now supports multiple files
        const fileInput = document.getElementById('fileInput');
        const browseBtn = document.getElementById('browseFilesBtn');
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Minimal, no throttling. Real user click on the overlaid input should open dialog.
        if (browseBtn) {
            browseBtn.addEventListener('click', (e) => {
                console.log('Browse button click -> openFileDialog');
                this.openFileDialog();
            });
        }
        
        // Control buttons - prevent default form submission behavior
        document.getElementById('addMorePDFsBtn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.addMorePDFs();
        });
        document.getElementById('clearAllBtn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.clearAll();
        });
        document.getElementById('undoBtn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.undo();
        });
        document.getElementById('redoBtn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.redo();
        });
        document.getElementById('addTextBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.openTextModal();
        });
        document.getElementById('addPageBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.addBlankPage();
        });
        document.getElementById('deleteSelectedBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.deleteSelectedPages();
        });
        document.getElementById('rotateSelectedBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.rotateSelectedPages();
        });
        document.getElementById('duplicateSelectedBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.duplicateSelectedPages();
        });
        document.getElementById('selectAllBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.selectAllPages();
        });
        document.getElementById('selectNoneBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.selectNonePages();
        });
        document.getElementById('reverseOrderBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.reversePageOrder();
        });
        document.getElementById('downloadBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.downloadPDF();
        });
        

        // Modal events
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('textModal')) {
                this.closeTextModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    }

    setupDragAndDrop() {
        const uploadArea = document.getElementById('uploadArea');
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.remove('dragover');
            }, false);
        });

        uploadArea.addEventListener('drop', this.handleDrop.bind(this), false);
    // Removed explicit click handler; overlaid transparent input handles direct user activation.
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    async handleFileSelect(e) {
        // Prevent multiple processing of the same files
        if (this.isProcessingFiles) {
            return;
        }
        
        const files = Array.from(e.target.files);
        if (files.length === 0) {
            return;
        }
        
        this.isProcessingFiles = true;
        try {
            await this.processFiles(files);
        } finally {
            this.isProcessingFiles = false;
            // Clear the input so the same file can be selected again
            e.target.value = '';
        }
    }

    async handleDrop(e) {
        if (this.isProcessingFiles) {
            return;
        }
        
        const files = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
        if (files.length > 0) {
            this.isProcessingFiles = true;
            try {
                await this.processFiles(files);
            } finally {
                this.isProcessingFiles = false;
            }
        } else {
            this.showStatus('Please drop valid PDF files', 'error');
        }
    }

    async processFiles(files) {
        this.showLoading(true, 'processing');
        
        try {
            // If this is the first load, create new PDF
            if (!this.pdfDoc) {
                this.pdfDoc = await PDFLib.PDFDocument.create();
                this.sourceFiles = [];
                this.pages = [];
                this.selectedPages.clear();
            }

            // Process each file
            for (const file of files) {
                if (file.size > 10 * 1024 * 1024) {
                    this.showStatus(`File ${file.name} is too large (max 10MB)`, 'error');
                    continue;
                }
                
                await this.mergeFile(file);
            }
            
            // Only do full render on initial load
            await this.updatePDFPreview();
            this.showControls();
            this.showStatus(`${files.length} PDF(s) processed successfully!`, 'success');
            
        } catch (error) {
            console.error('Error processing files:', error);
            this.showStatus('Error processing PDF files', 'error');
        } finally {
            this.showLoading(false, 'processing');
        }
    }

    async mergeFile(file) {
        const arrayBuffer = await file.arrayBuffer();
        const sourcePdf = await PDFLib.PDFDocument.load(arrayBuffer);
        
        this.sourceFiles.push({
            name: file.name,
            pageCount: sourcePdf.getPageCount()
        });

        // Copy all pages from source PDF
        const pageIndices = Array.from({ length: sourcePdf.getPageCount() }, (_, i) => i);
        const copiedPages = await this.pdfDoc.copyPages(sourcePdf, pageIndices);
        
        copiedPages.forEach(page => {
            this.pdfDoc.addPage(page);
        });
    }

    // Visual-only updates (no PDF regeneration)
    updateVisualOnly() {
        this.updateTargetPageOptions();
        this.updatePageInfo();
        this.setupPageDragAndDrop();
    }

    // Mark PDF as dirty but don't regenerate immediately
    markDirty() {
        this.isDirty = true;
    }

    // Undo/Redo system
    saveToHistory(action, data) {
        // Remove any future history if we're not at the end
        if (this.currentHistoryIndex < this.actionHistory.length - 1) {
            this.actionHistory = this.actionHistory.slice(0, this.currentHistoryIndex + 1);
        }
        
        // Add new action
        this.actionHistory.push({
            action,
            data,
            timestamp: Date.now()
        });
        
        // Limit history size
        if (this.actionHistory.length > this.maxHistorySize) {
            this.actionHistory.shift();
        } else {
            this.currentHistoryIndex++;
        }
        
        this.updateUndoRedoButtons();
    }
    
    undo() {
        if (this.currentHistoryIndex < 0) return;
        
        const action = this.actionHistory[this.currentHistoryIndex];
        this.applyReverseAction(action);
        this.currentHistoryIndex--;
        this.updateUndoRedoButtons();
        this.showStatus('Action undone', 'info');
    }
    
    redo() {
        if (this.currentHistoryIndex >= this.actionHistory.length - 1) return;
        
        this.currentHistoryIndex++;
        const action = this.actionHistory[this.currentHistoryIndex];
        this.applyAction(action);
        this.updateUndoRedoButtons();
        this.showStatus('Action redone', 'info');
    }
    
    updateUndoRedoButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        if (undoBtn) undoBtn.disabled = this.currentHistoryIndex < 0;
        if (redoBtn) redoBtn.disabled = this.currentHistoryIndex >= this.actionHistory.length - 1;
    }

    // Keyboard shortcuts
    handleKeyboardShortcuts(e) {
        // Ctrl+Z - Undo
        if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            this.undo();
        }
        // Ctrl+Y or Ctrl+Shift+Z - Redo
        else if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            this.redo();
        }
        // Ctrl+S - Save (download)
        else if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            this.downloadPDF();
        }
    }

    // (Zoom feature removed)

    // Only regenerate PDF when actually needed (download/export)
    async ensurePDFUpdated() {
        if (!this.isDirty) return;
        
        this.showLoading(true, 'processing');
        try {
            // Only now do we actually rebuild the PDF
            const pdfBytes = await this.pdfDoc.save();
            const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
            this.currentPDF = await loadingTask.promise;
            this.isDirty = false;
        } finally {
            this.showLoading(false, 'processing');
        }
    }

    // Fast visual page reordering without PDF regeneration
    visuallyMovePage(fromPageNum, toPageNum) {
        const container = document.getElementById('pagesContainer');
        const draggedElement = container.querySelector(`[data-page-num="${fromPageNum}"]`);
        const targetElement = container.querySelector(`[data-page-num="${toPageNum}"]`);
        
        if (draggedElement && targetElement) {
            // Visual reorder
            if (fromPageNum < toPageNum) {
                targetElement.parentNode.insertBefore(draggedElement, targetElement.nextSibling);
            } else {
                targetElement.parentNode.insertBefore(draggedElement, targetElement);
            }
            
            // Update visual page numbers
            this.updateVisualPageNumbers();
            this.markDirty();
        }
    }

    // Fast visual page deletion without PDF regeneration
    visuallyDeletePages(pageNums) {
        const container = document.getElementById('pagesContainer');
        
        pageNums.forEach(pageNum => {
            const element = container.querySelector(`[data-page-num="${pageNum}"]`);
            if (element) {
                element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                element.style.opacity = '0';
                element.style.transform = 'scale(0.8)';
                
                setTimeout(() => {
                    element.remove();
                    this.updateVisualPageNumbers();
                }, 300);
            }
        });
        
        this.markDirty();
        this.selectedPages.clear();
        this.updateControlButtons();
        this.updatePageInfo();
    }

    // Fast visual page rotation without PDF regeneration
    visuallyRotatePages(pageNums) {
        pageNums.forEach(pageNum => {
            const element = document.getElementById('pagesContainer').querySelector(`[data-page-num="${pageNum}"]`);
            if (element) {
                const canvas = element.querySelector('.page-canvas');
                if (canvas) {
                    // Get current rotation from data attribute or default to 0
                    let currentRotation = parseInt(canvas.dataset.rotation || '0');
                    
                    // Add 90 degrees
                    currentRotation = (currentRotation + 90) % 360;
                    
                    // Apply visual rotation
                    canvas.style.transform = `rotate(${currentRotation}deg)`;
                    canvas.dataset.rotation = currentRotation.toString();
                    
                    // Add rotation indicator
                    let rotationIndicator = element.querySelector('.rotation-indicator');
                    if (!rotationIndicator) {
                        rotationIndicator = document.createElement('div');
                        rotationIndicator.className = 'rotation-indicator';
                        rotationIndicator.style.cssText = [
                            'position: absolute;',
                            'top: 5px;',
                            'right: 5px;',
                            'background: rgba(255, 193, 7, 0.9);',
                            'color: white;',
                            'padding: 2px 6px;',
                            'border-radius: 12px;',
                            'font-size: 12px;',
                            'font-weight: bold;',
                            'z-index: 10;'
                        ].join(' ');
                        element.appendChild(rotationIndicator);
                    }
                    
                    // Update rotation indicator text
                    const rotationText = currentRotation === 0 ? '' : `${currentRotation}°`;
                    rotationIndicator.textContent = rotationText || '🔄';
                    
                    // Hide indicator if back to 0 degrees
                    if (currentRotation === 0) {
                        rotationIndicator.style.display = 'none';
                    } else {
                        rotationIndicator.style.display = 'block';
                    }
                }
            }
        });
        
        this.markDirty();
    }

    async updatePDFPreview() {
        if (this.isUpdating) {
            this.needsPreviewUpdate = true;
            return;
        }

        this.isUpdating = true;
        
        try {
            // Save the current PDF and reload for preview
            const pdfBytes = await this.pdfDoc.save();
            
            // Reload PDF.js document for rendering
            const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
            this.currentPDF = await loadingTask.promise;
            
            // Re-render pages
            await this.renderPages();
            
        } catch (error) {
            console.error('Error updating PDF preview:', error);
        } finally {
            this.isUpdating = false;
            
            // Check if another update is needed
            if (this.needsPreviewUpdate) {
                this.needsPreviewUpdate = false;
                setTimeout(() => this.updatePDFPreview(), 100);
            }
        }
    }

    async renderPages() {
        const container = document.getElementById('pagesContainer');
        container.innerHTML = '';
        
        const pageCount = this.currentPDF.numPages;
        this.pages = [];
        
        // Render pages in batches to avoid blocking the UI
        const batchSize = 5;
        
        for (let start = 1; start <= pageCount; start += batchSize) {
            const end = Math.min(start + batchSize - 1, pageCount);
            
            // Process batch
            const batchPromises = [];
            for (let i = start; i <= end; i++) {
                batchPromises.push(this.renderSinglePage(i));
            }
            
            try {
                const batchResults = await Promise.all(batchPromises);
                
                // Add rendered pages to container
                batchResults.forEach(({ pageItem, pageNum }) => {
                    if (pageItem) {
                        container.appendChild(pageItem);
                        this.pages.push({ pageNum, element: pageItem });
                    }
                });
                
                // Allow UI to update between batches
                if (end < pageCount) {
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
                
            } catch (error) {
                console.error(`Error rendering batch ${start}-${end}:`, error);
            }
        }
        
        this.updateTargetPageOptions();
        this.updatePageInfo();
        this.setupPageDragAndDrop();
    }

    async renderSinglePage(pageNum) {
        try {
            const page = await this.currentPDF.getPage(pageNum);
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            // Use lower scale for better performance
            const viewport = page.getViewport({ scale: 0.3 });
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
            
            const pageItem = this.createPageItem(canvas, pageNum);
            return { pageItem, pageNum };
            
        } catch (error) {
            console.error(`Error rendering page ${pageNum}:`, error);
            return { pageItem: null, pageNum };
        }
    }

    createPageItem(canvas, pageNum) {
        const pageItem = document.createElement('div');
        pageItem.className = 'page-item';
        pageItem.dataset.pageNum = pageNum;
        pageItem.draggable = true;
        
        const pageOverlay = document.createElement('div');
        pageOverlay.className = 'page-overlay';
        
        const pageInfo = document.createElement('div');
        pageInfo.className = 'page-info';
        pageInfo.textContent = `Page ${pageNum}`;
        
        canvas.className = 'page-canvas';
        
        pageItem.appendChild(canvas);
        pageItem.appendChild(pageOverlay);
        pageItem.appendChild(pageInfo);
        
        pageItem.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Prevent double-click issues
            if (this.lastClickTime && Date.now() - this.lastClickTime < 300) {
                return;
            }
            this.lastClickTime = Date.now();
            
            this.togglePageSelection(pageNum, pageItem);
        });
        
        return pageItem;
    }

    setupPageDragAndDrop() {
        const pageItems = document.querySelectorAll('.page-item');
        
        pageItems.forEach(item => {
            item.addEventListener('dragstart', this.handlePageDragStart.bind(this));
            item.addEventListener('dragover', this.handlePageDragOver.bind(this));
            item.addEventListener('drop', this.handlePageDrop.bind(this));
            item.addEventListener('dragenter', this.handlePageDragEnter.bind(this));
            item.addEventListener('dragleave', this.handlePageDragLeave.bind(this));
            item.addEventListener('dragend', this.handlePageDragEnd.bind(this));
        });
    }

    handlePageDragStart(e) {
        this.draggedElement = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.outerHTML);
    }

    handlePageDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handlePageDragEnter(e) {
        if (e.target !== this.draggedElement) {
            e.target.classList.add('drag-over');
        }
    }

    handlePageDragLeave(e) {
        e.target.classList.remove('drag-over');
    }

    async handlePageDrop(e) {
        e.preventDefault();
        
        if (e.target === this.draggedElement) {
            return;
        }
        
        const draggedPageNum = parseInt(this.draggedElement.dataset.pageNum);
        const targetPageNum = parseInt(e.target.closest('.page-item').dataset.pageNum);
        
        if (draggedPageNum !== targetPageNum) {
            // Only visual update - no PDF regeneration
            this.visuallyMovePage(draggedPageNum, targetPageNum);
            
            // Update the actual PDF data structure (but don't regenerate preview)
            this.updatePDFPageOrder(draggedPageNum, targetPageNum);
            
            // Suppress popup: previously showed 'Page moved! Changes will apply on download.'
        }
        
        e.target.classList.remove('drag-over');
    }

    // Update PDF structure to match the current visual order
    updatePDFPageOrder() {
        try {
            if (!this.pdfDoc) return;
            const container = document.getElementById('pagesContainer');
            const pageItems = Array.from(container.querySelectorAll('.page-item'));
            const oldPages = this.pdfDoc.getPages();
            // Map data-page-num to the correct PDF page index (1-based)
            const newOrder = pageItems.map(item => {
                const pageNum = parseInt(item.dataset.pageNum, 10);
                // data-page-num is 1-based, PDFLib pages array is 0-based
                return oldPages[pageNum - 1];
            });
            // Remove all pages
            while (this.pdfDoc.getPageCount() > 0) {
                this.pdfDoc.removePage(0);
            }
            // Add back in new order
            newOrder.forEach(page => {
                if (page) this.pdfDoc.addPage(page);
            });
            this.markDirty();
        } catch (error) {
            console.error('Error updating page order:', error);
        }
    }

    updateVisualPageNumbers() {
        const pageItems = document.querySelectorAll('.page-item');
        pageItems.forEach((item, index) => {
            const pageInfo = item.querySelector('.page-info');
            if (pageInfo) {
                pageInfo.textContent = `Page ${index + 1}`;
            }
            // Update dataset for consistency
            item.dataset.pageNum = index + 1;
        });
        
        // Update page count display
        this.updatePageInfo();
    }

    async deleteSelectedPages() {
        if (!this.pdfDoc) return;
        if (this.selectedPages.size === 0) return;
        const totalPages = this.pdfDoc.getPageCount();
        if (this.selectedPages.size >= totalPages) {
            this.showStatus('Cannot delete all pages', 'error');
            return;
        }
        try {
            // Visual deletion first
            const pagesToDelete = Array.from(this.selectedPages).sort((a, b) => b - a);
            this.visuallyDeletePages(pagesToDelete);
            // Remove selected page elements from DOM
            const container = document.getElementById('pagesContainer');
            pagesToDelete.forEach(pageNum => {
                const el = container.querySelector(`[data-page-num="${pageNum}"]`);
                if (el) el.remove();
            });
            // Rebuild PDF structure to match new visual order
            this.updatePDFPageOrder();
            // Rebuild preview
            await this.updatePDFPreview();
            this.selectedPages.clear();
            this.updatePageInfo();
        } catch (error) {
            console.error('Error deleting pages:', error);
            this.showStatus('Error deleting pages', 'error');
        }
    }

    async rotateSelectedPages() {
        if (this.selectedPages.size === 0) {
            this.showStatus('Please select pages to rotate', 'error');
            return;
        }
        try {
            // Get current visual order
            const container = document.getElementById('pagesContainer');
            const pageItems = Array.from(container.querySelectorAll('.page-item'));
            const pages = this.pdfDoc.getPages();
            pageItems.forEach((item, idx) => {
                const pageNum = idx + 1;
                if (this.selectedPages.has(pageNum)) {
                    const page = pages[idx];
                    const currentRotation = page.getRotation().angle;
                    page.setRotation(PDFLib.degrees(currentRotation + 90));
                }
            });
            this.visuallyRotatePages(Array.from(this.selectedPages));
            this.markDirty();
                if (changed) {
                    this.markDirty();
                    // Only update preview if user is about to download, not on every rotate
                }
        } catch (error) {
            console.error('Error rotating pages:', error);
            this.showStatus('Error rotating pages', 'error');
        }
    }

    handlePageDragEnd(e) {
        e.target.classList.remove('dragging');
        document.querySelectorAll('.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
        this.draggedElement = null;
        // After drag-and-drop, update PDF structure to match new visual order
            this.updatePDFPageOrder();
            // Only update the preview if the order actually changed
            this.updateVisualPageNumbers();
            this.markDirty();
    }

    togglePageSelection(pageNum, pageItem) {
        if (this.selectedPages.has(pageNum)) {
            this.selectedPages.delete(pageNum);
            pageItem.classList.remove('selected');
        } else {
            this.selectedPages.add(pageNum);
            pageItem.classList.add('selected');
        }
        
        this.updateControlButtons();
        this.updatePageInfo();
    }

    updateControlButtons() {
        const hasSelection = this.selectedPages.size > 0;
        document.getElementById('deleteSelectedBtn').disabled = !hasSelection;
        document.getElementById('rotateSelectedBtn').disabled = !hasSelection;
        document.getElementById('duplicateSelectedBtn').disabled = !hasSelection;
    }

    updatePageInfo() {
        const pageCount = this.currentPDF ? this.currentPDF.numPages : 0;
        const selectedCount = this.selectedPages.size;
        
        document.getElementById('pageCount').textContent = `${pageCount} page${pageCount !== 1 ? 's' : ''}`;
        document.getElementById('selectedCount').textContent = `${selectedCount} selected`;
        
        // Show file size estimate
        this.updateFileSizeEstimate();
    }

    async updateFileSizeEstimate() {
        if (!this.pdfDoc) return;
        
        try {
            const pdfBytes = await this.pdfDoc.save();
            const sizeInMB = (pdfBytes.length / (1024 * 1024)).toFixed(2);
            
            let sizeElement = document.getElementById('fileSize');
            if (!sizeElement) {
                sizeElement = document.createElement('span');
                sizeElement.id = 'fileSize';
                const infoContainer = document.querySelector('.preview-info');
                if (infoContainer) {
                    infoContainer.appendChild(document.createTextNode(' • '));
                    infoContainer.appendChild(sizeElement);
                }
            }
            sizeElement.textContent = `${sizeInMB} MB`;
        } catch (error) {
            // Silently fail - this is just informational
        }
    }

    showControls() {
        document.getElementById('controlPanel').style.display = 'block';
        document.getElementById('previewSection').style.display = 'block';
    }

    // New methods for additional features
    // File dialog methods with proper handling
    openFileDialog() {
        const input = document.getElementById('fileInput');
        if (!input) return;
        input.value = '';
        // Prefer showPicker if present, else click
        if (typeof input.showPicker === 'function') {
            try { input.showPicker(); return; } catch (_) {}
        }
        input.click();
    }

    addMorePDFs() {
        this.openFileDialog();
    }

    async clearAll() {
        if (!confirm('Are you sure you want to clear all PDFs and start over?')) {
            return;
        }
        
        this.currentPDF = null;
        this.pdfDoc = null;
        this.selectedPages.clear();
        this.pages = [];
        this.sourceFiles = [];
        
        document.getElementById('pagesContainer').innerHTML = '';
        document.getElementById('controlPanel').style.display = 'none';
        document.getElementById('previewSection').style.display = 'none';
        document.getElementById('fileInput').value = '';
        
        this.showStatus('All PDFs cleared', 'info');
    }

    selectAllPages() {
        if (!this.currentPDF) return;
        
        this.selectedPages.clear();
        for (let i = 1; i <= this.currentPDF.numPages; i++) {
            this.selectedPages.add(i);
        }
        
        document.querySelectorAll('.page-item').forEach(item => {
            item.classList.add('selected');
        });
        
        this.updateControlButtons();
        this.updatePageInfo();
    }

    selectNonePages() {
        this.selectedPages.clear();
        
        document.querySelectorAll('.page-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
        
        this.updateControlButtons();
        this.updatePageInfo();
    }

    async reversePageOrder() {
        if (!this.pdfDoc) {
            this.showStatus('No PDF loaded', 'error');
            return;
        }

        try {
            // Visual reverse first
            const container = document.getElementById('pagesContainer');
            const pageItems = Array.from(container.querySelectorAll('.page-item'));
            
            // Reverse the visual order
            pageItems.reverse().forEach(item => {
                container.appendChild(item);
            });
            
            this.updateVisualPageNumbers();
            
            // Update PDF structure
            const pages = this.pdfDoc.getPages();
            const reversedPages = [...pages].reverse();
            
            // Clear and re-add pages in reversed order
            while (this.pdfDoc.getPageCount() > 0) {
                this.pdfDoc.removePage(0);
            }
            
            for (const page of reversedPages) {
                this.pdfDoc.addPage(page);
            }
            
            this.selectedPages.clear();
            this.markDirty();
            this.updateControlButtons();
            
            // Suppress popup: order reversed
            
        } catch (error) {
            console.error('Error reversing pages:', error);
            this.showStatus('Error reversing page order', 'error');
        }
    }

    async duplicateSelectedPages() {
        if (this.selectedPages.size === 0) {
            this.showStatus('Please select pages to duplicate', 'error');
            return;
        }

        try {
            const container = document.getElementById('pagesContainer');
            const pagesToDuplicate = Array.from(this.selectedPages).sort((a, b) => a - b);

            // Visual duplication - clone elements
            pagesToDuplicate.forEach(pageNum => {
                const originalElement = container.querySelector(`[data-page-num="${pageNum}"]`);
                if (originalElement) {
                    const duplicateElement = originalElement.cloneNode(true);

                    // Add duplicate indicator
                    const duplicateIndicator = document.createElement('div');
                    duplicateIndicator.className = 'duplicate-indicator';
                    duplicateIndicator.textContent = 'COPY';
                    duplicateIndicator.style.cssText = [
                        'position: absolute;',
                        'top: 5px;',
                        'left: 5px;',
                        'background: rgba(40, 167, 69, 0.9);',
                        'color: white;',
                        'padding: 2px 8px;',
                        'border-radius: 12px;',
                        'font-size: 10px;',
                        'font-weight: bold;',
                        'z-index: 10;'
                    ].join(' ');
                    duplicateElement.appendChild(duplicateIndicator);

                    // Insert after original
                    originalElement.parentNode.insertBefore(duplicateElement, originalElement.nextSibling);
                }
            });

            this.updateVisualPageNumbers();

            // Update PDF structure
            for (const pageNum of pagesToDuplicate) {
                const [copiedPage] = await this.pdfDoc.copyPages(this.pdfDoc, [pageNum - 1]);
                this.pdfDoc.addPage(copiedPage);
            }

            this.selectedPages.clear();
            this.markDirty();
            this.updateControlButtons();

            // Suppress popup: pages duplicated

        } catch (error) {
            console.error('Error duplicating pages:', error);
            this.showStatus('Error duplicating pages', 'error');
        }
    }

    openTextModal() {
        if (!this.pdfDoc) {
            this.showStatus('Please load a PDF first', 'error');
            return;
        }
        document.getElementById('textModal').style.display = 'block';
    }

    closeTextModal() {
        document.getElementById('textModal').style.display = 'none';
    }

    updateTargetPageOptions() {
        const select = document.getElementById('targetPage');
        select.innerHTML = '';
        
        const pageCount = this.currentPDF ? this.currentPDF.numPages : 0;
        
        for (let i = 1; i <= pageCount; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = 'Page ' + i;
            select.appendChild(option);
        }
    }

    async addTextToPDF() {
        const textContent = document.getElementById('textContent').value.trim();
        if (!textContent) {
            this.showStatus('Please enter text content', 'error');
            return;
        }

        this.showLoading(true);
        
        try {
            const fontSize = parseInt(document.getElementById('textSize').value);
            const textColor = document.getElementById('textColor').value;
            const x = parseInt(document.getElementById('textX').value);
            const y = parseInt(document.getElementById('textY').value);
            const pageIndex = parseInt(document.getElementById('targetPage').value) - 1;

            // Convert hex color to RGB
            const rgb = this.hexToRgb(textColor);
            
            const pages = this.pdfDoc.getPages();
            const targetPage = pages[pageIndex];
            
            targetPage.drawText(textContent, {
                x: x,
                y: y,
                size: fontSize,
                color: PDFLib.rgb(rgb.r / 255, rgb.g / 255, rgb.b / 255),
            });

            // Visual indicator already added above
            this.markDirty();
            
            this.closeTextModal();
            // Suppress popup: text added
            
        } catch (error) {
            console.error('Error adding text:', error);
            this.showStatus('Error adding text to PDF', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async addBlankPage() {
        if (!this.pdfDoc) {
            this.showStatus('Please load a PDF first', 'error');
            return;
        }

        try {
            // Add blank page to PDF
            this.pdfDoc.addPage();
            
            // Create visual representation
            const container = document.getElementById('pagesContainer');
            const newPageNum = container.children.length + 1;
            
            // Create blank page visual
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 200;
            canvas.height = 280;
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.strokeStyle = '#ddd';
            context.strokeRect(0, 0, canvas.width, canvas.height);
            
            // Add "BLANK" text
            context.fillStyle = '#999';
            context.font = '16px Arial';
            context.textAlign = 'center';
            context.fillText('BLANK PAGE', canvas.width / 2, canvas.height / 2);
            
            const pageItem = this.createPageItem(canvas, newPageNum);
            container.appendChild(pageItem);
            
            this.updateVisualPageNumbers();
            this.markDirty();
            
            // Suppress popup: blank page added
            
        } catch (error) {
            console.error('Error adding blank page:', error);
            this.showStatus('Error adding blank page', 'error');
        }
    }

    async addTextToPDF() {
        const textContent = document.getElementById('textContent').value.trim();
        if (!textContent) {
            this.showStatus('Please enter text content', 'error');
            return;
        }

        try {
            const fontSize = parseInt(document.getElementById('textSize').value);
            const textColor = document.getElementById('textColor').value;
            const x = parseInt(document.getElementById('textX').value);
            const y = parseInt(document.getElementById('textY').value);
            const pageIndex = parseInt(document.getElementById('targetPage').value) - 1;

            // Convert hex color to RGB
            const rgb = this.hexToRgb(textColor);
            
            const pages = this.pdfDoc.getPages();
            const targetPage = pages[pageIndex];
            
            targetPage.drawText(textContent, {
                x: x,
                y: y,
                size: fontSize,
                color: PDFLib.rgb(rgb.r / 255, rgb.g / 255, rgb.b / 255),
            });

            // Add visual indicator to the page
            const pageElement = document.querySelector('[data-page-num="' + (pageIndex + 1) + '"]');
            if (pageElement) {
                let textIndicator = pageElement.querySelector('.text-indicator');
                if (!textIndicator) {
                    textIndicator = document.createElement('div');
                    textIndicator.className = 'text-indicator';
                    textIndicator.textContent = 'T';
                    textIndicator.style.cssText = [
                        'position: absolute;',
                        'top: 5px;',
                        'left: 50%;',
                        'transform: translateX(-50%);',
                        'background: rgba(23, 162, 184, 0.9);',
                        'color: white;',
                        'padding: 2px 8px;',
                        'border-radius: 12px;',
                        'font-size: 12px;',
                        'font-weight: bold;',
                        'z-index: 10;'
                    ].join(' ');
                    pageElement.appendChild(textIndicator);
                }
            }
            
            this.markDirty();
            this.closeTextModal();
            // Suppress popup: text added
            
        } catch (error) {
            console.error('Error adding text:', error);
            this.showStatus('Error adding text to PDF', 'error');
        }
    }

    async downloadPDF() {
        if (!this.pdfDoc) {
            this.showStatus('No PDF to download', 'error');
            return;
        }

        this.showLoading(true, 'processing');
        
        try {
            // Ensure PDF is updated with all changes before download
            await this.ensurePDFUpdated();
            
            const pdfBytes = await this.pdfDoc.save();
            
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'edited-document.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            this.showStatus('PDF downloaded successfully!', 'success');
            
        } catch (error) {
            console.error('Error downloading PDF:', error);
            this.showStatus('Error downloading PDF', 'error');
        } finally {
            this.showLoading(false, 'processing');
        }
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    showLoading(show, operation = 'default') {
        if (show) {
            this.loadingOperations.add(operation);
        } else {
            this.loadingOperations.delete(operation);
        }
        
        // Show loading if any operations are running
        const shouldShow = this.loadingOperations.size > 0;
        document.getElementById('loading').style.display = shouldShow ? 'flex' : 'none';
        
        // Update loading text based on operations
        const loadingText = document.querySelector('#loading p');
        if (loadingText && shouldShow) {
            const operations = Array.from(this.loadingOperations);
            if (operations.includes('rendering')) {
                loadingText.textContent = 'Rendering pages...';
            } else if (operations.includes('moving')) {
                loadingText.textContent = 'Moving pages...';
            } else if (operations.includes('processing')) {
                loadingText.textContent = 'Processing PDF...';
            } else {
                loadingText.textContent = 'Working...';
            }
        }
    }

    showStatus(message, type) {
        const statusElement = document.getElementById('statusMessage');
        
        // Clear any existing timeout
        if (this.statusTimeout) {
            clearTimeout(this.statusTimeout);
        }
        
        statusElement.textContent = message;
    statusElement.className = 'status-message ' + type + ' show';
        
        this.statusTimeout = setTimeout(() => {
            statusElement.classList.remove('show');
        }, 3000);
    }
}

// Global functions for modal
function closeTextModal() {
    event.preventDefault();
    pdfEditor.closeTextModal();
}

function addTextToPDF() {
    event.preventDefault();
    pdfEditor.addTextToPDF();
}

// Initialize the PDF Editor when the page loads
let pdfEditor;
document.addEventListener('DOMContentLoaded', () => {
    pdfEditor = new PDFEditor();
    // Make pdfEditor globally accessible
    window.pdfEditor = pdfEditor;
    
    // Prevent any accidental form submissions
    document.addEventListener('submit', (e) => {
        e.preventDefault();
        return false;
    });
    
    // Prevent any button clicks from causing page refreshes
    document.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' && !e.target.type) {
            e.target.type = 'button'; // Ensure all buttons are type="button"
        }
    });
});

// Clear selection when clicking outside pages
document.addEventListener('click', (e) => {
    if (!e.target.closest('.page-item') && !e.target.closest('.control-buttons')) {
        if (pdfEditor && pdfEditor.selectedPages.size > 0) {
            pdfEditor.selectedPages.clear();
            document.querySelectorAll('.page-item.selected').forEach(item => {
                item.classList.remove('selected');
            });
            pdfEditor.updateControlButtons();
            pdfEditor.updatePageInfo();
        }
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (!pdfEditor || !pdfEditor.currentPDF) return;
    
    // Ctrl+A - Select all pages
    if (e.ctrlKey && e.key === 'a' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        pdfEditor.selectAllPages();
    }
    
    // Delete key - Delete selected pages
    if (e.key === 'Delete' && pdfEditor.selectedPages.size > 0) {
        e.preventDefault();
        pdfEditor.deleteSelectedPages();
    }
    
    // Ctrl+D - Duplicate selected pages
    if (e.ctrlKey && e.key === 'd' && pdfEditor.selectedPages.size > 0) {
        e.preventDefault();
        pdfEditor.duplicateSelectedPages();
    }
    
    // R key - Rotate selected pages
    if (e.key === 'r' && pdfEditor.selectedPages.size > 0 && !e.ctrlKey) {
        e.preventDefault();
        pdfEditor.rotateSelectedPages();
    }
}); 