/**
 * PDF Reader Pro - Core PDF Engine
 * Advanced PDF processing and rendering engine with full feature support
 */

class PDFEngine {
    constructor() {
        this.pdfjsLib = window['pdfjs-dist/build/pdf'];
        this.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        this.currentPDF = null;
        this.currentPage = 1;
        this.totalPages = 0;
        this.scale = 1.0;
        this.rotation = 0;
        this.renderTask = null;
        this.canvas = null;
        this.context = null;
        
        // Advanced features
        this.textContent = new Map(); // Page text content cache
        this.annotations = new Map(); // Page annotations cache
        this.searchResults = [];
        this.currentSearchIndex = 0;
        
        // Event system
        this.eventListeners = new Map();
        
        this.init();
    }

    /**
     * Initialize the PDF engine
     */
    init() {
        this.canvas = document.getElementById('pdf-canvas');
        if (this.canvas) {
            this.context = this.canvas.getContext('2d');
        }
        
        console.log('PDF Engine initialized successfully');
    }

    /**
     * Load PDF from various sources
     */
    async loadPDF(source, options = {}) {
        try {
            this.showStatus('Loading PDF...', 'info');
            
            let loadingTask;
            
            if (source instanceof File) {
                // Load from File object
                const arrayBuffer = await this.fileToArrayBuffer(source);
                loadingTask = this.pdfjsLib.getDocument({
                    data: arrayBuffer,
                    ...options
                });
            } else if (typeof source === 'string') {
                // Load from URL
                loadingTask = this.pdfjsLib.getDocument({
                    url: source,
                    ...options
                });
            } else if (source instanceof ArrayBuffer) {
                // Load from ArrayBuffer
                loadingTask = this.pdfjsLib.getDocument({
                    data: source,
                    ...options
                });
            } else {
                throw new Error('Unsupported PDF source type');
            }

            // Add progress tracking
            loadingTask.onProgress = (progress) => {
                if (progress.total > 0) {
                    const percent = Math.round((progress.loaded / progress.total) * 100);
                    this.showStatus(`Loading PDF... ${percent}%`, 'info');
                }
            };

            this.currentPDF = await loadingTask.promise;
            this.totalPages = this.currentPDF.numPages;
            this.currentPage = 1;
            this.scale = 1.0;
            this.rotation = 0;

            // Cache document metadata
            const metadata = await this.currentPDF.getMetadata();
            this.documentInfo = {
                title: metadata.info?.Title || 'Untitled Document',
                author: metadata.info?.Author || 'Unknown Author',
                subject: metadata.info?.Subject || '',
                keywords: metadata.info?.Keywords || '',
                creator: metadata.info?.Creator || '',
                producer: metadata.info?.Producer || '',
                creationDate: metadata.info?.CreationDate || '',
                modDate: metadata.info?.ModDate || '',
                pages: this.totalPages,
                fileSize: source instanceof File ? this.formatFileSize(source.size) : 'Unknown'
            };

            // Preload first few pages for better performance
            await this.preloadPages([1, 2, 3]);

            this.emit('pdfLoaded', {
                pdf: this.currentPDF,
                info: this.documentInfo,
                totalPages: this.totalPages
            });

            this.showStatus(`PDF loaded successfully - ${this.totalPages} pages`, 'success');
            
            return this.currentPDF;
        } catch (error) {
            console.error('Error loading PDF:', error);
            this.showStatus('Failed to load PDF: ' + error.message, 'error');
            throw error;
        }
    }

    /**
     * Convert File to ArrayBuffer
     */
    async fileToArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Render specific page
     */
    async renderPage(pageNumber, options = {}) {
        if (!this.currentPDF) {
            throw new Error('No PDF loaded');
        }

        if (pageNumber < 1 || pageNumber > this.totalPages) {
            throw new Error(`Invalid page number: ${pageNumber}`);
        }

        try {
            // Cancel previous render task
            if (this.renderTask) {
                this.renderTask.cancel();
            }

            const page = await this.currentPDF.getPage(pageNumber);
            
            // Calculate viewport
            const scale = options.scale || this.scale;
            const rotation = options.rotation !== undefined ? options.rotation : this.rotation;
            const viewport = page.getViewport({ scale, rotation });
            
            // Set canvas dimensions
            const canvas = options.canvas || this.canvas;
            const context = canvas.getContext('2d');
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            // Clear canvas
            context.clearRect(0, 0, canvas.width, canvas.height);
            
            // Render page
            const renderContext = {
                canvasContext: context,
                viewport: viewport,
                enableWebGL: true,
                renderInteractiveForms: true
            };

            this.renderTask = page.render(renderContext);
            await this.renderTask.promise;
            
            // Cache text content for search functionality
            if (!this.textContent.has(pageNumber)) {
                const textContent = await page.getTextContent();
                this.textContent.set(pageNumber, textContent);
            }
            
            // Cache annotations
            if (!this.annotations.has(pageNumber)) {
                const annotations = await page.getAnnotations();
                this.annotations.set(pageNumber, annotations);
            }

            this.currentPage = pageNumber;
            
            this.emit('pageRendered', {
                pageNumber,
                canvas,
                viewport,
                scale,
                rotation
            });

            return {
                canvas,
                viewport,
                page
            };
        } catch (error) {
            if (error.name !== 'RenderingCancelledException') {
                console.error('Error rendering page:', error);
                this.showStatus('Failed to render page: ' + error.message, 'error');
                throw error;
            }
        }
    }

