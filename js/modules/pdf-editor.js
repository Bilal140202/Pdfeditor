/**
 * PDF Reader Pro - PDF Editor Module
 * Advanced PDF editing capabilities with real text editing and image manipulation
 */

class PDFEditor {
    constructor() {
        this.engine = null;
        this.isEditMode = false;
        this.selectedElement = null;
        this.editHistory = [];
        this.historyIndex = -1;
        this.maxHistorySize = 50;
        
        // Edit tools
        this.currentTool = 'text';
        this.textColor = '#000000';
        this.textSize = 12;
        this.textFont = 'Helvetica';
        this.strokeColor = '#ff0000';
        this.strokeWidth = 2;
        this.fillColor = '#ffff00';
        
        // Canvas overlay for editing
        this.editCanvas = null;
        this.editContext = null;
        this.overlayContainer = null;
        
        // Text editing
        this.textEditor = null;
        this.editingText = false;
        
        // Drawing state
        this.isDrawing = false;
        this.drawPath = [];
        
        this.init();
    }

    /**
     * Initialize the PDF editor
     */
    init() {
        this.createEditingInterface();
        this.setupToolHandlers();
        
        console.log('PDF Editor initialized successfully');
    }

    /**
     * Create editing interface overlay
     */
    createEditingInterface() {
        this.overlayContainer = document.createElement('div');
        this.overlayContainer.className = 'pdf-edit-overlay';
        this.overlayContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10;
        `;
        
        // Create edit canvas
        this.editCanvas = document.createElement('canvas');
        this.editCanvas.className = 'pdf-edit-canvas';
        this.editCanvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            pointer-events: auto;
            cursor: crosshair;
        `;
        
        this.editContext = this.editCanvas.getContext('2d');
        this.overlayContainer.appendChild(this.editCanvas);
        
        // Create text editor
        this.createTextEditor();
        
        // Attach to canvas container when available
        const canvasContainer = document.getElementById('pdf-canvas-container');
        if (canvasContainer) {
            canvasContainer.style.position = 'relative';
            canvasContainer.appendChild(this.overlayContainer);
        }
    }

