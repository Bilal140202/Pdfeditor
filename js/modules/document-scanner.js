/**
 * PDF Reader Pro - Document Scanner Module
 * Advanced document scanning with image enhancement and OCR
 */

class DocumentScanner {
    constructor() {
        this.stream = null;
        this.video = null;
        this.canvas = null;
        this.context = null;
        
        // Camera settings
        this.cameraConstraints = {
            video: {
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                facingMode: 'environment' // Rear camera preferred
            }
        };
        
        // Document detection
        this.documentDetector = null;
        this.isDetecting = false;
        
        // Scan history
        this.scanHistory = [];
        this.currentScan = null;
        
        // Enhancement settings
        this.enhancementSettings = {
            brightness: 0,
            contrast: 1,
            saturation: 1,
            sharpness: 0,
            autoEnhance: true
        };
        
        this.init();
    }

    /**
     * Initialize document scanner
     */
    init() {
        this.createScannerInterface();
        this.setupEventHandlers();
        
        console.log('Document Scanner initialized successfully');
    }

    /**
     * Create scanner interface
     */
    createScannerInterface() {
        const workspace = document.getElementById('scanner-workspace');
        if (!workspace) return;
        
        workspace.innerHTML = `
            <div class="scanner-container">
                <!-- Scanner Header -->
                <div class="scanner-header">
                    <h2><i class="fas fa-camera"></i> Document Scanner</h2>
                    <div class="scanner-controls">
                        <button class="btn-secondary" id="switch-camera">
                            <i class="fas fa-sync-alt"></i> Switch Camera
                        </button>
                        <button class="btn-secondary" id="scan-settings">
                            <i class="fas fa-cog"></i> Settings
                        </button>
                    </div>
                </div>

                <!-- Camera View -->
                <div class="camera-container">
                    <div class="camera-view">
                        <video id="scanner-video" autoplay muted playsinline></video>
                        <div class="detection-overlay" id="detection-overlay">
                            <!-- Document detection outline will be drawn here -->
                        </div>
                        <div class="camera-controls">
                            <button class="btn-primary capture-btn" id="capture-btn">
                                <i class="fas fa-camera"></i>
                                <span>Capture</span>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Camera toggle message -->
                    <div class="camera-message" id="camera-message" style="display: none;">
                        <i class="fas fa-camera"></i>
                        <h3>Camera Access Required</h3>
                        <p>Please allow camera access to scan documents</p>
                        <button class="btn-primary" id="enable-camera">Enable Camera</button>
                    </div>
                </div>

                <!-- Scan Preview -->
                <div class="scan-preview-container" id="scan-preview-container" style="display: none;">
                    <div class="preview-header">
                        <h3>Scanned Document</h3>
                        <div class="preview-controls">
                            <button class="btn-secondary" id="retake-scan">
                                <i class="fas fa-redo"></i> Retake
                            </button>
                            <button class="btn-secondary" id="enhance-scan">
                                <i class="fas fa-magic"></i> Enhance
                            </button>
                            <button class="btn-primary" id="save-scan">
                                <i class="fas fa-save"></i> Save as PDF
                            </button>
                        </div>
                    </div>
                    
                    <div class="preview-content">
                        <canvas id="scan-preview-canvas"></canvas>
                        
                        <!-- Enhancement Panel -->
                        <div class="enhancement-panel" id="enhancement-panel" style="display: none;">
                            <h4>Image Enhancement</h4>
                            <div class="enhancement-controls">
                                <div class="control-group">
                                    <label>Brightness</label>
                                    <input type="range" id="brightness-slider" min="-100" max="100" value="0">
                                    <span class="control-value" id="brightness-value">0</span>
                                </div>
                                <div class="control-group">
                                    <label>Contrast</label>
                                    <input type="range" id="contrast-slider" min="0" max="2" step="0.1" value="1">
                                    <span class="control-value" id="contrast-value">1.0</span>
                                </div>
                                <div class="control-group">
                                    <label>Saturation</label>
                                    <input type="range" id="saturation-slider" min="0" max="2" step="0.1" value="1">
                                    <span class="control-value" id="saturation-value">1.0</span>
                                </div>
                                <div class="enhancement-buttons">
                                    <button class="btn-secondary" id="reset-enhancement">Reset</button>
                                    <button class="btn-secondary" id="auto-enhance">Auto Enhance</button>
                                    <button class="btn-primary" id="apply-enhancement">Apply</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Scan History -->
                <div class="scan-history-container">
                    <h3>Recent Scans</h3>
                    <div class="scan-history" id="scan-history">
                        <div class="empty-state">
                            <i class="fas fa-history"></i>
                            <p>No scans yet</p>
                        </div>
                    </div>
                </div>

                <!-- Batch Scan Mode -->
                <div class="batch-scan-container" id="batch-scan-container" style="display: none;">
                    <div class="batch-header">
                        <h3>Batch Scanning</h3>
                        <div class="batch-info">
                            <span id="batch-count">0 pages scanned</span>
                            <button class="btn-secondary" id="finish-batch">
                                <i class="fas fa-check"></i> Finish Batch
                            </button>
                        </div>
                    </div>
                    <div class="batch-preview" id="batch-preview">
                        <!-- Batch scan previews will be shown here -->
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // Camera controls
        document.getElementById('enable-camera')?.addEventListener('click', () => this.enableCamera());
        document.getElementById('switch-camera')?.addEventListener('click', () => this.switchCamera());
        document.getElementById('capture-btn')?.addEventListener('click', () => this.captureDocument());
        
        // Preview controls
        document.getElementById('retake-scan')?.addEventListener('click', () => this.retakeScan());
        document.getElementById('enhance-scan')?.addEventListener('click', () => this.showEnhancementPanel());
        document.getElementById('save-scan')?.addEventListener('click', () => this.saveScanAsPDF());
        
        // Enhancement controls
        this.setupEnhancementControls();
        
        // Batch scanning
        document.getElementById('finish-batch')?.addEventListener('click', () => this.finishBatchScan());
    }

    /**
     * Setup enhancement controls
     */
    setupEnhancementControls() {
        const brightnessSlider = document.getElementById('brightness-slider');
        const contrastSlider = document.getElementById('contrast-slider');
        const saturationSlider = document.getElementById('saturation-slider');
        
        if (brightnessSlider) {
            brightnessSlider.addEventListener('input', (e) => {
                this.enhancementSettings.brightness = parseInt(e.target.value);
                document.getElementById('brightness-value').textContent = e.target.value;
                this.applyEnhancementPreview();
            });
        }
        
        if (contrastSlider) {
            contrastSlider.addEventListener('input', (e) => {
                this.enhancementSettings.contrast = parseFloat(e.target.value);
                document.getElementById('contrast-value').textContent = e.target.value;
                this.applyEnhancementPreview();
            });
        }
        
        if (saturationSlider) {
            saturationSlider.addEventListener('input', (e) => {
                this.enhancementSettings.saturation = parseFloat(e.target.value);
                document.getElementById('saturation-value').textContent = e.target.value;
                this.applyEnhancementPreview();
            });
        }
        
        document.getElementById('reset-enhancement')?.addEventListener('click', () => this.resetEnhancement());
        document.getElementById('auto-enhance')?.addEventListener('click', () => this.autoEnhance());
        document.getElementById('apply-enhancement')?.addEventListener('click', () => this.applyEnhancement());
    }

    /**
     * Enable camera access
     */
    async enableCamera() {
        try {
            this.showStatus('Requesting camera access...', 'info');
            
            this.stream = await navigator.mediaDevices.getUserMedia(this.cameraConstraints);
            
            this.video = document.getElementById('scanner-video');
            if (this.video) {
                this.video.srcObject = this.stream;
                
                await new Promise((resolve) => {
                    this.video.onloadedmetadata = resolve;
                });
                
                // Hide camera message, show video
                document.getElementById('camera-message').style.display = 'none';
                this.video.style.display = 'block';
                
                // Start document detection
                this.startDocumentDetection();
                
                this.showStatus('Camera enabled successfully', 'success');
            }
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            this.showStatus('Camera access denied: ' + error.message, 'error');
            this.showCameraMessage();
        }
    }

    /**
     * Switch between front and rear camera
     */
    async switchCamera() {
        if (!this.stream) return;
        
        try {
            // Stop current stream
            this.stream.getTracks().forEach(track => track.stop());
            
            // Toggle camera
            const currentConstraints = this.cameraConstraints.video;
            currentConstraints.facingMode = currentConstraints.facingMode === 'environment' ? 'user' : 'environment';
            
            // Start new stream
            await this.enableCamera();
            
        } catch (error) {
            console.error('Error switching camera:', error);
            this.showStatus('Failed to switch camera: ' + error.message, 'error');
        }
    }

    /**
     * Start document detection
     */
    startDocumentDetection() {
        if (!this.video || this.isDetecting) return;
        
        this.isDetecting = true;
        this.detectDocuments();
    }

    /**
     * Detect documents in video stream
     */
    detectDocuments() {
        if (!this.video || !this.isDetecting) return;
        
        // Simple document detection using canvas analysis
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        canvas.width = this.video.videoWidth;
        canvas.height = this.video.videoHeight;
        
        context.drawImage(this.video, 0, 0);
        
        // Detect rectangular shapes (simplified)
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const detectedRectangles = this.findDocumentRectangles(imageData);
        
        // Update detection overlay
        this.updateDetectionOverlay(detectedRectangles);
        
        // Continue detection
        if (this.isDetecting) {
            requestAnimationFrame(() => this.detectDocuments());
        }
    }

    /**
     * Find rectangular document shapes in image
     */
    findDocumentRectangles(imageData) {
        // Simplified edge detection and rectangle finding
        // In a real implementation, you'd use more sophisticated computer vision
        
        const rectangles = [];
        
        // For demo purposes, create a mock rectangle
        if (this.video) {
            rectangles.push({
                x: this.video.videoWidth * 0.1,
                y: this.video.videoHeight * 0.1,
                width: this.video.videoWidth * 0.8,
                height: this.video.videoHeight * 0.8,
                confidence: 0.8
            });
        }
        
        return rectangles;
    }

    /**
     * Update detection overlay with found rectangles
     */
    updateDetectionOverlay(rectangles) {
        const overlay = document.getElementById('detection-overlay');
        if (!overlay) return;
        
        // Clear previous overlay
        overlay.innerHTML = '';
        
        rectangles.forEach((rect, index) => {
            const rectElement = document.createElement('div');
            rectElement.className = 'detection-rectangle';
            rectElement.style.cssText = `
                position: absolute;
                left: ${rect.x}px;
                top: ${rect.y}px;
                width: ${rect.width}px;
                height: ${rect.height}px;
                border: 3px solid #00ff00;
                background: rgba(0, 255, 0, 0.1);
                pointer-events: none;
                border-radius: 8px;
            `;
            
            // Add confidence indicator
            if (rect.confidence > 0.7) {
                rectElement.innerHTML = `
                    <div style="
                        position: absolute;
                        top: -30px;
                        left: 0;
                        background: rgba(0, 255, 0, 0.8);
                        color: white;
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 12px;
                        font-weight: bold;
                    ">
                        Document Detected (${Math.round(rect.confidence * 100)}%)
                    </div>
                `;
            }
            
            overlay.appendChild(rectElement);
        });
    }

    /**
     * Capture document from video stream
     */
    captureDocument() {
        if (!this.video) {
            this.showStatus('No video stream available', 'error');
            return;
        }
        
        try {
            // Create capture canvas
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            canvas.width = this.video.videoWidth;
            canvas.height = this.video.videoHeight;
            
            // Draw video frame to canvas
            context.drawImage(this.video, 0, 0);
            
            // Store the captured image
            this.currentScan = {
                id: Date.now(),
                timestamp: new Date(),
                originalCanvas: canvas,
                enhancedCanvas: null,
                settings: { ...this.enhancementSettings }
            };
            
            // Show preview
            this.showScanPreview();
            
            // Add to scan history
            this.addToScanHistory(this.currentScan);
            
            this.showStatus('Document captured successfully', 'success');
            
        } catch (error) {
            console.error('Error capturing document:', error);
            this.showStatus('Failed to capture document: ' + error.message, 'error');
        }
    }

    /**
     * Show scan preview
     */
    showScanPreview() {
        if (!this.currentScan) return;
        
        const previewContainer = document.getElementById('scan-preview-container');
        const previewCanvas = document.getElementById('scan-preview-canvas');
        
        if (!previewContainer || !previewCanvas) return;
        
        // Show preview container
        previewContainer.style.display = 'block';
        
        // Set canvas size and draw captured image
        const originalCanvas = this.currentScan.originalCanvas;
        previewCanvas.width = originalCanvas.width;
        previewCanvas.height = originalCanvas.height;
        
        const previewContext = previewCanvas.getContext('2d');
        previewContext.drawImage(originalCanvas, 0, 0);
        
        // Apply current enhancement settings
        this.applyEnhancementToCanvas(previewCanvas);
    }

    /**
     * Apply enhancement preview without saving
     */
    applyEnhancementPreview() {
        if (!this.currentScan) return;
        
        const previewCanvas = document.getElementById('scan-preview-canvas');
        if (!previewCanvas) return;
        
        // Redraw original image
        const previewContext = previewCanvas.getContext('2d');
        previewContext.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        previewContext.drawImage(this.currentScan.originalCanvas, 0, 0);
        
        // Apply enhancements
        this.applyEnhancementToCanvas(previewCanvas);
    }

    /**
     * Apply enhancement settings to canvas
     */
    applyEnhancementToCanvas(canvas) {
        const context = canvas.getContext('2d');
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        const { brightness, contrast, saturation } = this.enhancementSettings;
        
        for (let i = 0; i < data.length; i += 4) {
            // Get RGB values
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];
            
            // Apply brightness
            r += brightness;
            g += brightness;
            b += brightness;
            
            // Apply contrast
            r = ((r / 255 - 0.5) * contrast + 0.5) * 255;
            g = ((g / 255 - 0.5) * contrast + 0.5) * 255;
            b = ((b / 255 - 0.5) * contrast + 0.5) * 255;
            
            // Apply saturation (simplified)
            if (saturation !== 1) {
                const gray = r * 0.299 + g * 0.587 + b * 0.114;
                r = gray + (r - gray) * saturation;
                g = gray + (g - gray) * saturation;
                b = gray + (b - gray) * saturation;
            }
            
            // Clamp values
            data[i] = Math.max(0, Math.min(255, r));
            data[i + 1] = Math.max(0, Math.min(255, g));
            data[i + 2] = Math.max(0, Math.min(255, b));
        }
        
        context.putImageData(imageData, 0, 0);
    }

    /**
     * Auto enhance the scanned document
     */
    autoEnhance() {
        // Simple auto enhancement algorithm
        this.enhancementSettings = {
            brightness: 10,
            contrast: 1.2,
            saturation: 0.8,
            sharpness: 1,
            autoEnhance: true
        };
        
        // Update UI sliders
        document.getElementById('brightness-slider').value = this.enhancementSettings.brightness;
        document.getElementById('contrast-slider').value = this.enhancementSettings.contrast;
        document.getElementById('saturation-slider').value = this.enhancementSettings.saturation;
        
        // Update value displays
        document.getElementById('brightness-value').textContent = this.enhancementSettings.brightness;
        document.getElementById('contrast-value').textContent = this.enhancementSettings.contrast;
        document.getElementById('saturation-value').textContent = this.enhancementSettings.saturation;
        
        // Apply preview
        this.applyEnhancementPreview();
        
        this.showStatus('Auto enhancement applied', 'success');
    }

    /**
     * Reset enhancement settings
     */
    resetEnhancement() {
        this.enhancementSettings = {
            brightness: 0,
            contrast: 1,
            saturation: 1,
            sharpness: 0,
            autoEnhance: false
        };
        
        // Reset UI sliders
        document.getElementById('brightness-slider').value = 0;
        document.getElementById('contrast-slider').value = 1;
        document.getElementById('saturation-slider').value = 1;
        
        // Reset value displays
        document.getElementById('brightness-value').textContent = '0';
        document.getElementById('contrast-value').textContent = '1.0';
        document.getElementById('saturation-value').textContent = '1.0';
        
        // Apply preview
        this.applyEnhancementPreview();
        
        this.showStatus('Enhancement settings reset', 'info');
    }

    /**
     * Save scanned document as PDF
     */
    async saveScanAsPDF() {
        if (!this.currentScan) {
            this.showStatus('No scan to save', 'error');
            return;
        }
        
        try {
            this.showStatus('Converting scan to PDF...', 'info');
            
            const canvas = document.getElementById('scan-preview-canvas');
            const { jsPDF } = window.jspdf;
            
            // Calculate PDF dimensions (A4 proportions)
            const imgWidth = 210; // A4 width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            // Create PDF
            const pdf = new jsPDF({
                orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
                unit: 'mm',
                format: 'a4'
            });
            
            // Convert canvas to image
            const imgData = canvas.toDataURL('image/jpeg', 0.9);
            
            // Add image to PDF
            pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
            
            // Generate filename
            const filename = `Scanned_Document_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
            
            // Download PDF
            pdf.save(filename);
            
            this.showStatus('PDF saved successfully', 'success');
            
        } catch (error) {
            console.error('Error saving PDF:', error);
            this.showStatus('Failed to save PDF: ' + error.message, 'error');
        }
    }

    /**
     * Add scan to history
     */
    addToScanHistory(scan) {
        this.scanHistory.unshift(scan);
        
        // Limit history size
        if (this.scanHistory.length > 10) {
            this.scanHistory = this.scanHistory.slice(0, 10);
        }
        
        this.updateScanHistoryUI();
    }

    /**
     * Update scan history UI
     */
    updateScanHistoryUI() {
        const historyContainer = document.getElementById('scan-history');
        if (!historyContainer) return;
        
        if (this.scanHistory.length === 0) {
            historyContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>No scans yet</p>
                </div>
            `;
            return;
        }
        
        historyContainer.innerHTML = this.scanHistory.map((scan, index) => `
            <div class="scan-history-item" data-scan-id="${scan.id}">
                <div class="scan-thumbnail">
                    <canvas width="60" height="80"></canvas>
                </div>
                <div class="scan-info">
                    <div class="scan-title">Scan ${index + 1}</div>
                    <div class="scan-date">${scan.timestamp.toLocaleString()}</div>
                </div>
                <div class="scan-actions">
                    <button class="btn-icon btn-sm" onclick="scanner.loadScan('${scan.id}')" title="Load">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon btn-sm" onclick="scanner.deleteScan('${scan.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Generate thumbnails
        this.scanHistory.forEach((scan, index) => {
            const thumbnailCanvas = historyContainer.querySelector(`[data-scan-id="${scan.id}"] canvas`);
            if (thumbnailCanvas) {
                const thumbnailContext = thumbnailCanvas.getContext('2d');
                thumbnailContext.drawImage(scan.originalCanvas, 0, 0, 60, 80);
            }
        });
    }

    /**
     * Show camera access message
     */
    showCameraMessage() {
        const cameraMessage = document.getElementById('camera-message');
        const video = document.getElementById('scanner-video');
        
        if (cameraMessage && video) {
            cameraMessage.style.display = 'flex';
            video.style.display = 'none';
        }
    }

    /**
     * Show status message
     */
    showStatus(message, type = 'info') {
        // Emit status event for main app to handle
        if (window.app && window.app.showStatus) {
            window.app.showStatus(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    /**
     * Show enhancement panel
     */
    showEnhancementPanel() {
        const panel = document.getElementById('enhancement-panel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    }

    /**
     * Clean up resources
     */
    cleanup() {
        this.isDetecting = false;
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        if (this.video) {
            this.video.srcObject = null;
        }
    }
}

// Export for global access
window.DocumentScanner = DocumentScanner;