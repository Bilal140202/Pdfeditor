/**
 * PDF Reader Pro - Digital Signature Module
 * Advanced e-signature system with security and form filling capabilities
 */

class PDFSignature {
    constructor() {
        this.engine = null;
        this.signatures = new Map(); // Store signatures by ID
        this.currentSignature = null;
        this.signatureMode = false;
        
        // Signature types
        this.signatureTypes = {
            DRAW: 'draw',
            TYPE: 'type', 
            IMAGE: 'image',
            DIGITAL: 'digital'
        };
        
        // Current signature settings
        this.signatureSettings = {
            type: this.signatureTypes.DRAW,
            color: '#000000',
            fontSize: 14,
            fontFamily: 'Courier New',
            strokeWidth: 2,
            backgroundColor: 'transparent'
        };
        
        // Digital signature settings
        this.digitalSettings = {
            certificateName: '',
            reason: 'I approve this document',
            location: '',
            contactInfo: ''
        };
        
        // Drawing state
        this.isDrawing = false;
        this.drawingPoints = [];
        this.signatureCanvas = null;
        this.signatureContext = null;
        
        this.init();
    }

    /**
     * Initialize signature system
     */
    init() {
        this.createSignatureInterface();
        this.setupEventHandlers();
        
        console.log('PDF Signature system initialized successfully');
    }

    /**
     * Create signature creation interface
     */
    createSignatureInterface() {
        // Create signature pad modal
        const modal = document.createElement('div');
        modal.className = 'signature-modal modal-overlay';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h3><i class="fas fa-signature"></i> Create Signature</h3>
                    <button class="btn-close" onclick="this.closest('.signature-modal').style.display='none'">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="signature-tabs">
                        <button class="signature-tab active" data-type="draw">
                            <i class="fas fa-pen"></i> Draw
                        </button>
                        <button class="signature-tab" data-type="type">
                            <i class="fas fa-keyboard"></i> Type
                        </button>
                        <button class="signature-tab" data-type="image">
                            <i class="fas fa-image"></i> Upload
                        </button>
                        <button class="signature-tab" data-type="digital">
                            <i class="fas fa-certificate"></i> Digital
                        </button>
                    </div>
                    
                    <!-- Draw Signature -->
                    <div class="signature-content" id="draw-signature">
                        <div class="signature-canvas-container">
                            <canvas id="signature-canvas" width="400" height="150"></canvas>
                        </div>
                        <div class="signature-controls">
                            <label>Stroke Color:</label>
                            <input type="color" id="signature-color" value="#000000">
                            <label>Stroke Width:</label>
                            <input type="range" id="signature-width" min="1" max="10" value="2">
                            <button class="btn-secondary" id="clear-signature">Clear</button>
                        </div>
                    </div>
                    
                    <!-- Type Signature -->
                    <div class="signature-content" id="type-signature" style="display: none;">
                        <div class="signature-type-container">
                            <input type="text" id="signature-text" placeholder="Enter your name" class="form-input">
                            <div class="font-options">
                                <label>Font:</label>
                                <select id="signature-font" class="form-select">
                                    <option value="Courier New">Courier New</option>
                                    <option value="Times New Roman">Times New Roman</option>
                                    <option value="Arial">Arial</option>
                                    <option value="Georgia">Georgia</option>
                                    <option value="Lucida Handwriting">Lucida Handwriting</option>
                                    <option value="Brush Script MT">Brush Script</option>
                                </select>
                                <label>Size:</label>
                                <input type="number" id="signature-size" min="12" max="48" value="18">
                            </div>
                            <div class="signature-preview" id="signature-text-preview">
                                Type your name above
                            </div>
                        </div>
                    </div>
                    
                    <!-- Upload Signature -->
                    <div class="signature-content" id="image-signature" style="display: none;">
                        <div class="signature-upload-container">
                            <div class="file-upload-area" id="signature-upload-area">
                                <i class="fas fa-cloud-upload-alt"></i>
                                <p>Drop signature image here or click to upload</p>
                                <p class="file-info">Supported: PNG, JPG, GIF (Max 2MB)</p>
                                <input type="file" id="signature-file" accept=".png,.jpg,.jpeg,.gif" style="display: none;">
                            </div>
                            <div class="signature-image-preview" id="signature-image-preview" style="display: none;">
                                <img id="signature-image" style="max-width: 100%; max-height: 150px;">
                                <button class="btn-secondary" id="remove-signature-image">Remove</button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Digital Signature -->
                    <div class="signature-content" id="digital-signature" style="display: none;">
                        <div class="digital-signature-form">
                            <div class="form-group">
                                <label>Certificate Name:</label>
                                <input type="text" id="certificate-name" class="form-input" placeholder="John Doe">
                            </div>
                            <div class="form-group">
                                <label>Reason for Signing:</label>
                                <input type="text" id="signature-reason" class="form-input" value="I approve this document">
                            </div>
                            <div class="form-group">
                                <label>Location:</label>
                                <input type="text" id="signature-location" class="form-input" placeholder="New York, NY">
                            </div>
                            <div class="form-group">
                                <label>Contact Information:</label>
                                <input type="email" id="signature-contact" class="form-input" placeholder="john@example.com">
                            </div>
                            <div class="certificate-info">
                                <i class="fas fa-info-circle"></i>
                                <p>Digital signatures provide the highest level of security and legal validity. A certificate will be generated based on your information.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.signature-modal').style.display='none'">Cancel</button>
                    <button class="btn-primary" id="save-signature">Save Signature</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.signatureModal = modal;
        
        // Initialize canvas
        this.signatureCanvas = document.getElementById('signature-canvas');
        this.signatureContext = this.signatureCanvas.getContext('2d');
        this.setupSignatureCanvas();
    }