    /**
     * Create text editor element
     */
    createTextEditor() {
        this.textEditor = document.createElement('div');
        this.textEditor.className = 'pdf-text-editor';
        this.textEditor.contentEditable = true;
        this.textEditor.style.cssText = `
            position: absolute;
            border: 2px dashed #007acc;
            background: rgba(255, 255, 255, 0.9);
            padding: 4px;
            font-family: ${this.textFont};
            font-size: ${this.textSize}px;
            color: ${this.textColor};
            outline: none;
            min-width: 100px;
            min-height: 20px;
            display: none;
            z-index: 20;
            resize: both;
            overflow: auto;
        `;
        
        // Text editor events
        this.textEditor.addEventListener('blur', () => this.finishTextEdit());
        this.textEditor.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.cancelTextEdit();
            } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                this.finishTextEdit();
            }
        });
        
        this.overlayContainer.appendChild(this.textEditor);
    }

    /**
     * Setup tool event handlers
     */
    setupToolHandlers() {
        // Drawing events
        this.editCanvas.addEventListener('mousedown', (e) => this.handleEditMouseDown(e));
        this.editCanvas.addEventListener('mousemove', (e) => this.handleEditMouseMove(e));
        this.editCanvas.addEventListener('mouseup', (e) => this.handleEditMouseUp(e));
        
        // Touch events for mobile
        this.editCanvas.addEventListener('touchstart', (e) => this.handleEditTouchStart(e));
        this.editCanvas.addEventListener('touchmove', (e) => this.handleEditTouchMove(e));
        this.editCanvas.addEventListener('touchend', (e) => this.handleEditTouchEnd(e));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (!this.isEditMode) return;
            
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.redo();
                        } else {
                            this.undo();
                        }
                        break;
                    case 'y':
                        e.preventDefault();
                        this.redo();
                        break;
                }
            }
            
            if (e.key === 'Delete' && this.selectedElement) {
                this.deleteSelectedElement();
            }
        });
    }

    /**
     * Set PDF engine reference
     */
    setEngine(engine) {
        this.engine = engine;
        
        // Listen for page renders to sync overlay
        if (this.engine) {
            this.engine.on('pageRendered', (data) => {
                this.syncOverlaySize(data);
            });
        }
    }

    /**
     * Enable edit mode
     */
    enableEditMode() {
        this.isEditMode = true;
        this.overlayContainer.style.pointerEvents = 'auto';
        this.updateEditingInterface();
        
        // Add edit mode styles
        document.body.classList.add('pdf-edit-mode');
        
        this.emit('editModeEnabled');
    }

    /**
     * Disable edit mode
     */
    disableEditMode() {
        this.isEditMode = false;
        this.overlayContainer.style.pointerEvents = 'none';
        this.finishTextEdit();
        this.clearSelection();
        
        // Remove edit mode styles
        document.body.classList.remove('pdf-edit-mode');
        
        this.emit('editModeDisabled');
    }

    /**
     * Set current editing tool
     */
    setTool(tool) {
        this.currentTool = tool;
        this.finishTextEdit();
        this.clearSelection();
        
        // Update cursor
        switch (tool) {
            case 'text':
                this.editCanvas.style.cursor = 'text';
                break;
            case 'draw':
                this.editCanvas.style.cursor = 'crosshair';
                break;
            case 'highlight':
                this.editCanvas.style.cursor = 'cell';
                break;
            case 'select':
                this.editCanvas.style.cursor = 'default';
                break;
            default:
                this.editCanvas.style.cursor = 'crosshair';
        }
        
        this.emit('toolChanged', { tool });
    }

    /**
     * Handle mouse events for editing
     */
    handleEditMouseDown(e) {
        if (!this.isEditMode) return;
        
        const rect = this.editCanvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.editCanvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.editCanvas.height / rect.height);
        
        switch (this.currentTool) {
            case 'text':
                this.startTextEdit(x, y);
                break;
            case 'draw':
                this.startDrawing(x, y);
                break;
            case 'highlight':
                this.startHighlight(x, y);
                break;
            case 'select':
                this.selectElement(x, y);
                break;
        }
    }

    handleEditMouseMove(e) {
        if (!this.isEditMode || !this.isDrawing) return;
        
        const rect = this.editCanvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.editCanvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.editCanvas.height / rect.height);
        
        this.continueDrawing(x, y);
    }

    handleEditMouseUp(e) {
        if (!this.isEditMode) return;
        
        if (this.isDrawing) {
            this.finishDrawing();
        }
    }

    /**
     * Text editing methods
     */
    startTextEdit(x, y) {
        this.finishTextEdit(); // Finish any existing text edit
        
        this.editingText = true;
        this.textEditor.style.display = 'block';
        this.textEditor.style.left = x + 'px';
        this.textEditor.style.top = y + 'px';
        this.textEditor.style.fontSize = this.textSize + 'px';
        this.textEditor.style.color = this.textColor;
        this.textEditor.style.fontFamily = this.textFont;
        this.textEditor.innerHTML = '';
        this.textEditor.focus();
    }

    finishTextEdit() {
        if (!this.editingText || !this.textEditor.textContent.trim()) {
            this.cancelTextEdit();
            return;
        }
        
        const text = this.textEditor.textContent;
        const x = parseInt(this.textEditor.style.left);
        const y = parseInt(this.textEditor.style.top);
        
        // Add text to canvas
        this.addTextElement(text, x, y);
        
        this.cancelTextEdit();
        this.saveState();
    }

    cancelTextEdit() {
        this.editingText = false;
        this.textEditor.style.display = 'none';
        this.textEditor.innerHTML = '';
    }

    addTextElement(text, x, y) {
        this.editContext.save();
        this.editContext.fillStyle = this.textColor;
        this.editContext.font = `${this.textSize}px ${this.textFont}`;
        this.editContext.textBaseline = 'top';
        
        // Handle multiline text
        const lines = text.split('\n');
        lines.forEach((line, index) => {
            this.editContext.fillText(line, x, y + (index * this.textSize * 1.2));
        });
        
        this.editContext.restore();
    }

    /**
     * Drawing methods
     */
    startDrawing(x, y) {
        this.isDrawing = true;
        this.drawPath = [{ x, y }];
        
        this.editContext.beginPath();
        this.editContext.moveTo(x, y);
        this.editContext.strokeStyle = this.strokeColor;
        this.editContext.lineWidth = this.strokeWidth;
        this.editContext.lineCap = 'round';
        this.editContext.lineJoin = 'round';
    }

    continueDrawing(x, y) {
        if (!this.isDrawing) return;
        
        this.drawPath.push({ x, y });
        this.editContext.lineTo(x, y);
        this.editContext.stroke();
    }

    finishDrawing() {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        this.editContext.closePath();
        this.saveState();
    }

    /**
     * Highlight methods
     */
    startHighlight(x, y) {
        // Create highlight rectangle
        this.editContext.save();
        this.editContext.globalAlpha = 0.3;
        this.editContext.fillStyle = this.fillColor;
        
        // For now, create a simple rectangle highlight
        // In a full implementation, this would detect text boundaries
        this.editContext.fillRect(x - 50, y - 5, 100, 20);
        this.editContext.restore();
        
        this.saveState();
    }

    /**
     * History management
     */
    saveState() {
        // Remove any states after current index
        this.editHistory = this.editHistory.slice(0, this.historyIndex + 1);
        
        // Add current state
        const imageData = this.editContext.getImageData(0, 0, this.editCanvas.width, this.editCanvas.height);
        this.editHistory.push(imageData);
        
        // Limit history size
        if (this.editHistory.length > this.maxHistorySize) {
            this.editHistory.shift();
        } else {
            this.historyIndex++;
        }
        
        this.emit('stateChanged', { canUndo: this.canUndo(), canRedo: this.canRedo() });
    }

    undo() {
        if (!this.canUndo()) return;
        
        this.historyIndex--;
        this.restoreState(this.editHistory[this.historyIndex]);
        
        this.emit('stateChanged', { canUndo: this.canUndo(), canRedo: this.canRedo() });
    }

    redo() {
        if (!this.canRedo()) return;
        
        this.historyIndex++;
        this.restoreState(this.editHistory[this.historyIndex]);
        
        this.emit('stateChanged', { canUndo: this.canUndo(), canRedo: this.canRedo() });
    }

    canUndo() {
        return this.historyIndex > 0;
    }

    canRedo() {
        return this.historyIndex < this.editHistory.length - 1;
    }

    restoreState(imageData) {
        this.editContext.putImageData(imageData, 0, 0);
    }

    /**
     * Property setters
     */
    setTextColor(color) {
        this.textColor = color;
        if (this.editingText) {
            this.textEditor.style.color = color;
        }
    }

    setTextSize(size) {
        this.textSize = size;
        if (this.editingText) {
            this.textEditor.style.fontSize = size + 'px';
        }
    }

    setTextFont(font) {
        this.textFont = font;
        if (this.editingText) {
            this.textEditor.style.fontFamily = font;
        }
    }

    setStrokeColor(color) {
        this.strokeColor = color;
    }

    setStrokeWidth(width) {
        this.strokeWidth = width;
    }

    setFillColor(color) {
        this.fillColor = color;
    }

    /**
     * Selection methods
     */
    selectElement(x, y) {
        // This would implement element selection logic
        // For now, just clear selection
        this.clearSelection();
    }

    clearSelection() {
        this.selectedElement = null;
    }

    deleteSelectedElement() {
        if (!this.selectedElement) return;
        
        // Implementation would delete the selected element
        this.clearSelection();
        this.saveState();
    }

    /**
     * Canvas management
     */
    syncOverlaySize(renderData) {
        if (!this.editCanvas || !renderData.canvas) return;
        
        const sourceCanvas = renderData.canvas;
        this.editCanvas.width = sourceCanvas.width;
        this.editCanvas.height = sourceCanvas.height;
        
        // Position overlay to match PDF canvas
        const rect = sourceCanvas.getBoundingClientRect();
        const containerRect = this.overlayContainer.parentElement.getBoundingClientRect();
        
        this.editCanvas.style.width = rect.width + 'px';
        this.editCanvas.style.height = rect.height + 'px';
        this.editCanvas.style.left = (rect.left - containerRect.left) + 'px';
        this.editCanvas.style.top = (rect.top - containerRect.top) + 'px';
    }

    updateEditingInterface() {
        // Update UI to show/hide editing tools
        const editorWorkspace = document.getElementById('editor-workspace');
        if (editorWorkspace) {
            editorWorkspace.style.display = this.isEditMode ? 'flex' : 'none';
        }
    }

    /**
     * Export edited PDF
     */
    async exportEditedPDF() {
        if (!this.engine || !this.engine.currentPDF) {
            throw new Error('No PDF loaded');
        }
        
        // This would implement the logic to merge edits with original PDF
        // For now, return a canvas-based export
        return this.exportAsImage();
    }

    exportAsImage() {
        // Combine original PDF canvas with edit overlay
        const originalCanvas = document.getElementById('pdf-canvas');
        const combinedCanvas = document.createElement('canvas');
        const combinedContext = combinedCanvas.getContext('2d');
        
        combinedCanvas.width = originalCanvas.width;
        combinedCanvas.height = originalCanvas.height;
        
        // Draw original PDF
        combinedContext.drawImage(originalCanvas, 0, 0);
        
        // Draw edits on top
        combinedContext.drawImage(this.editCanvas, 0, 0);
        
        return combinedCanvas.toDataURL('image/png');
    }

    /**
     * Clear all edits
     */
    clearAllEdits() {
        this.editContext.clearRect(0, 0, this.editCanvas.width, this.editCanvas.height);
        this.editHistory = [];
        this.historyIndex = -1;
        this.saveState();
    }

    /**
     * Touch event handlers for mobile
     */
    handleEditTouchStart(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.handleEditMouseDown(mouseEvent);
        }
    }

    handleEditTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 1 && this.isDrawing) {
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.handleEditMouseMove(mouseEvent);
        }
    }

    handleEditTouchEnd(e) {
        e.preventDefault();
        const mouseEvent = new MouseEvent('mouseup', {});
        this.handleEditMouseUp(mouseEvent);
    }

    /**
     * Event system
     */
    on(event, callback) {
        if (!this.eventListeners) {
            this.eventListeners = new Map();
        }
        
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        
        this.eventListeners.get(event).push(callback);
    }

    emit(event, data = {}) {
        if (!this.eventListeners || !this.eventListeners.has(event)) {
            return;
        }
        
        this.eventListeners.get(event).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Error in event listener:', error);
            }
        });
    }

    /**
     * Cleanup
     */
    destroy() {
        this.disableEditMode();
        
        if (this.overlayContainer && this.overlayContainer.parentElement) {
            this.overlayContainer.parentElement.removeChild(this.overlayContainer);
        }
        
        this.eventListeners?.clear();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PDFEditor;
}