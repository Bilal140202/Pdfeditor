/**
 * PDF Reader Pro - Main Application Controller
 * Orchestrates all modules and provides unified interface
 */

class PDFReaderPro {
    constructor() {
        this.modules = {};
        this.currentTool = 'viewer';
        this.currentDocument = null;
        this.settings = {
            theme: 'light',
            autoSave: true,
            defaultZoom: 1.0,
            showThumbnails: false
        };
        
        // UI elements
        this.elements = {
            header: null,
            sidebar: null,
            workspace: null,
            fileInput: null,
            noDocumentState: null,
            loadingScreen: null
        };
        
        // File handling
        this.supportedFormats = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/gif',
            'text/plain'
        ];
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            this.showLoadingScreen('Initializing PDF Reader Pro...');
            
            // Bind UI elements
            this.bindUIElements();
            
            // Initialize modules
            await this.initializeModules();
            
            // Setup event handlers
            this.setupEventHandlers();
            
            // Apply saved settings
            this.applySavedSettings();
            
            // Setup file input
            this.setupFileHandling();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            console.log('PDF Reader Pro initialized successfully!');
            
            // Show welcome message
            this.showWelcomeState();
            
        } catch (error) {
            console.error('Failed to initialize PDF Reader Pro:', error);
            this.showError('Failed to initialize application: ' + error.message);
        }
    }

    /**
     * Bind UI elements
     */
    bindUIElements() {
        this.elements = {
            header: document.querySelector('.header'),
            sidebar: document.getElementById('sidebar'),
            workspace: document.querySelector('.workspace'),
            fileInput: document.getElementById('file-input'),
            noDocumentState: document.getElementById('no-document-state'),
            loadingScreen: document.getElementById('loading-screen'),
            fileList: document.getElementById('file-list'),
            toolPanel: document.getElementById('tool-panel')
        };

        // Create file input if it doesn't exist
        if (!this.elements.fileInput) {
            this.elements.fileInput = document.createElement('input');
            this.elements.fileInput.type = 'file';
            this.elements.fileInput.id = 'file-input';
            this.elements.fileInput.accept = '.pdf,image/*';
            this.elements.fileInput.multiple = true;
            this.elements.fileInput.style.display = 'none';
            document.body.appendChild(this.elements.fileInput);
        }
    }

    /**
     * Initialize all modules
     */
    async initializeModules() {
        // Initialize core modules
        this.modules.engine = new PDFEngine();
        this.modules.viewer = new PDFViewer();
        this.modules.editor = new PDFEditor();
        this.modules.converter = new PDFConverter();
        this.modules.signature = new PDFSignature();
        
        // Connect modules
        this.modules.viewer.setEngine(this.modules.engine);
        this.modules.editor.setEngine(this.modules.engine);
        this.modules.converter.setEngine(this.modules.engine);
        this.modules.signature.setEngine(this.modules.engine);
        
        // Setup module communication
        this.setupModuleCommunication();
    }

    /**
     * Setup communication between modules
     */
    setupModuleCommunication() {
        // Engine events
        this.modules.engine.on('pdfLoaded', (data) => {
            this.handlePDFLoaded(data);
        });

        this.modules.engine.on('pageRendered', (data) => {
            this.handlePageRendered(data);
        });

        this.modules.engine.on('error', (error) => {
            this.showError('PDF Engine Error: ' + error.message);
        });

        // Viewer events
        this.modules.viewer.on('pageChanged', (page) => {
            this.handlePageChanged(page);
        });

        this.modules.viewer.on('zoomChanged', (scale) => {
            this.handleZoomChanged(scale);
        });

        // Editor events
        this.modules.editor.on('editModeEnabled', () => {
            this.handleEditModeEnabled();
        });

        this.modules.editor.on('editModeDisabled', () => {
            this.handleEditModeDisabled();
        });

        // Signature events
        this.modules.signature.on('signatureCreated', (signature) => {
            this.handleSignatureCreated(signature);
        });

        this.modules.signature.on('signaturePlaced', (element) => {
            this.handleSignaturePlaced(element);
        });
    }

    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // Navigation events
        document.addEventListener('click', (e) => {
            if (e.target.matches('.nav-btn')) {
                const tool = e.target.dataset.tool;
                this.switchTool(tool);
            }
        });

        // Theme toggle
        document.addEventListener('click', (e) => {
            if (e.target.matches('.theme-toggle')) {
                this.toggleTheme();
            }
        });

        // File upload buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.file-upload-btn') || e.target.closest('.file-upload-btn')) {
                this.elements.fileInput.click();
            }
        });

        // Quick action buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.quick-action-btn')) {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            }
        });

        // Drag and drop
        this.setupDragAndDrop();

        // Keyboard shortcuts
        this.setupKeyboardShortcuts();

        // Window events
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            }
        });

        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });
    }

    /**
     * Setup drag and drop functionality
     */
    setupDragAndDrop() {
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        // Highlight drop zone
        ['dragenter', 'dragover'].forEach(eventName => {
            document.addEventListener(eventName, () => {
                document.body.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            document.addEventListener(eventName, () => {
                document.body.classList.remove('dragover');
            });
        });

        // Handle dropped files
        document.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files);
            this.handleFiles(files);
        });
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'o':
                        e.preventDefault();
                        this.elements.fileInput.click();
                        break;
                    case 's':
                        e.preventDefault();
                        this.saveDocument();
                        break;
                    case 'p':
                        e.preventDefault();
                        this.printDocument();
                        break;
                    case 'f':
                        e.preventDefault();
                        this.showSearchDialog();
                        break;
                    case '1':
                        e.preventDefault();
                        this.switchTool('viewer');
                        break;
                    case '2':
                        e.preventDefault();
                        this.switchTool('editor');
                        break;
                    case '3':
                        e.preventDefault();
                        this.switchTool('converter');
                        break;
                }
            }

            // Function keys
            switch (e.key) {
                case 'F11':
                    e.preventDefault();
                    this.toggleFullscreen();
                    break;
                case 'Escape':
                    this.handleEscapeKey();
                    break;
            }
        });
    }

    /**
     * Setup file handling
     */
    setupFileHandling() {
        if (this.elements.fileInput) {
            this.elements.fileInput.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                this.handleFiles(files);
                e.target.value = ''; // Reset input
            });
        }
    }

    /**
     * Handle file uploads
     */
    async handleFiles(files) {
        if (files.length === 0) return;

        try {
            this.showStatus('Processing files...', 'info');
            
            for (const file of files) {
                await this.processFile(file);
            }
            
        } catch (error) {
            console.error('Error handling files:', error);
            this.showError('Failed to process files: ' + error.message);
        }
    }

    /**
     * Process individual file
     */
    async processFile(file) {
        // Validate file
        if (!this.isValidFile(file)) {
            throw new Error(`Unsupported file type: ${file.type}`);
        }

        if (file.size > 100 * 1024 * 1024) { // 100MB limit
            throw new Error(`File too large: ${this.formatFileSize(file.size)}. Maximum size is 100MB.`);
        }

        // Process based on file type
        if (file.type === 'application/pdf') {
            await this.loadPDF(file);
        } else if (file.type.startsWith('image/')) {
            await this.convertImageToPDF(file);
        } else if (file.type === 'text/plain') {
            await this.convertTextToPDF(file);
        }
    }

    /**
     * Load PDF document
     */
    async loadPDF(file) {
        try {
            this.showStatus('Loading PDF...', 'info');
            
            // Load PDF using engine
            await this.modules.engine.loadPDF(file);
            
            // Update current document
            this.currentDocument = {
                name: file.name,
                type: 'pdf',
                file: file,
                modified: false,
                loadedAt: new Date()
            };
            
            // Switch to viewer if not already active
            if (this.currentTool !== 'viewer') {
                this.switchTool('viewer');
            }
            
            // Hide no document state
            this.hideNoDocumentState();
            
            // Add to file list
            this.addToFileList(this.currentDocument);
            
            this.showStatus('PDF loaded successfully', 'success');
            
        } catch (error) {
            console.error('Error loading PDF:', error);
            this.showError('Failed to load PDF: ' + error.message);
            throw error;
        }
    }

    /**
     * Convert image to PDF
     */
    async convertImageToPDF(file) {
        try {
            this.showStatus('Converting image to PDF...', 'info');
            
            const pdfBlob = await this.modules.converter.convertImageToPDF(file);
            const pdfFile = new File([pdfBlob], file.name.replace(/\.[^/.]+$/, '.pdf'), {
                type: 'application/pdf'
            });
            
            await this.loadPDF(pdfFile);
            
        } catch (error) {
            console.error('Error converting image:', error);
            this.showError('Failed to convert image: ' + error.message);
            throw error;
        }
    }

    /**
     * Switch between tools
     */
    switchTool(toolName) {
        if (toolName === this.currentTool) return;

        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tool="${toolName}"]`)?.classList.add('active');

        // Show/hide tool panels
        this.updateToolPanel(toolName);

        // Update workspace content
        this.updateWorkspace(toolName);

        // Handle tool-specific logic
        this.handleToolSwitch(toolName);

        this.currentTool = toolName;
    }

    /**
     * Update tool panel based on selected tool
     */
    updateToolPanel(toolName) {
        const toolPanel = this.elements.toolPanel;
        if (!toolPanel) return;

        let panelContent = '';

        switch (toolName) {
            case 'viewer':
                panelContent = this.createViewerPanel();
                break;
            case 'editor':
                panelContent = this.createEditorPanel();
                break;
            case 'converter':
                panelContent = this.createConverterPanel();
                break;
            case 'signature':
                panelContent = this.createSignaturePanel();
                break;
            case 'security':
                panelContent = this.createSecurityPanel();
                break;
            case 'tools':
                panelContent = this.createToolsPanel();
                break;
        }

        toolPanel.innerHTML = `
            <h3 class="sidebar-title">
                <i class="${this.getToolIcon(toolName)}"></i>
                ${this.getToolName(toolName)}
            </h3>
            <div class="tool-controls">
                ${panelContent}
            </div>
        `;
    }

    /**
     * Create viewer panel controls
     */
    createViewerPanel() {
        return `
            <div class="control-group">
                <label>View Options</label>
                <div class="button-group">
                    <button class="btn-icon" id="fit-width" title="Fit Width">
                        <i class="fas fa-arrows-alt-h"></i>
                    </button>
                    <button class="btn-icon" id="fit-page" title="Fit Page">
                        <i class="fas fa-expand-arrows-alt"></i>
                    </button>
                    <button class="btn-icon" id="actual-size" title="Actual Size">
                        <i class="fas fa-search"></i>
                    </button>
                </div>
            </div>
            
            <div class="control-group">
                <label>Reading Mode</label>
                <div class="toggle-group">
                    <button class="toggle-btn" id="dark-mode">
                        <i class="fas fa-moon"></i> Dark
                    </button>
                    <button class="toggle-btn" id="reading-mode">
                        <i class="fas fa-book"></i> Reading
                    </button>
                </div>
            </div>
            
            <div class="control-group">
                <label>Navigation</label>
                <div class="button-group">
                    <button class="btn-icon" id="thumbnails-toggle" title="Thumbnails">
                        <i class="fas fa-th-large"></i>
                    </button>
                    <button class="btn-icon" id="bookmarks-toggle" title="Bookmarks">
                        <i class="fas fa-bookmark"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Create editor panel controls
     */
    createEditorPanel() {
        return `
            <div class="control-group">
                <label>Edit Tools</label>
                <div class="tool-buttons">
                    <button class="tool-btn active" data-tool="text">
                        <i class="fas fa-font"></i> Text
                    </button>
                    <button class="tool-btn" data-tool="draw">
                        <i class="fas fa-pen"></i> Draw
                    </button>
                    <button class="tool-btn" data-tool="highlight">
                        <i class="fas fa-highlighter"></i> Highlight
                    </button>
                    <button class="tool-btn" data-tool="annotate">
                        <i class="fas fa-comment"></i> Annotate
                    </button>
                </div>
            </div>
            
            <div class="control-group">
                <label>Text Properties</label>
                <div class="property-controls">
                    <select id="text-font" class="form-select">
                        <option value="Arial">Arial</option>
                        <option value="Times">Times New Roman</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Courier">Courier New</option>
                    </select>
                    <input type="number" id="text-size" value="12" min="8" max="72" class="form-input">
                    <input type="color" id="text-color" value="#000000" class="color-input">
                </div>
            </div>
            
            <div class="control-group">
                <label>Actions</label>
                <div class="button-group">
                    <button class="btn-secondary" id="undo-edit">
                        <i class="fas fa-undo"></i> Undo
                    </button>
                    <button class="btn-secondary" id="redo-edit">
                        <i class="fas fa-redo"></i> Redo
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Handle PDF loaded event
     */
    handlePDFLoaded(data) {
        console.log('PDF loaded:', data);
        
        // Update document info
        if (this.currentDocument) {
            this.currentDocument.info = data.info;
            this.currentDocument.totalPages = data.totalPages;
        }
        
        // Update UI
        this.updateDocumentInfo(data.info);
        
        // Emit application event
        this.emit('documentLoaded', this.currentDocument);
    }

    /**
     * Update document information display
     */
    updateDocumentInfo(info) {
        // Update title
        document.title = `${info.title} - PDF Reader Pro`;
        
        // Update file list display
        this.updateFileListDisplay();
    }

    /**
     * Add document to file list
     */
    addToFileList(document) {
        const fileList = this.elements.fileList;
        if (!fileList) return;

        // Remove empty state
        const emptyState = fileList.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        // Create file item
        const fileItem = this.createFileListItem(document);
        fileList.appendChild(fileItem);
    }

    /**
     * Create file list item element
     */
    createFileListItem(document) {
        const item = document.createElement('div');
        item.className = 'file-item active';
        item.innerHTML = `
            <div class="file-icon">
                <i class="fas fa-file-pdf"></i>
            </div>
            <div class="file-info">
                <div class="file-name">${document.name}</div>
                <div class="file-details">${document.info?.pages || 0} pages</div>
            </div>
            <div class="file-actions">
                <button class="btn-icon btn-sm" title="Close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Add click handler
        item.addEventListener('click', () => {
            this.selectDocument(document);
        });
        
        return item;
    }

    /**
     * Toggle theme
     */
    toggleTheme() {
        const currentTheme = this.settings.theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        this.setTheme(newTheme);
    }

    /**
     * Set application theme
     */
    setTheme(theme) {
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${theme}`);
        
        this.settings.theme = theme;
        this.saveSettings();
        
        // Update theme toggle icon
        const themeToggle = document.querySelector('.theme-toggle i');
        if (themeToggle) {
            themeToggle.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    /**
     * Show/hide states
     */
    showWelcomeState() {
        if (this.elements.noDocumentState) {
            this.elements.noDocumentState.style.display = 'flex';
        }
    }

    hideNoDocumentState() {
        if (this.elements.noDocumentState) {
            this.elements.noDocumentState.style.display = 'none';
        }
    }

    showLoadingScreen(message = 'Loading...') {
        if (this.elements.loadingScreen) {
            this.elements.loadingScreen.style.display = 'flex';
            const statusText = this.elements.loadingScreen.querySelector('p');
            if (statusText) {
                statusText.textContent = message;
            }
        }
    }

    hideLoadingScreen() {
        if (this.elements.loadingScreen) {
            setTimeout(() => {
                this.elements.loadingScreen.classList.add('hidden');
                setTimeout(() => {
                    this.elements.loadingScreen.style.display = 'none';
                }, 350);
            }, 1000);
        }
    }

    /**
     * Status and error handling
     */
    showStatus(message, type = 'info', duration = 3000) {
        // Create or update status notification
        let notification = document.querySelector('.status-notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'status-notification';
            document.body.appendChild(notification);
        }
        
        notification.className = `status-notification show ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getStatusIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        // Auto-hide after duration
        if (duration > 0) {
            setTimeout(() => {
                notification.classList.remove('show');
            }, duration);
        }
    }

    showError(message, duration = 5000) {
        this.showStatus(message, 'error', duration);
        console.error('Application Error:', message);
    }

    getStatusIcon(type) {
        const icons = {
            info: 'info-circle',
            success: 'check-circle',
            warning: 'exclamation-triangle',
            error: 'exclamation-circle'
        };
        return icons[type] || 'info-circle';
    }

    /**
     * Utility functions
     */
    isValidFile(file) {
        return this.supportedFormats.includes(file.type);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getToolIcon(toolName) {
        const icons = {
            viewer: 'fas fa-eye',
            editor: 'fas fa-edit',
            converter: 'fas fa-exchange-alt',
            scanner: 'fas fa-scanner',
            signature: 'fas fa-signature',
            forms: 'fas fa-wpforms',
            security: 'fas fa-shield-alt',
            tools: 'fas fa-tools'
        };
        return icons[toolName] || 'fas fa-cog';
    }

    getToolName(toolName) {
        const names = {
            viewer: 'PDF Viewer',
            editor: 'PDF Editor',
            converter: 'PDF Converter',
            scanner: 'Document Scanner',
            signature: 'Digital Signature',
            forms: 'Form Filler',
            security: 'Document Security',
            tools: 'PDF Tools'
        };
        return names[toolName] || toolName;
    }

    /**
     * Settings management
     */
    saveSettings() {
        try {
            localStorage.setItem('pdfReaderProSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Failed to save settings:', error);
        }
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('pdfReaderProSettings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.warn('Failed to load settings:', error);
        }
    }

    applySavedSettings() {
        this.loadSettings();
        this.setTheme(this.settings.theme);
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
                console.error('Error in event listener:', error);
            }
        });
    }

    /**
     * Placeholder methods for incomplete features
     */
    handleToolSwitch(toolName) {
        // Tool-specific initialization
        console.log(`Switched to tool: ${toolName}`);
    }

    handleQuickAction(action) {
        console.log(`Quick action: ${action}`);
    }

    handleWindowResize() {
        // Handle responsive layout changes
    }

    handleEscapeKey() {
        // Handle escape key press
    }

    hasUnsavedChanges() {
        return this.currentDocument?.modified || false;
    }

    saveDocument() {
        console.log('Save document');
    }

    printDocument() {
        console.log('Print document');
    }

    showSearchDialog() {
        console.log('Show search dialog');
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    updateWorkspace(toolName) {
        // Update workspace content based on tool
    }

    createConverterPanel() {
        return '<div>Converter panel</div>';
    }

    createSignaturePanel() {
        return '<div>Signature panel</div>';
    }

    createSecurityPanel() {
        return '<div>Security panel</div>';
    }

    createToolsPanel() {
        return '<div>Tools panel</div>';
    }

    selectDocument(document) {
        console.log('Select document:', document);
    }

    updateFileListDisplay() {
        // Update file list display
    }

    handlePageChanged(page) {
        console.log('Page changed:', page);
    }

    handleZoomChanged(scale) {
        console.log('Zoom changed:', scale);
    }

    handleEditModeEnabled() {
        console.log('Edit mode enabled');
    }

    handleEditModeDisabled() {
        console.log('Edit mode disabled');
    }

    handleSignatureCreated(signature) {
        console.log('Signature created:', signature);
    }

    handleSignaturePlaced(element) {
        console.log('Signature placed:', element);
    }

    handlePageRendered(data) {
        console.log('Page rendered:', data);
    }

    convertTextToPDF(file) {
        console.log('Convert text to PDF:', file);
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.pdfReaderPro = new PDFReaderPro();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PDFReaderPro;
}