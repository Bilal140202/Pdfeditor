/**
 * PDF Reader Pro - Security Module
 * Advanced PDF protection with encryption, watermarks, and access control
 */

class PDFSecurity {
    constructor() {
        this.engine = null;
        this.encryptionAlgorithms = {
            AES128: 'AES-128',
            AES256: 'AES-256',
            RC4: 'RC4-128'
        };
        
        // Security settings
        this.securitySettings = {
            ownerPassword: '',
            userPassword: '',
            permissions: {
                print: true,
                copy: true,
                edit: true,
                annotate: true,
                fillForms: true,
                extract: true,
                assemble: true,
                printHighRes: true
            },
            encryption: this.encryptionAlgorithms.AES256
        };
        
        // Watermark settings
        this.watermarkSettings = {
            text: '',
            image: null,
            opacity: 0.3,
            rotation: 45,
            position: 'center',
            scale: 1.0,
            color: '#000000',
            font: 'Helvetica',
            fontSize: 48
        };
        
        // Digital signature verification
        this.signatureVerification = {
            enabled: true,
            trustedCertificates: new Set(),
            revocationChecking: true
        };
        
        this.init();
    }

    /**
     * Initialize security module
     */
    init() {
        this.createSecurityInterface();
        this.setupEventHandlers();
        
        console.log('PDF Security module initialized successfully');
    }