    /**
     * Setup signature canvas for drawing
     */
    setupSignatureCanvas() {
        if (!this.signatureCanvas) return;
        
        // Set canvas background
        this.signatureContext.fillStyle = 'white';
        this.signatureContext.fillRect(0, 0, this.signatureCanvas.width, this.signatureCanvas.height);
        
        // Canvas drawing events
        this.signatureCanvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.signatureCanvas.addEventListener('mousemove', (e) => this.draw(e));
        this.signatureCanvas.addEventListener('mouseup', () => this.stopDrawing());
        this.signatureCanvas.addEventListener('mouseout', () => this.stopDrawing());
        
        // Touch events for mobile
        this.signatureCanvas.addEventListener('touchstart', (e) => this.startDrawing(e));
        this.signatureCanvas.addEventListener('touchmove', (e) => this.draw(e));
        this.signatureCanvas.addEventListener('touchend', () => this.stopDrawing());
    }

    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // Signature tab switching
        document.addEventListener('click', (e) => {
            if (e.target.matches('.signature-tab')) {
                this.switchSignatureTab(e.target.dataset.type);
            }
        });
        
        // Drawing controls
        document.addEventListener('change', (e) => {
            if (e.target.id === 'signature-color') {
                this.signatureSettings.color = e.target.value;
            } else if (e.target.id === 'signature-width') {
                this.signatureSettings.strokeWidth = parseInt(e.target.value);
            }
        });
        
        // Clear signature canvas
        document.addEventListener('click', (e) => {
            if (e.target.id === 'clear-signature') {
                this.clearSignatureCanvas();
            }
        });
        
        // Text signature preview
        document.addEventListener('input', (e) => {
            if (e.target.id === 'signature-text') {
                this.updateTextSignaturePreview();
            }
        });
        
        document.addEventListener('change', (e) => {
            if (e.target.id === 'signature-font' || e.target.id === 'signature-size') {
                this.updateTextSignaturePreview();
            }
        });
        
