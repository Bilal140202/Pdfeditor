/**
 * PDF Reader Pro - PDF Viewer Module
 * Advanced PDF viewing interface with zoom, navigation, and interaction features
 */

class PDFViewer {
    constructor() {
        this.engine = null;
        this.container = null;
        this.canvas = null;
        this.toolbar = null;
        
        // UI elements
        this.elements = {
            zoomIn: null,
            zoomOut: null,
            zoomDisplay: null,
            fitWidth: null,
            fitPage: null,
            prevPage: null,
            nextPage: null,
            pageInput: null,
            pageCount: null,
            rotateLeft: null,
            rotateRight: null,
            thumbnails: null,
            fullscreen: null,
            readingMode: null
        };
        
        // State
        this.isFullscreen = false;
        this.isReadingMode = false;
        this.thumbnailsOpen = false;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.canvasOffset = { x: 0, y: 0 };
        
        // Touch support
        this.touchState = {
            lastDistance: 0,
            lastCenter: { x: 0, y: 0 }
        };
        
        this.init();
    }

    /**
     * Initialize the viewer
     */
    init() {
        this.container = document.getElementById('pdf-viewer-container');
        this.canvas = document.getElementById('pdf-canvas');
        this.toolbar = document.querySelector('.viewer-toolbar');
        
        if (!this.container || !this.canvas || !this.toolbar) {
            console.error('PDF Viewer: Required elements not found');
            return;
        }
        
        this.bindElements();
        this.attachEventListeners();
        
        // Initialize with PDF engine
        this.engine = new PDFEngine();
        this.bindEngineEvents();
        
        console.log('PDF Viewer initialized successfully');
    }