    /**
     * Generate page thumbnail
     */
    async generateThumbnail(pageNumber, maxWidth = 150, maxHeight = 200) {
        if (!this.currentPDF) return null;

        try {
            const page = await this.currentPDF.getPage(pageNumber);
            const viewport = page.getViewport({ scale: 1 });
            
            // Calculate scale to fit within max dimensions
            const scaleX = maxWidth / viewport.width;
            const scaleY = maxHeight / viewport.height;
            const scale = Math.min(scaleX, scaleY);
            
            const thumbnailViewport = page.getViewport({ scale });
            
            // Create thumbnail canvas
            const thumbnailCanvas = document.createElement('canvas');
            const thumbnailContext = thumbnailCanvas.getContext('2d');
            
            thumbnailCanvas.width = thumbnailViewport.width;
            thumbnailCanvas.height = thumbnailViewport.height;
            
            // Render thumbnail
            const renderContext = {
                canvasContext: thumbnailContext,
                viewport: thumbnailViewport
            };
            
            await page.render(renderContext).promise;
            
            return {
                canvas: thumbnailCanvas,
                width: thumbnailCanvas.width,
                height: thumbnailCanvas.height,
                pageNumber
            };
        } catch (error) {
            console.error('Error generating thumbnail:', error);
            return null;
        }
    }