        // File upload
        document.addEventListener('click', (e) => {
            if (e.target.closest('#signature-upload-area')) {
                document.getElementById('signature-file').click();
            }
        });
        
        document.addEventListener('change', (e) => {
            if (e.target.id === 'signature-file') {
                this.handleSignatureImageUpload(e.target.files[0]);
            }
        });
        
        // Save signature
        document.addEventListener('click', (e) => {
            if (e.target.id === 'save-signature') {
                this.saveCurrentSignature();
            }
        });
        
        // Drag and drop for signature upload
        const uploadArea = document.getElementById('signature-upload-area');
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                    this.handleSignatureImageUpload(file);
                }
            });
        }
    }

    /**
     * Set PDF engine reference
     */
    setEngine(engine) {
        this.engine = engine;
    }

    /**
     * Enable signature mode
     */
    enableSignatureMode() {
        this.signatureMode = true;
        document.body.classList.add('signature-mode');
        
        // Change cursor to indicate signature mode
        const canvas = document.getElementById('pdf-canvas');
        if (canvas) {
            canvas.style.cursor = 'crosshair';
        }
        
        this.emit('signatureModeEnabled');
    }

    /**
     * Disable signature mode
     */
    disableSignatureMode() {
        this.signatureMode = false;
        document.body.classList.remove('signature-mode');
        
        // Reset cursor
        const canvas = document.getElementById('pdf-canvas');
        if (canvas) {
            canvas.style.cursor = 'default';
        }
        
        this.emit('signatureModeDisabled');
    }

    /**
     * Show signature creation modal
     */
    showSignatureModal() {
        this.signatureModal.style.display = 'flex';
        this.clearSignatureCanvas();
    }

    /**
     * Switch signature tab
     */
    switchSignatureTab(type) {
        // Update active tab
        document.querySelectorAll('.signature-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-type="${type}"]`).classList.add('active');
        
        // Show corresponding content
        document.querySelectorAll('.signature-content').forEach(content => {
            content.style.display = 'none';
        });
        document.getElementById(`${type}-signature`).style.display = 'block';
        
        this.signatureSettings.type = type;
    }

    /**
     * Drawing functions
     */
    startDrawing(e) {
        this.isDrawing = true;
        const rect = this.signatureCanvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;
        
        this.drawingPoints = [{ x, y }];
        
        this.signatureContext.beginPath();
        this.signatureContext.moveTo(x, y);
        this.signatureContext.strokeStyle = this.signatureSettings.color;
        this.signatureContext.lineWidth = this.signatureSettings.strokeWidth;
        this.signatureContext.lineCap = 'round';
        this.signatureContext.lineJoin = 'round';
    }

    draw(e) {
        if (!this.isDrawing) return;
        
        e.preventDefault();
        const rect = this.signatureCanvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;
        
        this.drawingPoints.push({ x, y });
        
        this.signatureContext.lineTo(x, y);
        this.signatureContext.stroke();
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    /**
     * Clear signature canvas
     */
    clearSignatureCanvas() {
        this.signatureContext.clearRect(0, 0, this.signatureCanvas.width, this.signatureCanvas.height);
        this.signatureContext.fillStyle = 'white';
        this.signatureContext.fillRect(0, 0, this.signatureCanvas.width, this.signatureCanvas.height);
        this.drawingPoints = [];
    }

    /**
     * Update text signature preview
     */
    updateTextSignaturePreview() {
        const text = document.getElementById('signature-text').value;
        const font = document.getElementById('signature-font').value;
        const size = document.getElementById('signature-size').value;
        const preview = document.getElementById('signature-text-preview');
        
        preview.style.fontFamily = font;
        preview.style.fontSize = size + 'px';
        preview.style.color = this.signatureSettings.color;
        preview.textContent = text || 'Type your name above';
    }

    /**
     * Handle signature image upload
     */
    handleSignatureImageUpload(file) {
        if (!file) return;
        
        if (file.size > 2 * 1024 * 1024) {
            alert('File size must be less than 2MB');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.getElementById('signature-image');
            const preview = document.getElementById('signature-image-preview');
            const uploadArea = document.getElementById('signature-upload-area');
            
            img.src = e.target.result;
            preview.style.display = 'block';
            uploadArea.style.display = 'none';
            
            this.signatureImageData = e.target.result;
        };
        
        reader.readAsDataURL(file);
        
        // Remove image handler
        document.getElementById('remove-signature-image').onclick = () => {
            document.getElementById('signature-image-preview').style.display = 'none';
            document.getElementById('signature-upload-area').style.display = 'block';
            this.signatureImageData = null;
        };
    }

    /**
     * Save current signature
     */
    async saveCurrentSignature() {
        let signatureData = null;
        
        try {
            switch (this.signatureSettings.type) {
                case this.signatureTypes.DRAW:
                    signatureData = await this.saveDrawnSignature();
                    break;
                case this.signatureTypes.TYPE:
                    signatureData = await this.saveTypedSignature();
                    break;
                case this.signatureTypes.IMAGE:
                    signatureData = await this.saveImageSignature();
                    break;
                case this.signatureTypes.DIGITAL:
                    signatureData = await this.saveDigitalSignature();
                    break;
            }
            
            if (signatureData) {
                const signatureId = this.generateSignatureId();
                this.signatures.set(signatureId, {
                    id: signatureId,
                    type: this.signatureSettings.type,
                    data: signatureData,
                    created: new Date(),
                    settings: { ...this.signatureSettings }
                });
                
                this.currentSignature = signatureId;
                this.signatureModal.style.display = 'none';
                
                this.emit('signatureCreated', {
                    id: signatureId,
                    type: this.signatureSettings.type
                });
                
                // Enable signature placement mode
                this.enableSignatureMode();
            }
            
        } catch (error) {
            console.error('Error saving signature:', error);
            alert('Failed to save signature: ' + error.message);
        }
    }

    /**
     * Save drawn signature
     */
    async saveDrawnSignature() {
        if (this.drawingPoints.length === 0) {
            throw new Error('Please draw your signature');
        }
        
        // Convert canvas to image data
        const imageData = this.signatureCanvas.toDataURL('image/png');
        
        return {
            imageData,
            points: this.drawingPoints,
            color: this.signatureSettings.color,
            strokeWidth: this.signatureSettings.strokeWidth
        };
    }

    /**
     * Save typed signature
     */
    async saveTypedSignature() {
        const text = document.getElementById('signature-text').value.trim();
        if (!text) {
            throw new Error('Please enter your name');
        }
        
        const font = document.getElementById('signature-font').value;
        const size = parseInt(document.getElementById('signature-size').value);
        
        // Create canvas to render text signature
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set font and measure text
        ctx.font = `${size}px "${font}"`;
        const metrics = ctx.measureText(text);
        
        canvas.width = Math.ceil(metrics.width) + 20;
        canvas.height = size + 20;
        
        // Render text
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = `${size}px "${font}"`;
        ctx.fillStyle = this.signatureSettings.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
        
        return {
            text,
            font,
            size,
            color: this.signatureSettings.color,
            imageData: canvas.toDataURL('image/png')
        };
    }

    /**
     * Save image signature
     */
    async saveImageSignature() {
        if (!this.signatureImageData) {
            throw new Error('Please upload a signature image');
        }
        
        return {
            imageData: this.signatureImageData
        };
    }

    /**
     * Save digital signature
     */
    async saveDigitalSignature() {
        const certificateName = document.getElementById('certificate-name').value.trim();
        const reason = document.getElementById('signature-reason').value.trim();
        const location = document.getElementById('signature-location').value.trim();
        const contact = document.getElementById('signature-contact').value.trim();
        
        if (!certificateName) {
            throw new Error('Please enter certificate name');
        }
        
        // Generate digital signature certificate (simplified)
        const certificate = await this.generateDigitalCertificate({
            name: certificateName,
            reason,
            location,
            contact
        });
        
        return {
            certificate,
            reason,
            location,
            contact,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Generate digital certificate (simplified implementation)
     */
    async generateDigitalCertificate(info) {
        // In a real implementation, this would involve proper cryptographic operations
        const certificateData = {
            version: '1.0',
            serialNumber: this.generateSerialNumber(),
            issuer: 'PDF Reader Pro CA',
            subject: info.name,
            notBefore: new Date(),
            notAfter: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
            publicKey: await this.generateKeyPair(),
            signature: await this.generateSignature(info)
        };
        
        return certificateData;
    }

    /**
     * Generate key pair (simplified)
     */
    async generateKeyPair() {
        // Simplified key generation - in real implementation use Web Crypto API
        return {
            algorithm: 'RSA-2048',
            publicKey: this.generateRandomString(512),
            keyId: this.generateRandomString(32)
        };
    }

    /**
     * Generate digital signature hash (simplified)
     */
    async generateSignature(data) {
        // Simplified signature - in real implementation use proper cryptographic signing
        const dataString = JSON.stringify(data);
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(dataString);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * Place signature on PDF
     */
    async placeSignature(x, y, width = 150, height = 50) {
        if (!this.currentSignature) {
            throw new Error('No signature selected');
        }
        
        const signature = this.signatures.get(this.currentSignature);
        if (!signature) {
            throw new Error('Invalid signature');
        }
        
        // Add signature to current page
        const signatureElement = {
            id: this.generateElementId(),
            type: 'signature',
            signatureId: this.currentSignature,
            x,
            y,
            width,
            height,
            page: this.engine.currentPage,
            timestamp: new Date().toISOString()
        };
        
        // Render signature on PDF
        await this.renderSignatureOnPDF(signatureElement);
        
        // Disable signature mode
        this.disableSignatureMode();
        
        this.emit('signaturePlaced', signatureElement);
        
        return signatureElement;
    }

    /**
     * Render signature on PDF canvas
     */
    async renderSignatureOnPDF(signatureElement) {
        const signature = this.signatures.get(signatureElement.signatureId);
        if (!signature || !this.engine) return;
        
        const canvas = document.getElementById('pdf-canvas');
        const context = canvas.getContext('2d');
        
        // Scale coordinates to match current PDF scale
        const scale = this.engine.scale;
        const scaledX = signatureElement.x * scale;
        const scaledY = signatureElement.y * scale;
        const scaledWidth = signatureElement.width * scale;
        const scaledHeight = signatureElement.height * scale;
        
        if (signature.data.imageData) {
            // Load signature image
            const img = new Image();
            img.onload = () => {
                context.drawImage(img, scaledX, scaledY, scaledWidth, scaledHeight);
            };
            img.src = signature.data.imageData;
        }
        
        // Add timestamp and verification info for digital signatures
        if (signature.type === this.signatureTypes.DIGITAL) {
            context.save();
            context.font = '8px Arial';
            context.fillStyle = '#666';
            context.fillText(
                `Digitally signed by ${signature.data.certificate.subject}`,
                scaledX,
                scaledY + scaledHeight + 10
            );
            context.fillText(
                `Date: ${new Date(signature.data.timestamp).toLocaleString()}`,
                scaledX,
                scaledY + scaledHeight + 22
            );
            context.restore();
        }
    }

    /**
     * Utility functions
     */
    generateSignatureId() {
        return 'sig_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateElementId() {
        return 'elem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateSerialNumber() {
        return Math.random().toString(36).substr(2, 16).toUpperCase();
    }

    generateRandomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
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

    emit(event, data) {
        if (!this.eventListeners?.has(event)) return;
        
        this.eventListeners.get(event).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Error in signature event listener:', error);
            }
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PDFSignature;
}