    /**
     * Bind UI elements
     */
    bindElements() {
        this.elements = {
            zoomIn: document.getElementById('zoom-in'),
            zoomOut: document.getElementById('zoom-out'),
            zoomDisplay: document.getElementById('zoom-display'),
            fitWidth: document.getElementById('fit-width'),
            fitPage: document.getElementById('fit-page'),
            prevPage: document.getElementById('prev-page'),
            nextPage: document.getElementById('next-page'),
            pageInput: document.getElementById('page-input'),
            pageCount: document.getElementById('page-count'),
            rotateLeft: document.getElementById('rotate-left'),
            rotateRight: document.getElementById('rotate-right'),
            thumbnails: document.getElementById('thumbnails-panel'),
            fullscreen: document.querySelector('.fullscreen-toggle'),
            readingMode: document.querySelector('.reading-mode-toggle')
        };
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Zoom controls
        this.elements.zoomIn?.addEventListener('click', () => this.zoomIn());
        this.elements.zoomOut?.addEventListener('click', () => this.zoomOut());
        this.elements.fitWidth?.addEventListener('click', () => this.fitToWidth());
        this.elements.fitPage?.addEventListener('click', () => this.fitToPage());
        
        // Navigation controls
        this.elements.prevPage?.addEventListener('click', () => this.previousPage());
        this.elements.nextPage?.addEventListener('click', () => this.nextPage());
        this.elements.pageInput?.addEventListener('change', (e) => this.goToPage(parseInt(e.target.value)));
        this.elements.pageInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.goToPage(parseInt(e.target.value));
            }
        });
        
        // Rotation controls
        this.elements.rotateLeft?.addEventListener('click', () => this.rotate(-90));
        this.elements.rotateRight?.addEventListener('click', () => this.rotate(90));
        
        // View mode controls
        this.elements.fullscreen?.addEventListener('click', () => this.toggleFullscreen());
        this.elements.readingMode?.addEventListener('click', () => this.toggleReadingMode());
        
        // Canvas interactions
        this.attachCanvasEvents();
        
        // Keyboard shortcuts
        this.attachKeyboardEvents();
        
        // Window events
        window.addEventListener('resize', () => this.handleResize());
        document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
    }

    /**
     * Attach canvas-specific events
     */
    attachCanvasEvents() {
        if (!this.canvas) return;
        
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
        this.canvas.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        
        // Double click for zoom
        this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
    }

    /**
     * Attach keyboard event handlers
     */
    attachKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            if (!this.engine?.currentPDF) return;
            
            // Don't handle if user is typing in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch (e.key) {
                case 'ArrowLeft':
                case 'PageUp':
                    e.preventDefault();
                    this.previousPage();
                    break;
                    
                case 'ArrowRight':
                case 'PageDown':
                case ' ':
                    e.preventDefault();
                    this.nextPage();
                    break;
                    
                case 'Home':
                    e.preventDefault();
                    this.goToPage(1);
                    break;
                    
                case 'End':
                    e.preventDefault();
                    this.goToPage(this.engine.totalPages);
                    break;
                    
                case '=':
                case '+':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.zoomIn();
                    }
                    break;
                    
                case '-':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.zoomOut();
                    }
                    break;
                    
                case '0':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.resetZoom();
                    }
                    break;
                    
                case 'f':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        // Trigger search (will be handled by main app)
                        this.emit('searchRequested');
                    }
                    break;
                    
                case 'F11':
                    e.preventDefault();
                    this.toggleFullscreen();
                    break;
                    
                case 'r':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.rotate(e.shiftKey ? -90 : 90);
                    }
                    break;
            }
        });
    }

    /**
     * Bind engine events
     */
    bindEngineEvents() {
        if (!this.engine) return;
        
        this.engine.on('pdfLoaded', (data) => {
            this.handlePDFLoaded(data);
        });
        
        this.engine.on('pageRendered', (data) => {
            this.handlePageRendered(data);
        });
        
        this.engine.on('zoomChanged', (data) => {
            this.updateZoomDisplay(data.scale);
        });
        
        this.engine.on('rotationChanged', (data) => {
            this.handleRotationChanged(data.rotation);
        });
    }

    /**
     * Load PDF document
     */
    async loadPDF(source, options = {}) {
        try {
            this.showViewer();
            await this.engine.loadPDF(source, options);
        } catch (error) {
            console.error('Error loading PDF in viewer:', error);
            this.showError('Failed to load PDF: ' + error.message);
        }
    }

    /**
     * Handle PDF loaded event
     */
    handlePDFLoaded(data) {
        this.updatePageCount(data.totalPages);
        this.updatePageInput(1);
        this.generateThumbnails();
        this.updateNavigationButtons();
        
        // Auto-fit to width initially
        setTimeout(() => this.fitToWidth(), 100);
        
        this.emit('pdfLoaded', data);
    }

    /**
     * Handle page rendered event
     */
    handlePageRendered(data) {
        this.updatePageInput(data.pageNumber);
        this.updateNavigationButtons();
        this.highlightThumbnail(data.pageNumber);
        
        this.emit('pageRendered', data);
    }

    /**
     * Navigation methods
     */
    async goToPage(pageNumber) {
        if (this.engine) {
            const success = await this.engine.goToPage(pageNumber);
            if (success) {
                this.updatePageInput(pageNumber);
                this.updateNavigationButtons();
            }
            return success;
        }
        return false;
    }

    async nextPage() {
        return await this.engine?.nextPage() || false;
    }

    async previousPage() {
        return await this.engine?.previousPage() || false;
    }

    /**
     * Zoom methods
     */
    async zoomIn() {
        if (this.engine) {
            await this.engine.zoomIn();
            this.centerCanvas();
        }
    }

    async zoomOut() {
        if (this.engine) {
            await this.engine.zoomOut();
            this.centerCanvas();
        }
    }

    async setZoom(scale) {
        if (this.engine) {
            await this.engine.setZoom(scale);
            this.centerCanvas();
        }
    }

    async resetZoom() {
        await this.setZoom(1.0);
    }

    async fitToWidth() {
        if (this.engine) {
            await this.engine.fitToWidth();
            this.centerCanvas();
        }
    }

    async fitToPage() {
        if (this.engine) {
            await this.engine.fitToPage();
            this.centerCanvas();
        }
    }

    /**
     * Rotation methods
     */
    async rotate(degrees) {
        if (this.engine) {
            await this.engine.rotate(degrees);
            this.centerCanvas();
        }
    }

    handleRotationChanged(rotation) {
        // Update UI to reflect rotation if needed
        this.emit('rotationChanged', { rotation });
    }

    /**
     * View mode methods
     */
    toggleFullscreen() {
        if (this.isFullscreen) {
            document.exitFullscreen();
        } else {
            this.container.requestFullscreen();
        }
    }

    handleFullscreenChange() {
        this.isFullscreen = !!document.fullscreenElement;
        const icon = this.elements.fullscreen?.querySelector('i');
        if (icon) {
            icon.className = this.isFullscreen ? 'fas fa-compress' : 'fas fa-expand';
        }
        
        // Adjust layout for fullscreen
        setTimeout(() => this.handleResize(), 100);
    }

    toggleReadingMode() {
        this.isReadingMode = !this.isReadingMode;
        document.body.classList.toggle('theme-reading', this.isReadingMode);
        
        const icon = this.elements.readingMode?.querySelector('i');
        if (icon) {
            icon.className = this.isReadingMode ? 'fas fa-book' : 'fas fa-book-open';
        }
        
        this.emit('readingModeChanged', { enabled: this.isReadingMode });
    }

    /**
     * Thumbnail methods
     */
    async generateThumbnails() {
        if (!this.engine || !this.elements.thumbnails) return;
        
        const container = document.getElementById('thumbnails-container');
        if (!container) return;
        
        container.innerHTML = '<div class="loading-spinner-small"></div>';
        
        try {
            const thumbnails = [];
            for (let i = 1; i <= this.engine.totalPages; i++) {
                const thumbnail = await this.engine.generateThumbnail(i);
                if (thumbnail) {
                    thumbnails.push(thumbnail);
                }
            }
            
            this.renderThumbnails(thumbnails);
        } catch (error) {
            console.error('Error generating thumbnails:', error);
            container.innerHTML = '<p>Failed to generate thumbnails</p>';
        }
    }

    renderThumbnails(thumbnails) {
        const container = document.getElementById('thumbnails-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        thumbnails.forEach(thumbnail => {
            const item = document.createElement('div');
            item.className = 'thumbnail-item';
            item.dataset.page = thumbnail.pageNumber;
            
            const canvas = thumbnail.canvas.cloneNode(true);
            const pageNumber = document.createElement('div');
            pageNumber.className = 'thumbnail-page-number';
            pageNumber.textContent = thumbnail.pageNumber;
            
            item.appendChild(canvas);
            item.appendChild(pageNumber);
            
            item.addEventListener('click', () => {
                this.goToPage(thumbnail.pageNumber);
                if (window.innerWidth <= 768) {
                    this.closeThumbnails();
                }
            });
            
            container.appendChild(item);
        });
    }

    highlightThumbnail(pageNumber) {
        const thumbnails = document.querySelectorAll('.thumbnail-item');
        thumbnails.forEach(thumb => {
            thumb.classList.toggle('active', parseInt(thumb.dataset.page) === pageNumber);
        });
    }

    toggleThumbnails() {
        this.thumbnailsOpen = !this.thumbnailsOpen;
        this.elements.thumbnails?.classList.toggle('open', this.thumbnailsOpen);
    }

    closeThumbnails() {
        this.thumbnailsOpen = false;
        this.elements.thumbnails?.classList.remove('open');
    }

    /**
     * Mouse event handlers
     */
    handleMouseDown(e) {
        if (e.button === 0) { // Left button
            this.isDragging = true;
            this.dragStart = { x: e.clientX, y: e.clientY };
            this.canvas.style.cursor = 'grabbing';
            e.preventDefault();
        }
    }

    handleMouseMove(e) {
        if (this.isDragging) {
            const deltaX = e.clientX - this.dragStart.x;
            const deltaY = e.clientY - this.dragStart.y;
            
            this.canvasOffset.x += deltaX;
            this.canvasOffset.y += deltaY;
            
            this.updateCanvasPosition();
            
            this.dragStart = { x: e.clientX, y: e.clientY };
        }
    }

    handleMouseUp(e) {
        if (e.button === 0) {
            this.isDragging = false;
            this.canvas.style.cursor = 'grab';
        }
    }

    handleWheel(e) {
        e.preventDefault();
        
        if (e.ctrlKey || e.metaKey) {
            // Zoom with Ctrl/Cmd + wheel
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            const newScale = this.engine.scale * delta;
            this.setZoom(Math.max(0.1, Math.min(5.0, newScale)));
        } else {
            // Scroll pages with wheel
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                if (e.deltaY > 0) {
                    this.nextPage();
                } else {
                    this.previousPage();
                }
            }
        }
    }

    handleDoubleClick(e) {
        // Smart zoom: fit to width or zoom to 100%
        if (Math.abs(this.engine.scale - 1.0) < 0.1) {
            this.fitToWidth();
        } else {
            this.setZoom(1.0);
        }
    }

    handleContextMenu(e) {
        e.preventDefault();
        // TODO: Show context menu
        this.emit('contextMenu', {
            x: e.clientX,
            y: e.clientY,
            pageX: e.offsetX,
            pageY: e.offsetY
        });
    }

    /**
     * Touch event handlers for mobile
     */
    handleTouchStart(e) {
        e.preventDefault();
        
        if (e.touches.length === 1) {
            // Single touch - start dragging
            const touch = e.touches[0];
            this.isDragging = true;
            this.dragStart = { x: touch.clientX, y: touch.clientY };
        } else if (e.touches.length === 2) {
            // Two finger touch - prepare for pinch zoom
            this.isDragging = false;
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            
            this.touchState.lastDistance = this.getTouchDistance(touch1, touch2);
            this.touchState.lastCenter = this.getTouchCenter(touch1, touch2);
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        
        if (e.touches.length === 1 && this.isDragging) {
            // Single finger drag
            const touch = e.touches[0];
            const deltaX = touch.clientX - this.dragStart.x;
            const deltaY = touch.clientY - this.dragStart.y;
            
            this.canvasOffset.x += deltaX;
            this.canvasOffset.y += deltaY;
            
            this.updateCanvasPosition();
            
            this.dragStart = { x: touch.clientX, y: touch.clientY };
        } else if (e.touches.length === 2) {
            // Pinch zoom
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            
            const distance = this.getTouchDistance(touch1, touch2);
            const center = this.getTouchCenter(touch1, touch2);
            
            if (this.touchState.lastDistance > 0) {
                const scale = distance / this.touchState.lastDistance;
                const newScale = this.engine.scale * scale;
                this.setZoom(Math.max(0.1, Math.min(5.0, newScale)));
            }
            
            this.touchState.lastDistance = distance;
            this.touchState.lastCenter = center;
        }
    }

    handleTouchEnd(e) {
        e.preventDefault();
        
        if (e.touches.length === 0) {
            this.isDragging = false;
            this.touchState.lastDistance = 0;
        }
    }

    getTouchDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    getTouchCenter(touch1, touch2) {
        return {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2
        };
    }

    /**
     * UI update methods
     */
    updateZoomDisplay(scale) {
        if (this.elements.zoomDisplay) {
            this.elements.zoomDisplay.textContent = Math.round(scale * 100) + '%';
        }
    }

    updatePageInput(pageNumber) {
        if (this.elements.pageInput) {
            this.elements.pageInput.value = pageNumber;
        }
    }

    updatePageCount(totalPages) {
        if (this.elements.pageCount) {
            this.elements.pageCount.textContent = `of ${totalPages}`;
        }
        
        if (this.elements.pageInput) {
            this.elements.pageInput.max = totalPages;
        }
    }

    updateNavigationButtons() {
        if (!this.engine) return;
        
        const isFirstPage = this.engine.currentPage <= 1;
        const isLastPage = this.engine.currentPage >= this.engine.totalPages;
        
        if (this.elements.prevPage) {
            this.elements.prevPage.disabled = isFirstPage;
        }
        
        if (this.elements.nextPage) {
            this.elements.nextPage.disabled = isLastPage;
        }
    }

    /**
     * Canvas positioning
     */
    updateCanvasPosition() {
        if (this.canvas) {
            this.canvas.style.transform = `translate(${this.canvasOffset.x}px, ${this.canvasOffset.y}px)`;
        }
    }

    centerCanvas() {
        this.canvasOffset = { x: 0, y: 0 };
        this.updateCanvasPosition();
    }

    /**
     * Layout methods
     */
    handleResize() {
        // Debounce resize events
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            if (this.engine?.currentPDF) {
                // Re-render current page to fit new container size
                this.engine.renderPage(this.engine.currentPage);
            }
        }, 150);
    }

    showViewer() {
        const noDocState = document.getElementById('no-document-state');
        if (noDocState) noDocState.style.display = 'none';
        
        if (this.container) {
            this.container.style.display = 'flex';
        }
    }

    hideViewer() {
        if (this.container) {
            this.container.style.display = 'none';
        }
        
        const noDocState = document.getElementById('no-document-state');
        if (noDocState) noDocState.style.display = 'flex';
    }

    /**
     * Error handling
     */
    showError(message) {
        this.emit('error', { message });
    }

    /**
     * Event system
     */
    emit(event, data) {
        const customEvent = new CustomEvent('pdfViewer:' + event, { detail: data });
        document.dispatchEvent(customEvent);
    }

    /**
     * Public API methods
     */
    getCurrentPage() {
        return this.engine?.currentPage || 1;
    }

    getTotalPages() {
        return this.engine?.totalPages || 0;
    }

    getCurrentScale() {
        return this.engine?.scale || 1.0;
    }

    getDocumentInfo() {
        return this.engine?.documentInfo || null;
    }

    /**
     * Clean up
     */
    destroy() {
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
        
        // Destroy engine
        if (this.engine) {
            this.engine.destroy();
        }
        
        console.log('PDF Viewer destroyed');
    }
}

// Export for use in other modules
window.PDFViewer = PDFViewer;