    /**
     * Search text in PDF
     */
    async searchText(query, options = {}) {
        if (!this.currentPDF || !query.trim()) {
            return [];
        }

        const {
            caseSensitive = false,
            wholeWords = false,
            startPage = 1,
            endPage = this.totalPages
        } = options;

        this.searchResults = [];
        
        try {
            for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
                const textContent = await this.getPageTextContent(pageNum);
                const pageText = textContent.items.map(item => item.str).join(' ');
                
                const searchQuery = caseSensitive ? query : query.toLowerCase();
                const searchText = caseSensitive ? pageText : pageText.toLowerCase();
                
                let regex;
                if (wholeWords) {
                    regex = new RegExp(`\\b${this.escapeRegex(searchQuery)}\\b`, 'g');
                } else {
                    regex = new RegExp(this.escapeRegex(searchQuery), 'g');
                }
                
                let match;
                while ((match = regex.exec(searchText)) !== null) {
                    this.searchResults.push({
                        pageNumber: pageNum,
                        index: match.index,
                        text: match[0],
                        context: this.getSearchContext(searchText, match.index, 50)
                    });
                }
            }
            
            this.currentSearchIndex = 0;
            
            this.emit('searchCompleted', {
                query,
                results: this.searchResults,
                count: this.searchResults.length
            });
            
            return this.searchResults;
        } catch (error) {
            console.error('Error searching text:', error);
            return [];
        }
    }

    /**
     * Get text content for a page
     */
    async getPageTextContent(pageNumber) {
        if (this.textContent.has(pageNumber)) {
            return this.textContent.get(pageNumber);
        }
        
        const page = await this.currentPDF.getPage(pageNumber);
        const textContent = await page.getTextContent();
        this.textContent.set(pageNumber, textContent);
        
        return textContent;
    }

    /**
     * Extract all text from PDF
     */
    async extractAllText() {
        if (!this.currentPDF) return '';
        
        const textParts = [];
        
        for (let pageNum = 1; pageNum <= this.totalPages; pageNum++) {
            const textContent = await this.getPageTextContent(pageNum);
            const pageText = textContent.items.map(item => item.str).join(' ');
            textParts.push(`--- Page ${pageNum} ---\n${pageText}\n`);
        }
        
        return textParts.join('\n');
    }

    /**
     * Get PDF as different formats
     */
    async exportAs(format, options = {}) {
        if (!this.currentPDF) {
            throw new Error('No PDF loaded');
        }

        switch (format.toLowerCase()) {
            case 'text':
                return await this.extractAllText();
            
            case 'images':
                return await this.exportAsImages(options);
            
            case 'json':
                return await this.exportAsJSON(options);
            
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    /**
     * Export PDF pages as images
     */
    async exportAsImages(options = {}) {
        const {
            format = 'png',
            quality = 0.8,
            scale = 2.0,
            pages = null
        } = options;

        const images = [];
        const pageRange = pages || Array.from({ length: this.totalPages }, (_, i) => i + 1);

        for (const pageNum of pageRange) {
            const page = await this.currentPDF.getPage(pageNum);
            const viewport = page.getViewport({ scale });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
            
            const dataURL = canvas.toDataURL(`image/${format}`, quality);
            images.push({
                pageNumber: pageNum,
                dataURL,
                width: canvas.width,
                height: canvas.height
            });
        }
        
        return images;
    }

    /**
     * Export PDF structure as JSON
     */
    async exportAsJSON(options = {}) {
        const data = {
            info: this.documentInfo,
            pages: []
        };

        for (let pageNum = 1; pageNum <= this.totalPages; pageNum++) {
            const textContent = await this.getPageTextContent(pageNum);
            const annotations = this.annotations.get(pageNum) || [];
            
            data.pages.push({
                pageNumber: pageNum,
                text: textContent.items.map(item => ({
                    content: item.str,
                    x: item.transform[4],
                    y: item.transform[5],
                    width: item.width,
                    height: item.height
                })),
                annotations: annotations.map(ann => ({
                    type: ann.subtype,
                    content: ann.contents || '',
                    rect: ann.rect
                }))
            });
        }
        
        return JSON.stringify(data, null, 2);
    }

    /**
     * Navigation methods
     */
    async goToPage(pageNumber) {
        if (pageNumber >= 1 && pageNumber <= this.totalPages) {
            await this.renderPage(pageNumber);
            return true;
        }
        return false;
    }

    async nextPage() {
        return await this.goToPage(this.currentPage + 1);
    }

    async previousPage() {
        return await this.goToPage(this.currentPage - 1);
    }

    /**
     * Zoom and rotation methods
     */
    async zoomIn(factor = 1.2) {
        this.scale *= factor;
        await this.renderPage(this.currentPage);
        this.emit('zoomChanged', { scale: this.scale });
    }

    async zoomOut(factor = 1.2) {
        this.scale /= factor;
        if (this.scale < 0.1) this.scale = 0.1;
        await this.renderPage(this.currentPage);
        this.emit('zoomChanged', { scale: this.scale });
    }

    async setZoom(scale) {
        this.scale = Math.max(0.1, Math.min(5.0, scale));
        await this.renderPage(this.currentPage);
        this.emit('zoomChanged', { scale: this.scale });
    }

    async rotate(degrees) {
        this.rotation = (this.rotation + degrees) % 360;
        if (this.rotation < 0) this.rotation += 360;
        await this.renderPage(this.currentPage);
        this.emit('rotationChanged', { rotation: this.rotation });
    }

    /**
     * Fit modes
     */
    async fitToWidth() {
        if (!this.canvas || !this.currentPDF) return;
        
        const page = await this.currentPDF.getPage(this.currentPage);
        const viewport = page.getViewport({ scale: 1, rotation: this.rotation });
        
        const containerWidth = this.canvas.parentElement.clientWidth - 40; // padding
        const scale = containerWidth / viewport.width;
        
        await this.setZoom(scale);
    }

    async fitToPage() {
        if (!this.canvas || !this.currentPDF) return;
        
        const page = await this.currentPDF.getPage(this.currentPage);
        const viewport = page.getViewport({ scale: 1, rotation: this.rotation });
        
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth - 40;
        const containerHeight = container.clientHeight - 40;
        
        const scaleX = containerWidth / viewport.width;
        const scaleY = containerHeight / viewport.height;
        const scale = Math.min(scaleX, scaleY);
        
        await this.setZoom(scale);
    }

    /**
     * Preload pages for better performance
     */
    async preloadPages(pageNumbers) {
        const promises = pageNumbers
            .filter(num => num >= 1 && num <= this.totalPages)
            .map(async pageNum => {
                try {
                    if (!this.textContent.has(pageNum)) {
                        const textContent = await this.getPageTextContent(pageNum);
                        this.textContent.set(pageNum, textContent);
                    }
                } catch (error) {
                    console.warn(`Failed to preload page ${pageNum}:`, error);
                }
            });
        
        await Promise.all(promises);
    }

    /**
     * Utility methods
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    getSearchContext(text, index, contextLength) {
        const start = Math.max(0, index - contextLength);
        const end = Math.min(text.length, index + contextLength);
        return text.substring(start, end);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Event system
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => callback(data));
        }
    }

    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const callbacks = this.eventListeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Status and notification system
     */
    showStatus(message, type = 'info') {
        const event = new CustomEvent('pdfEngineStatus', {
            detail: { message, type }
        });
        window.dispatchEvent(event);
    }

    /**
     * Clean up resources
     */
    destroy() {
        if (this.renderTask) {
            this.renderTask.cancel();
        }
        
        this.textContent.clear();
        this.annotations.clear();
        this.searchResults = [];
        this.eventListeners.clear();
        
        if (this.currentPDF) {
            this.currentPDF.destroy();
            this.currentPDF = null;
        }
        
        console.log('PDF Engine destroyed');
    }

    /**
     * Get current state
     */
    getState() {
        return {
            hasDocument: !!this.currentPDF,
            currentPage: this.currentPage,
            totalPages: this.totalPages,
            scale: this.scale,
            rotation: this.rotation,
            documentInfo: this.documentInfo,
            searchResults: this.searchResults,
            currentSearchIndex: this.currentSearchIndex
        };
    }
}

// Export for use in other modules
window.PDFEngine = PDFEngine;