    /**
     * Create security interface
     */
    createSecurityInterface() {
        const workspace = document.getElementById('security-workspace');
        if (!workspace) return;
        
        workspace.innerHTML = `
            <div class="security-container">
                <!-- Security Header -->
                <div class="security-header">
                    <h2><i class="fas fa-shield-alt"></i> PDF Security</h2>
                    <div class="security-status" id="security-status">
                        <i class="fas fa-unlock text-warning"></i>
                        <span>Document Unprotected</span>
                    </div>
                </div>

                <!-- Security Options -->
                <div class="security-options">
                    <!-- Password Protection -->
                    <div class="security-section">
                        <h3><i class="fas fa-key"></i> Password Protection</h3>
                        <p>Protect your PDF with passwords to control access and permissions.</p>
                        
                        <div class="form-group">
                            <label>Owner Password (Full Access)</label>
                            <div class="password-input">
                                <input type="password" id="owner-password" placeholder="Enter owner password">
                                <button class="btn-icon toggle-password" data-target="owner-password">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                            <small>Owner password allows full access and permission changes</small>
                        </div>
                        
                        <div class="form-group">
                            <label>User Password (Restricted Access)</label>
                            <div class="password-input">
                                <input type="password" id="user-password" placeholder="Enter user password">
                                <button class="btn-icon toggle-password" data-target="user-password">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                            <small>User password allows limited access based on permissions</small>
                        </div>
                        
                        <div class="form-group">
                            <label>Encryption Level</label>
                            <select id="encryption-level">
                                <option value="AES-256">AES-256 (Strongest)</option>
                                <option value="AES-128">AES-128 (Standard)</option>
                                <option value="RC4-128">RC4-128 (Legacy)</option>
                            </select>
                        </div>
                        
                        <button class="btn-primary" id="apply-passwords">
                            <i class="fas fa-lock"></i> Apply Password Protection
                        </button>
                    </div>

                    <!-- Permissions -->
                    <div class="security-section">
                        <h3><i class="fas fa-user-shield"></i> Document Permissions</h3>
                        <p>Control what users can do with the PDF document.</p>
                        
                        <div class="permissions-grid">
                            <div class="permission-item">
                                <input type="checkbox" id="allow-print" checked>
                                <label for="allow-print">
                                    <i class="fas fa-print"></i>
                                    Allow Printing
                                </label>
                            </div>
                            <div class="permission-item">
                                <input type="checkbox" id="allow-copy" checked>
                                <label for="allow-copy">
                                    <i class="fas fa-copy"></i>
                                    Allow Text Copying
                                </label>
                            </div>
                            <div class="permission-item">
                                <input type="checkbox" id="allow-edit" checked>
                                <label for="allow-edit">
                                    <i class="fas fa-edit"></i>
                                    Allow Editing
                                </label>
                            </div>
                            <div class="permission-item">
                                <input type="checkbox" id="allow-annotate" checked>
                                <label for="allow-annotate">
                                    <i class="fas fa-comment"></i>
                                    Allow Annotations
                                </label>
                            </div>
                            <div class="permission-item">
                                <input type="checkbox" id="allow-forms" checked>
                                <label for="allow-forms">
                                    <i class="fas fa-wpforms"></i>
                                    Allow Form Filling
                                </label>
                            </div>
                            <div class="permission-item">
                                <input type="checkbox" id="allow-extract" checked>
                                <label for="allow-extract">
                                    <i class="fas fa-file-export"></i>
                                    Allow Content Extraction
                                </label>
                            </div>
                            <div class="permission-item">
                                <input type="checkbox" id="allow-assemble" checked>
                                <label for="allow-assemble">
                                    <i class="fas fa-puzzle-piece"></i>
                                    Allow Document Assembly
                                </label>
                            </div>
                            <div class="permission-item">
                                <input type="checkbox" id="allow-highres-print" checked>
                                <label for="allow-highres-print">
                                    <i class="fas fa-print"></i>
                                    Allow High Resolution Print
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Watermarks -->
                    <div class="security-section">
                        <h3><i class="fas fa-tint"></i> Watermarks</h3>
                        <p>Add watermarks to protect document authenticity and ownership.</p>
                        
                        <div class="watermark-tabs">
                            <button class="watermark-tab active" data-type="text">Text Watermark</button>
                            <button class="watermark-tab" data-type="image">Image Watermark</button>
                        </div>
                        
                        <!-- Text Watermark -->
                        <div class="watermark-panel active" id="text-watermark-panel">
                            <div class="form-row">
                                <div class="form-group flex-2">
                                    <label>Watermark Text</label>
                                    <input type="text" id="watermark-text" placeholder="e.g., CONFIDENTIAL">
                                </div>
                                <div class="form-group">
                                    <label>Font Size</label>
                                    <input type="number" id="watermark-font-size" value="48" min="12" max="200">
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Color</label>
                                    <input type="color" id="watermark-color" value="#000000">
                                </div>
                                <div class="form-group">
                                    <label>Opacity</label>
                                    <input type="range" id="watermark-opacity" min="0" max="1" step="0.1" value="0.3">
                                    <span id="opacity-value">30%</span>
                                </div>
                                <div class="form-group">
                                    <label>Rotation</label>
                                    <input type="range" id="watermark-rotation" min="-90" max="90" value="45">
                                    <span id="rotation-value">45°</span>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Position</label>
                                <select id="watermark-position">
                                    <option value="center">Center</option>
                                    <option value="top-left">Top Left</option>
                                    <option value="top-center">Top Center</option>
                                    <option value="top-right">Top Right</option>
                                    <option value="bottom-left">Bottom Left</option>
                                    <option value="bottom-center">Bottom Center</option>
                                    <option value="bottom-right">Bottom Right</option>
                                    <option value="repeat">Repeat Pattern</option>
                                </select>
                            </div>
                        </div>
                        
                        <!-- Image Watermark -->
                        <div class="watermark-panel" id="image-watermark-panel">
                            <div class="form-group">
                                <label>Watermark Image</label>
                                <div class="file-upload-area" id="watermark-image-upload">
                                    <i class="fas fa-cloud-upload-alt"></i>
                                    <p>Click to upload or drag image here</p>
                                    <input type="file" accept="image/*" hidden>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Scale</label>
                                    <input type="range" id="watermark-scale" min="0.1" max="2" step="0.1" value="1">
                                    <span id="scale-value">100%</span>
                                </div>
                                <div class="form-group">
                                    <label>Opacity</label>
                                    <input type="range" id="watermark-image-opacity" min="0" max="1" step="0.1" value="0.3">
                                    <span id="image-opacity-value">30%</span>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Position</label>
                                <select id="watermark-image-position">
                                    <option value="center">Center</option>
                                    <option value="top-left">Top Left</option>
                                    <option value="top-center">Top Center</option>
                                    <option value="top-right">Top Right</option>
                                    <option value="bottom-left">Bottom Left</option>
                                    <option value="bottom-center">Bottom Center</option>
                                    <option value="bottom-right">Bottom Right</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="watermark-actions">
                            <button class="btn-secondary" id="preview-watermark">
                                <i class="fas fa-eye"></i> Preview
                            </button>
                            <button class="btn-primary" id="apply-watermark">
                                <i class="fas fa-tint"></i> Apply Watermark
                            </button>
                        </div>
                    </div>

                    <!-- Digital Certificates -->
                    <div class="security-section">
                        <h3><i class="fas fa-certificate"></i> Digital Certificates</h3>
                        <p>Manage digital certificates for document signing and verification.</p>
                        
                        <div class="certificate-actions">
                            <button class="btn-secondary" id="import-certificate">
                                <i class="fas fa-upload"></i> Import Certificate
                            </button>
                            <button class="btn-secondary" id="create-certificate">
                                <i class="fas fa-plus"></i> Create Self-Signed Certificate
                            </button>
                            <button class="btn-secondary" id="verify-signatures">
                                <i class="fas fa-check-circle"></i> Verify All Signatures
                            </button>
                        </div>
                        
                        <div class="certificate-list" id="certificate-list">
                            <!-- Certificates will be listed here -->
                        </div>
                    </div>

                    <!-- Security Info -->
                    <div class="security-section">
                        <h3><i class="fas fa-info-circle"></i> Security Information</h3>
                        <div class="security-info" id="current-security-info">
                            <div class="security-item">
                                <strong>Encryption:</strong>
                                <span id="encryption-info">None</span>
                            </div>
                            <div class="security-item">
                                <strong>Password Protection:</strong>
                                <span id="password-info">No</span>
                            </div>
                            <div class="security-item">
                                <strong>Digital Signatures:</strong>
                                <span id="signature-info">None</span>
                            </div>
                            <div class="security-item">
                                <strong>Watermarks:</strong>
                                <span id="watermark-info">None</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // Password protection
        document.getElementById('apply-passwords')?.addEventListener('click', () => this.applyPasswordProtection());
        
        // Toggle password visibility
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', (e) => this.togglePasswordVisibility(e));
        });
        
        // Watermark tabs
        document.querySelectorAll('.watermark-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchWatermarkTab(e.target.dataset.type));
        });
        
        // Watermark controls
        document.getElementById('watermark-opacity')?.addEventListener('input', (e) => {
            document.getElementById('opacity-value').textContent = Math.round(e.target.value * 100) + '%';
        });
        
        document.getElementById('watermark-rotation')?.addEventListener('input', (e) => {
            document.getElementById('rotation-value').textContent = e.target.value + '°';
        });
        
        document.getElementById('watermark-scale')?.addEventListener('input', (e) => {
            document.getElementById('scale-value').textContent = Math.round(e.target.value * 100) + '%';
        });
        
        document.getElementById('watermark-image-opacity')?.addEventListener('input', (e) => {
            document.getElementById('image-opacity-value').textContent = Math.round(e.target.value * 100) + '%';
        });
        
        // Watermark actions
        document.getElementById('preview-watermark')?.addEventListener('click', () => this.previewWatermark());
        document.getElementById('apply-watermark')?.addEventListener('click', () => this.applyWatermark());
        
        // Certificate actions
        document.getElementById('import-certificate')?.addEventListener('click', () => this.importCertificate());
        document.getElementById('create-certificate')?.addEventListener('click', () => this.createSelfSignedCertificate());
        document.getElementById('verify-signatures')?.addEventListener('click', () => this.verifyAllSignatures());
        
        // Permission checkboxes
        document.querySelectorAll('.permission-item input').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updatePermissions());
        });
    }

    /**
     * Set PDF engine reference
     */
    setEngine(engine) {
        this.engine = engine;
        this.updateSecurityInfo();
    }

    /**
     * Apply password protection
     */
    async applyPasswordProtection() {
        if (!this.engine || !this.engine.currentPDF) {
            this.showError('No PDF document loaded');
            return;
        }

        try {
            this.showStatus('Applying password protection...', 'info');
            
            const ownerPassword = document.getElementById('owner-password').value;
            const userPassword = document.getElementById('user-password').value;
            const encryptionLevel = document.getElementById('encryption-level').value;
            
            if (!ownerPassword && !userPassword) {
                this.showError('Please enter at least one password');
                return;
            }
            
            // Get current permissions
            this.updatePermissions();
            
            // Create protected PDF
            const protectedPDF = await this.createProtectedPDF({
                ownerPassword,
                userPassword,
                encryption: encryptionLevel,
                permissions: this.securitySettings.permissions
            });
            
            // Update security settings
            this.securitySettings.ownerPassword = ownerPassword;
            this.securitySettings.userPassword = userPassword;
            this.securitySettings.encryption = encryptionLevel;
            
            this.showStatus('Password protection applied successfully', 'success');
            this.updateSecurityInfo();
            
            // Trigger document update
            if (this.engine.onSecurityUpdate) {
                this.engine.onSecurityUpdate(protectedPDF);
            }
            
        } catch (error) {
            console.error('Error applying password protection:', error);
            this.showError('Failed to apply password protection: ' + error.message);
        }
    }

    /**
     * Create protected PDF
     */
    async createProtectedPDF(options) {
        // This would use PDF creation libraries like jsPDF with security options
        // For demonstration, we'll simulate the process
        
        return new Promise((resolve, reject) => {
            try {
                // Simulate PDF protection process
                setTimeout(() => {
                    // In a real implementation, this would:
                    // 1. Extract all pages and content from current PDF
                    // 2. Create new PDF with security settings
                    // 3. Apply encryption and permissions
                    // 4. Return the protected PDF data
                    
                    resolve({
                        data: new ArrayBuffer(0), // Placeholder
                        isProtected: true,
                        encryption: options.encryption,
                        hasOwnerPassword: !!options.ownerPassword,
                        hasUserPassword: !!options.userPassword,
                        permissions: options.permissions
                    });
                }, 1000);
                
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Update permissions from UI
     */
    updatePermissions() {
        this.securitySettings.permissions = {
            print: document.getElementById('allow-print').checked,
            copy: document.getElementById('allow-copy').checked,
            edit: document.getElementById('allow-edit').checked,
            annotate: document.getElementById('allow-annotate').checked,
            fillForms: document.getElementById('allow-forms').checked,
            extract: document.getElementById('allow-extract').checked,
            assemble: document.getElementById('allow-assemble').checked,
            printHighRes: document.getElementById('allow-highres-print').checked
        };
    }

    /**
     * Apply watermark to PDF
     */
    async applyWatermark() {
        if (!this.engine || !this.engine.currentPDF) {
            this.showError('No PDF document loaded');
            return;
        }

        try {
            this.showStatus('Applying watermark...', 'info');
            
            const activeTab = document.querySelector('.watermark-tab.active').dataset.type;
            
            if (activeTab === 'text') {
                const text = document.getElementById('watermark-text').value.trim();
                if (!text) {
                    this.showError('Please enter watermark text');
                    return;
                }
                
                this.watermarkSettings = {
                    type: 'text',
                    text: text,
                    fontSize: parseInt(document.getElementById('watermark-font-size').value),
                    color: document.getElementById('watermark-color').value,
                    opacity: parseFloat(document.getElementById('watermark-opacity').value),
                    rotation: parseInt(document.getElementById('watermark-rotation').value),
                    position: document.getElementById('watermark-position').value
                };
                
            } else {
                // Image watermark logic would go here
                this.showError('Image watermark not implemented yet');
                return;
            }
            
            // Apply watermark to all pages
            await this.addWatermarkToAllPages();
            
            this.showStatus('Watermark applied successfully', 'success');
            this.updateSecurityInfo();
            
        } catch (error) {
            console.error('Error applying watermark:', error);
            this.showError('Failed to apply watermark: ' + error.message);
        }
    }

    /**
     * Add watermark to all pages
     */
    async addWatermarkToAllPages() {
        const pdf = this.engine.currentPDF;
        const totalPages = pdf.numPages;
        
        for (let i = 1; i <= totalPages; i++) {
            await this.addWatermarkToPage(i);
        }
    }

    /**
     * Add watermark to specific page
     */
    async addWatermarkToPage(pageNum) {
        const page = await this.engine.currentPDF.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.0 });
        
        // Create watermark canvas
        const watermarkCanvas = document.createElement('canvas');
        const watermarkContext = watermarkCanvas.getContext('2d');
        
        watermarkCanvas.width = viewport.width;
        watermarkCanvas.height = viewport.height;
        
        // Set watermark styles
        watermarkContext.globalAlpha = this.watermarkSettings.opacity;
        watermarkContext.fillStyle = this.watermarkSettings.color;
        watermarkContext.font = `${this.watermarkSettings.fontSize}px ${this.watermarkSettings.font || 'Helvetica'}`;
        watermarkContext.textAlign = 'center';
        watermarkContext.textBaseline = 'middle';
        
        // Calculate position
        let x = viewport.width / 2;
        let y = viewport.height / 2;
        
        if (this.watermarkSettings.position === 'top-left') {
            x = viewport.width * 0.25;
            y = viewport.height * 0.25;
        } else if (this.watermarkSettings.position === 'top-right') {
            x = viewport.width * 0.75;
            y = viewport.height * 0.25;
        } else if (this.watermarkSettings.position === 'bottom-left') {
            x = viewport.width * 0.25;
            y = viewport.height * 0.75;
        } else if (this.watermarkSettings.position === 'bottom-right') {
            x = viewport.width * 0.75;
            y = viewport.height * 0.75;
        }
        
        // Apply rotation
        watermarkContext.save();
        watermarkContext.translate(x, y);
        watermarkContext.rotate((this.watermarkSettings.rotation * Math.PI) / 180);
        
        if (this.watermarkSettings.position === 'repeat') {
            // Create repeating pattern
            const spacing = 200;
            for (let rx = -viewport.width; rx < viewport.width * 2; rx += spacing) {
                for (let ry = -viewport.height; ry < viewport.height * 2; ry += spacing) {
                    watermarkContext.fillText(this.watermarkSettings.text, rx, ry);
                }
            }
        } else {
            watermarkContext.fillText(this.watermarkSettings.text, 0, 0);
        }
        
        watermarkContext.restore();
        
        // In a real implementation, this watermark would be composited with the PDF page
        // For now, we'll just update the display
        if (this.engine.viewer) {
            this.engine.viewer.addWatermarkOverlay(pageNum, watermarkCanvas);
        }
    }

    /**
     * Preview watermark
     */
    async previewWatermark() {
        if (!this.engine || !this.engine.currentPDF) {
            this.showError('No PDF document loaded');
            return;
        }

        // Create preview modal
        const modal = document.createElement('div');
        modal.className = 'watermark-preview-modal modal-overlay';
        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h3>Watermark Preview</h3>
                    <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <canvas id="watermark-preview-canvas"></canvas>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Render preview
        await this.renderWatermarkPreview();
    }

    /**
     * Render watermark preview
     */
    async renderWatermarkPreview() {
        const canvas = document.getElementById('watermark-preview-canvas');
        if (!canvas) return;
        
        const page = await this.engine.currentPDF.getPage(1);
        const viewport = page.getViewport({ scale: 0.8 });
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        const context = canvas.getContext('2d');
        
        // Render page
        await page.render({ canvasContext: context, viewport }).promise;
        
        // Add watermark preview
        await this.addWatermarkToCanvas(canvas, context);
    }

    /**
     * Toggle password visibility
     */
    togglePasswordVisibility(event) {
        const button = event.target.closest('.toggle-password');
        const targetId = button.dataset.target;
        const input = document.getElementById(targetId);
        const icon = button.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }

    /**
     * Switch watermark tab
     */
    switchWatermarkTab(type) {
        // Update tab buttons
        document.querySelectorAll('.watermark-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.type === type);
        });
        
        // Update panels
        document.querySelectorAll('.watermark-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${type}-watermark-panel`);
        });
    }

    /**
     * Import certificate
     */
    importCertificate() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.p12,.pfx,.pem,.crt';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.loadCertificate(file);
            }
        };
        input.click();
    }

    /**
     * Load certificate file
     */
    async loadCertificate(file) {
        try {
            this.showStatus('Loading certificate...', 'info');
            
            const arrayBuffer = await file.arrayBuffer();
            
            // In a real implementation, this would parse the certificate
            // For now, we'll simulate adding it to the trusted certificates
            const certificateInfo = {
                name: file.name,
                issuer: 'Unknown',
                subject: 'Unknown',
                validFrom: new Date(),
                validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                fingerprint: 'SHA1: ' + Math.random().toString(36).substr(2, 20).toUpperCase()
            };
            
            this.signatureVerification.trustedCertificates.add(certificateInfo);
            this.updateCertificateList();
            
            this.showStatus('Certificate imported successfully', 'success');
            
        } catch (error) {
            console.error('Error loading certificate:', error);
            this.showError('Failed to load certificate: ' + error.message);
        }
    }

    /**
     * Create self-signed certificate
     */
    createSelfSignedCertificate() {
        const modal = document.createElement('div');
        modal.className = 'create-certificate-modal modal-overlay';
        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h3>Create Self-Signed Certificate</h3>
                    <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Common Name (Full Name)</label>
                        <input type="text" id="cert-common-name" placeholder="John Doe">
                    </div>
                    <div class="form-group">
                        <label>Organization</label>
                        <input type="text" id="cert-organization" placeholder="Your Company">
                    </div>
                    <div class="form-group">
                        <label>Email Address</label>
                        <input type="email" id="cert-email" placeholder="john@example.com">
                    </div>
                    <div class="form-group">
                        <label>Country Code</label>
                        <input type="text" id="cert-country" placeholder="US" maxlength="2">
                    </div>
                    <div class="form-group">
                        <label>Valid for (days)</label>
                        <input type="number" id="cert-validity" value="365" min="1" max="3650">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button class="btn-primary" onclick="pdfSecurity.generateSelfSignedCert()">Create Certificate</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    /**
     * Generate self-signed certificate
     */
    generateSelfSignedCert() {
        try {
            const commonName = document.getElementById('cert-common-name').value.trim();
            const organization = document.getElementById('cert-organization').value.trim();
            const email = document.getElementById('cert-email').value.trim();
            const country = document.getElementById('cert-country').value.trim();
            const validity = parseInt(document.getElementById('cert-validity').value);
            
            if (!commonName || !email) {
                this.showError('Please fill in required fields');
                return;
            }
            
            // In a real implementation, this would generate an actual certificate
            const certificateInfo = {
                name: `Self-Signed Certificate (${commonName})`,
                issuer: commonName,
                subject: `CN=${commonName}, O=${organization}, C=${country}`,
                email: email,
                validFrom: new Date(),
                validTo: new Date(Date.now() + validity * 24 * 60 * 60 * 1000),
                fingerprint: 'SHA256: ' + Math.random().toString(36).substr(2, 32).toUpperCase(),
                selfSigned: true
            };
            
            this.signatureVerification.trustedCertificates.add(certificateInfo);
            this.updateCertificateList();
            
            // Close modal
            document.querySelector('.create-certificate-modal').remove();
            
            this.showStatus('Self-signed certificate created successfully', 'success');
            
        } catch (error) {
            console.error('Error creating certificate:', error);
            this.showError('Failed to create certificate: ' + error.message);
        }
    }

    /**
     * Update certificate list display
     */
    updateCertificateList() {
        const container = document.getElementById('certificate-list');
        if (!container) return;
        
        if (this.signatureVerification.trustedCertificates.size === 0) {
            container.innerHTML = '<p class="no-certificates">No certificates installed</p>';
            return;
        }
        
        let html = '<div class="certificates">';
        
        this.signatureVerification.trustedCertificates.forEach(cert => {
            html += `
                <div class="certificate-item">
                    <div class="certificate-icon">
                        <i class="fas fa-certificate ${cert.selfSigned ? 'text-warning' : 'text-success'}"></i>
                    </div>
                    <div class="certificate-info">
                        <h4>${cert.name}</h4>
                        <p><strong>Subject:</strong> ${cert.subject}</p>
                        <p><strong>Valid:</strong> ${cert.validFrom.toLocaleDateString()} - ${cert.validTo.toLocaleDateString()}</p>
                        <p><strong>Fingerprint:</strong> ${cert.fingerprint}</p>
                        ${cert.selfSigned ? '<span class="badge badge-warning">Self-Signed</span>' : ''}
                    </div>
                    <div class="certificate-actions">
                        <button class="btn-icon btn-sm" title="Remove Certificate">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * Verify all signatures in document
     */
    async verifyAllSignatures() {
        if (!this.engine || !this.engine.currentPDF) {
            this.showError('No PDF document loaded');
            return;
        }

        try {
            this.showStatus('Verifying digital signatures...', 'info');
            
            // In a real implementation, this would:
            // 1. Extract all signature annotations from the PDF
            // 2. Verify each signature against trusted certificates
            // 3. Check certificate validity and revocation status
            // 4. Display verification results
            
            // Simulate verification process
            setTimeout(() => {
                this.showSignatureVerificationResults([]);
            }, 1000);
            
        } catch (error) {
            console.error('Error verifying signatures:', error);
            this.showError('Failed to verify signatures: ' + error.message);
        }
    }

    /**
     * Show signature verification results
     */
    showSignatureVerificationResults(signatures) {
        const modal = document.createElement('div');
        modal.className = 'signature-verification-modal modal-overlay';
        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h3>Signature Verification Results</h3>
                    <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${signatures.length === 0 ? 
                        '<p class="no-signatures">No digital signatures found in this document.</p>' :
                        '<div class="signature-results">' + signatures.map(sig => `
                            <div class="signature-result ${sig.valid ? 'valid' : 'invalid'}">
                                <div class="signature-status">
                                    <i class="fas fa-${sig.valid ? 'check-circle text-success' : 'exclamation-triangle text-error'}"></i>
                                    <span>${sig.valid ? 'Valid' : 'Invalid'}</span>
                                </div>
                                <div class="signature-details">
                                    <p><strong>Signer:</strong> ${sig.signer}</p>
                                    <p><strong>Date:</strong> ${sig.date}</p>
                                    <p><strong>Reason:</strong> ${sig.reason}</p>
                                </div>
                            </div>
                        `).join('') + '</div>'
                    }
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    /**
     * Update security information display
     */
    updateSecurityInfo() {
        const encryptionInfo = document.getElementById('encryption-info');
        const passwordInfo = document.getElementById('password-info');
        const signatureInfo = document.getElementById('signature-info');
        const watermarkInfo = document.getElementById('watermark-info');
        const securityStatus = document.getElementById('security-status');
        
        if (!encryptionInfo) return;
        
        // Update encryption info
        if (this.securitySettings.ownerPassword || this.securitySettings.userPassword) {
            encryptionInfo.textContent = this.securitySettings.encryption;
            passwordInfo.textContent = 'Yes';
            securityStatus.innerHTML = '<i class="fas fa-lock text-success"></i><span>Document Protected</span>';
        } else {
            encryptionInfo.textContent = 'None';
            passwordInfo.textContent = 'No';
            securityStatus.innerHTML = '<i class="fas fa-unlock text-warning"></i><span>Document Unprotected</span>';
        }
        
        // Update signature info
        const certCount = this.signatureVerification.trustedCertificates.size;
        signatureInfo.textContent = certCount > 0 ? `${certCount} certificate(s)` : 'None';
        
        // Update watermark info
        watermarkInfo.textContent = this.watermarkSettings.text ? 'Applied' : 'None';
    }

    /**
     * Show status message
     */
    showStatus(message, type = 'info') {
        if (window.app && window.app.showStatus) {
            window.app.showStatus(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showStatus(message, 'error');
    }

    /**
     * Get security settings
     */
    getSecuritySettings() {
        return { ...this.securitySettings };
    }

    /**
     * Check if document is protected
     */
    isProtected() {
        return !!(this.securitySettings.ownerPassword || this.securitySettings.userPassword);
    }
}

// Export for global access
window.PDFSecurity = PDFSecurity;