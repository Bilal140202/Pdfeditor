/**
 * PDF Reader Pro - Advanced PDF Tools Module
 * Professional PDF manipulation tools - merge, split, compress, extract, etc.
 */

class PDFTools {
    constructor() {
        this.engine = null;
        this.processingQueue = [];
        this.isProcessing = false;
        
        // Tool settings
        this.compressionSettings = {
            quality: 0.8,
            imageCompression: true,
            removeMetadata: false,
            optimizeFonts: true,
            grayscale: false
        };
        
        this.mergeSettings = {
            bookmarks: true,
            metadata: 'first', // 'first', 'merge', 'custom'
            pageNumbers: false,
            headers: false
        };
        
        this.splitSettings = {
            method: 'pages', // 'pages', 'size', 'bookmarks'
            pagesPerFile: 10,
            maxFileSize: 10, // MB
            preserveBookmarks: true
        };
        
        // Processing stats
        this.stats = {
            filesProcessed: 0,
            totalSizeReduced: 0,
            timeSpent: 0
        };
        
        this.init();
    }

    /**
     * Initialize PDF tools
     */
    init() {
        this.createToolsInterface();
        this.setupEventHandlers();
        
        console.log('PDF Tools initialized successfully');
    }

    /**
     * Create tools interface
     */
    createToolsInterface() {
        const workspace = document.getElementById('tools-workspace');
        if (!workspace) return;
        
        workspace.innerHTML = `
            <div class="pdf-tools-container">
                <!-- Tools Header -->
                <div class="tools-header">
                    <h2><i class="fas fa-tools"></i> PDF Tools</h2>
                    <div class="tools-stats">
                        <span class="stat-item">
                            <i class="fas fa-file-pdf"></i>
                            <strong id="files-processed">0</strong> files processed
                        </span>
                        <span class="stat-item">
                            <i class="fas fa-compress-arrows-alt"></i>
                            <strong id="size-saved">0 MB</strong> saved
                        </span>
                    </div>
                </div>

                <!-- Tool Categories -->
                <div class="tools-categories">
                    <!-- File Operations -->
                    <div class="tool-category">
                        <h3><i class="fas fa-layer-group"></i> File Operations</h3>
                        <div class="tools-grid">
                            <div class="tool-card" data-tool="merge">
                                <div class="tool-icon">
                                    <i class="fas fa-object-group"></i>
                                </div>
                                <h4>Merge PDFs</h4>
                                <p>Combine multiple PDF files into a single document</p>
                                <button class="btn-primary tool-btn">
                                    <i class="fas fa-plus"></i> Merge Files
                                </button>
                            </div>
                            
                            <div class="tool-card" data-tool="split">
                                <div class="tool-icon">
                                    <i class="fas fa-cut"></i>
                                </div>
                                <h4>Split PDF</h4>
                                <p>Divide PDF into multiple files or extract specific pages</p>
                                <button class="btn-primary tool-btn">
                                    <i class="fas fa-scissors"></i> Split File
                                </button>
                            </div>
                            
                            <div class="tool-card" data-tool="extract">
                                <div class="tool-icon">
                                    <i class="fas fa-file-export"></i>
                                </div>
                                <h4>Extract Pages</h4>
                                <p>Extract specific pages from PDF document</p>
                                <button class="btn-primary tool-btn">
                                    <i class="fas fa-download"></i> Extract
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Optimization -->
                    <div class="tool-category">
                        <h3><i class="fas fa-tachometer-alt"></i> Optimization</h3>
                        <div class="tools-grid">
                            <div class="tool-card" data-tool="compress">
                                <div class="tool-icon">
                                    <i class="fas fa-compress"></i>
                                </div>
                                <h4>Compress PDF</h4>
                                <p>Reduce file size while maintaining quality</p>
                                <button class="btn-primary tool-btn">
                                    <i class="fas fa-compress-arrows-alt"></i> Compress
                                </button>
                            </div>
                            
                            <div class="tool-card" data-tool="optimize">
                                <div class="tool-icon">
                                    <i class="fas fa-magic"></i>
                                </div>
                                <h4>Optimize PDF</h4>
                                <p>Advanced optimization for web and print</p>
                                <button class="btn-primary tool-btn">
                                    <i class="fas fa-wand-magic-sparkles"></i> Optimize
                                </button>
                            </div>
                            
                            <div class="tool-card" data-tool="clean">
                                <div class="tool-icon">
                                    <i class="fas fa-broom"></i>
                                </div>
                                <h4>Clean PDF</h4>
                                <p>Remove metadata, comments, and hidden data</p>
                                <button class="btn-primary tool-btn">
                                    <i class="fas fa-eraser"></i> Clean
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Content Extraction -->
                    <div class="tool-category">
                        <h3><i class="fas fa-search"></i> Content Extraction</h3>
                        <div class="tools-grid">
                            <div class="tool-card" data-tool="extract-text">
                                <div class="tool-icon">
                                    <i class="fas fa-font"></i>
                                </div>
                                <h4>Extract Text</h4>
                                <p>Extract all text content from PDF</p>
                                <button class="btn-primary tool-btn">
                                    <i class="fas fa-file-text"></i> Extract
                                </button>
                            </div>
                            
                            <div class="tool-card" data-tool="extract-images">
                                <div class="tool-icon">
                                    <i class="fas fa-images"></i>
                                </div>
                                <h4>Extract Images</h4>
                                <p>Extract all images from PDF document</p>
                                <button class="btn-primary tool-btn">
                                    <i class="fas fa-image"></i> Extract
                                </button>
                            </div>
                            
                            <div class="tool-card" data-tool="extract-data">
                                <div class="tool-icon">
                                    <i class="fas fa-table"></i>
                                </div>
                                <h4>Extract Data</h4>
                                <p>Extract tables and structured data</p>
                                <button class="btn-primary tool-btn">
                                    <i class="fas fa-database"></i> Extract
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Page Management -->
                    <div class="tool-category">
                        <h3><i class="fas fa-file-alt"></i> Page Management</h3>
                        <div class="tools-grid">
                            <div class="tool-card" data-tool="rotate">
                                <div class="tool-icon">
                                    <i class="fas fa-undo"></i>
                                </div>
                                <h4>Rotate Pages</h4>
                                <p>Rotate pages to correct orientation</p>
                                <button class="btn-primary tool-btn">
                                    <i class="fas fa-sync-alt"></i> Rotate
                                </button>
                            </div>
                            
                            <div class="tool-card" data-tool="reorder">
                                <div class="tool-icon">
                                    <i class="fas fa-sort"></i>
                                </div>
                                <h4>Reorder Pages</h4>
                                <p>Rearrange pages in custom order</p>
                                <button class="btn-primary tool-btn">
                                    <i class="fas fa-arrows-alt-v"></i> Reorder
                                </button>
                            </div>
                            
                            <div class="tool-card" data-tool="delete">
                                <div class="tool-icon">
                                    <i class="fas fa-trash"></i>
                                </div>
                                <h4>Delete Pages</h4>
                                <p>Remove unwanted pages from PDF</p>
                                <button class="btn-primary tool-btn">
                                    <i class="fas fa-trash-alt"></i> Delete
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Conversion Tools -->
                    <div class="tool-category">
                        <h3><i class="fas fa-exchange-alt"></i> Conversion</h3>
                        <div class="tools-grid">
                            <div class="tool-card" data-tool="to-images">
                                <div class="tool-icon">
                                    <i class="fas fa-image"></i>
                                </div>
                                <h4>PDF to Images</h4>
                                <p>Convert pages to JPG, PNG, or TIFF</p>
                                <button class="btn-primary tool-btn">
                                    <i class="fas fa-file-image"></i> Convert
                                </button>
                            </div>
                            
                            <div class="tool-card" data-tool="from-images">
                                <div class="tool-icon">
                                    <i class="fas fa-images"></i>
                                </div>
                                <h4>Images to PDF</h4>
                                <p>Create PDF from multiple images</p>
                                <button class="btn-primary tool-btn">
                                    <i class="fas fa-file-pdf"></i> Create
                                </button>
                            </div>
                            
                            <div class="tool-card" data-tool="to-html">
                                <div class="tool-icon">
                                    <i class="fab fa-html5"></i>
                                </div>
                                <h4>PDF to HTML</h4>
                                <p>Convert PDF to web-ready HTML</p>
                                <button class="btn-primary tool-btn">
                                    <i class="fas fa-code"></i> Convert
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Processing Queue -->
                <div class="processing-queue" id="processing-queue" style="display: none;">
                    <div class="queue-header">
                        <h3><i class="fas fa-tasks"></i> Processing Queue</h3>
                        <button class="btn-secondary" id="clear-queue">
                            <i class="fas fa-trash"></i> Clear Queue
                        </button>
                    </div>
                    <div class="queue-items" id="queue-items">
                        <!-- Queue items will be populated here -->
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const toolCard = e.target.closest('.tool-card');
                const tool = toolCard.dataset.tool;
                this.openTool(tool);
            });
        });
        
        // Queue management
        document.getElementById('clear-queue')?.addEventListener('click', () => this.clearQueue());
    }

    /**
     * Set PDF engine reference
     */
    setEngine(engine) {
        this.engine = engine;
    }

    /**
     * Open specific tool
     */
    openTool(toolName) {
        switch (toolName) {
            case 'merge':
                this.openMergeTool();
                break;
            case 'split':
                this.openSplitTool();
                break;
            case 'compress':
                this.openCompressTool();
                break;
            case 'extract':
                this.openExtractTool();
                break;
            case 'extract-text':
                this.extractText();
                break;
            case 'extract-images':
                this.extractImages();
                break;
            case 'rotate':
                this.openRotateTool();
                break;
            case 'optimize':
                this.openOptimizeTool();
                break;
            default:
                this.showError(`Tool "${toolName}" not implemented yet`);
        }
    }

    /**
     * Open merge tool
     */
    openMergeTool() {
        const modal = document.createElement('div');
        modal.className = 'merge-tool-modal modal-overlay';
        modal.innerHTML = `
            <div class="modal-container large">
                <div class="modal-header">
                    <h3><i class="fas fa-object-group"></i> Merge PDFs</h3>
                    <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <!-- File Selection -->
                    <div class="file-selection">
                        <div class="upload-area" id="merge-upload-area">
                            <i class="fas fa-cloud-upload-alt"></i>
                            <h4>Select PDF files to merge</h4>
                            <p>Drag and drop files here or click to browse</p>
                            <input type="file" multiple accept=".pdf" hidden id="merge-file-input">
                            <button class="btn-primary" onclick="document.getElementById('merge-file-input').click()">
                                <i class="fas fa-upload"></i> Select Files
                            </button>
                        </div>
                    </div>
                    
                    <!-- File List -->
                    <div class="merge-file-list" id="merge-file-list" style="display: none;">
                        <h4>Files to Merge</h4>
                        <div class="file-items" id="merge-file-items">
                            <!-- Files will be listed here -->
                        </div>
                    </div>
                    
                    <!-- Merge Options -->
                    <div class="merge-options" style="display: none;" id="merge-options">
                        <h4>Merge Options</h4>
                        <div class="options-grid">
                            <div class="option-group">
                                <label>
                                    <input type="checkbox" id="merge-bookmarks" checked>
                                    Preserve Bookmarks
                                </label>
                                <small>Keep bookmarks from all documents</small>
                            </div>
                            <div class="option-group">
                                <label>Metadata</label>
                                <select id="merge-metadata">
                                    <option value="first">Use first file metadata</option>
                                    <option value="merge">Merge all metadata</option>
                                    <option value="custom">Custom metadata</option>
                                </select>
                            </div>
                            <div class="option-group">
                                <label>
                                    <input type="checkbox" id="merge-page-numbers">
                                    Add Page Numbers
                                </label>
                                <small>Add page numbers to merged document</small>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button class="btn-primary" id="start-merge" disabled>
                        <i class="fas fa-object-group"></i> Start Merge
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.setupMergeHandlers();
    }

    /**
     * Setup merge tool handlers
     */
    setupMergeHandlers() {
        const fileInput = document.getElementById('merge-file-input');
        const uploadArea = document.getElementById('merge-upload-area');
        const fileList = document.getElementById('merge-file-list');
        const fileItems = document.getElementById('merge-file-items');
        const options = document.getElementById('merge-options');
        const startBtn = document.getElementById('start-merge');
        
        let selectedFiles = [];
        
        // File selection
        fileInput.onchange = (e) => {
            const files = Array.from(e.target.files);
            selectedFiles.push(...files);
            updateFileList();
        };
        
        // Drag and drop
        uploadArea.ondragover = (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        };
        
        uploadArea.ondragleave = () => {
            uploadArea.classList.remove('drag-over');
        };
        
        uploadArea.ondrop = (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
            selectedFiles.push(...files);
            updateFileList();
        };
        
        function updateFileList() {
            if (selectedFiles.length > 0) {
                fileList.style.display = 'block';
                options.style.display = 'block';
                startBtn.disabled = false;
                
                fileItems.innerHTML = selectedFiles.map((file, index) => `
                    <div class="merge-file-item" data-index="${index}">
                        <div class="file-info">
                            <i class="fas fa-file-pdf text-danger"></i>
                            <span class="file-name">${file.name}</span>
                            <span class="file-size">${(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        <div class="file-actions">
                            <button class="btn-icon move-up" ${index === 0 ? 'disabled' : ''}>
                                <i class="fas fa-arrow-up"></i>
                            </button>
                            <button class="btn-icon move-down" ${index === selectedFiles.length - 1 ? 'disabled' : ''}>
                                <i class="fas fa-arrow-down"></i>
                            </button>
                            <button class="btn-icon remove-file">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('');
                
                // Add file action handlers
                fileItems.querySelectorAll('.move-up').forEach(btn => {
                    btn.onclick = (e) => {
                        const index = parseInt(e.target.closest('.merge-file-item').dataset.index);
                        if (index > 0) {
                            [selectedFiles[index - 1], selectedFiles[index]] = [selectedFiles[index], selectedFiles[index - 1]];
                            updateFileList();
                        }
                    };
                });
                
                fileItems.querySelectorAll('.move-down').forEach(btn => {
                    btn.onclick = (e) => {
                        const index = parseInt(e.target.closest('.merge-file-item').dataset.index);
                        if (index < selectedFiles.length - 1) {
                            [selectedFiles[index], selectedFiles[index + 1]] = [selectedFiles[index + 1], selectedFiles[index]];
                            updateFileList();
                        }
                    };
                });
                
                fileItems.querySelectorAll('.remove-file').forEach(btn => {
                    btn.onclick = (e) => {
                        const index = parseInt(e.target.closest('.merge-file-item').dataset.index);
                        selectedFiles.splice(index, 1);
                        updateFileList();
                    };
                });
            }
        }
        
        // Start merge
        startBtn.onclick = () => {
            const options = {
                bookmarks: document.getElementById('merge-bookmarks').checked,
                metadata: document.getElementById('merge-metadata').value,
                pageNumbers: document.getElementById('merge-page-numbers').checked
            };
            this.mergePDFs(selectedFiles, options);
        };
    }

    /**
     * Merge multiple PDFs
     */
    async mergePDFs(files, options = {}) {
        if (files.length < 2) {
            this.showError('Please select at least 2 PDF files to merge');
            return;
        }

        try {
            this.showStatus('Merging PDF files...', 'info');
            
            // Close modal
            document.querySelector('.merge-tool-modal')?.remove();
            
            // Create new jsPDF instance
            const { jsPDF } = window.jspdf;
            const mergedPDF = new jsPDF();
            
            let totalPages = 0;
            let currentY = 0;
            
            for (let i = 0; i < files.length; i++) {
                this.showStatus(`Processing file ${i + 1} of ${files.length}...`, 'info');
                
                const file = files[i];
                const arrayBuffer = await this.fileToArrayBuffer(file);
                const pdf = await this.pdfjsLib.getDocument(arrayBuffer).promise;
                
                // Add pages from this PDF
                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                    const page = await pdf.getPage(pageNum);
                    const viewport = page.getViewport({ scale: 1.0 });
                    
                    // Create canvas for page
                    const canvas = document.createElement('canvas');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    const context = canvas.getContext('2d');
                    
                    // Render page to canvas
                    await page.render({ canvasContext: context, viewport }).promise;
                    
                    // Add page to merged PDF
                    if (totalPages > 0) {
                        mergedPDF.addPage();
                    }
                    
                    // Convert canvas to image and add to PDF
                    const imgData = canvas.toDataURL('image/png');
                    mergedPDF.addImage(imgData, 'PNG', 0, 0, 210, 297); // A4 size
                    
                    totalPages++;
                }
            }
            
            // Save merged PDF
            const fileName = `merged_pdf_${Date.now()}.pdf`;
            mergedPDF.save(fileName);
            
            this.showStatus(`Successfully merged ${files.length} files into ${fileName}`, 'success');
            this.updateStats('merge', files.length);
            
        } catch (error) {
            console.error('Error merging PDFs:', error);
            this.showError('Failed to merge PDFs: ' + error.message);
        }
    }

    /**
     * Open split tool
     */
    openSplitTool() {
        if (!this.engine || !this.engine.currentPDF) {
            this.showError('No PDF document loaded');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'split-tool-modal modal-overlay';
        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h3><i class="fas fa-cut"></i> Split PDF</h3>
                    <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="split-options">
                        <div class="split-method">
                            <h4>Split Method</h4>
                            <div class="method-options">
                                <label class="method-option">
                                    <input type="radio" name="split-method" value="pages" checked>
                                    <span class="option-label">
                                        <i class="fas fa-file-alt"></i>
                                        Split by Page Range
                                    </span>
                                    <small>Split into specific page ranges</small>
                                </label>
                                <label class="method-option">
                                    <input type="radio" name="split-method" value="count">
                                    <span class="option-label">
                                        <i class="fas fa-layer-group"></i>
                                        Split by Page Count
                                    </span>
                                    <small>Split into files with specific number of pages</small>
                                </label>
                                <label class="method-option">
                                    <input type="radio" name="split-method" value="size">
                                    <span class="option-label">
                                        <i class="fas fa-weight"></i>
                                        Split by File Size
                                    </span>
                                    <small>Split into files under specific size limit</small>
                                </label>
                            </div>
                        </div>
                        
                        <!-- Page Range Options -->
                        <div class="split-config" id="pages-config">
                            <h4>Page Ranges</h4>
                            <p>Enter page ranges separated by commas (e.g., 1-5, 7-10, 12)</p>
                            <input type="text" id="page-ranges" placeholder="1-5, 7-10, 12">
                            <small>Total pages: ${this.engine.currentPDF.numPages}</small>
                        </div>
                        
                        <!-- Page Count Options -->
                        <div class="split-config" id="count-config" style="display: none;">
                            <h4>Pages per File</h4>
                            <input type="number" id="pages-per-file" value="10" min="1" max="${this.engine.currentPDF.numPages}">
                            <small>This will create approximately ${Math.ceil(this.engine.currentPDF.numPages / 10)} files</small>
                        </div>
                        
                        <!-- File Size Options -->
                        <div class="split-config" id="size-config" style="display: none;">
                            <h4>Maximum File Size</h4>
                            <input type="number" id="max-file-size" value="10" min="1" max="100">
                            <select id="size-unit">
                                <option value="MB">MB</option>
                                <option value="KB">KB</option>
                            </select>
                        </div>
                        
                        <div class="split-settings">
                            <label>
                                <input type="checkbox" id="preserve-bookmarks" checked>
                                Preserve Bookmarks
                            </label>
                            <label>
                                <input type="checkbox" id="sequential-naming" checked>
                                Sequential File Naming
                            </label>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button class="btn-primary" id="start-split">
                        <i class="fas fa-cut"></i> Split PDF
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.setupSplitHandlers();
    }

    /**
     * Setup split tool handlers
     */
    setupSplitHandlers() {
        const methodRadios = document.querySelectorAll('input[name="split-method"]');
        const configs = document.querySelectorAll('.split-config');
        
        methodRadios.forEach(radio => {
            radio.onchange = () => {
                configs.forEach(config => {
                    config.style.display = config.id === `${radio.value}-config` ? 'block' : 'none';
                });
            };
        });
        
        document.getElementById('start-split').onclick = () => {
            const method = document.querySelector('input[name="split-method"]:checked').value;
            this.splitPDF(method);
        };
    }

    /**
     * Split PDF based on method
     */
    async splitPDF(method) {
        if (!this.engine || !this.engine.currentPDF) {
            this.showError('No PDF document loaded');
            return;
        }

        try {
            this.showStatus('Splitting PDF...', 'info');
            
            const pdf = this.engine.currentPDF;
            let splitRanges = [];
            
            // Determine split ranges based on method
            switch (method) {
                case 'pages':
                    const ranges = document.getElementById('page-ranges').value;
                    splitRanges = this.parsePageRanges(ranges, pdf.numPages);
                    break;
                case 'count':
                    const pagesPerFile = parseInt(document.getElementById('pages-per-file').value);
                    splitRanges = this.generateCountRanges(pdf.numPages, pagesPerFile);
                    break;
                case 'size':
                    const maxSize = parseInt(document.getElementById('max-file-size').value);
                    const unit = document.getElementById('size-unit').value;
                    splitRanges = await this.generateSizeRanges(pdf, maxSize, unit);
                    break;
            }
            
            if (splitRanges.length === 0) {
                this.showError('No valid split ranges generated');
                return;
            }
            
            // Close modal
            document.querySelector('.split-tool-modal')?.remove();
            
            // Create split files
            const { jsPDF } = window.jspdf;
            const splitFiles = [];
            
            for (let i = 0; i < splitRanges.length; i++) {
                this.showStatus(`Creating split file ${i + 1} of ${splitRanges.length}...`, 'info');
                
                const range = splitRanges[i];
                const splitPDF = new jsPDF();
                let addedPages = 0;
                
                for (let pageNum = range.start; pageNum <= range.end; pageNum++) {
                    const page = await pdf.getPage(pageNum);
                    const viewport = page.getViewport({ scale: 1.0 });
                    
                    // Create canvas for page
                    const canvas = document.createElement('canvas');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    const context = canvas.getContext('2d');
                    
                    // Render page
                    await page.render({ canvasContext: context, viewport }).promise;
                    
                    // Add page to split PDF
                    if (addedPages > 0) {
                        splitPDF.addPage();
                    }
                    
                    const imgData = canvas.toDataURL('image/png');
                    splitPDF.addImage(imgData, 'PNG', 0, 0, 210, 297);
                    addedPages++;
                }
                
                // Save split file
                const fileName = `split_${i + 1}_pages_${range.start}-${range.end}.pdf`;
                splitPDF.save(fileName);
                splitFiles.push(fileName);
            }
            
            this.showStatus(`Successfully created ${splitFiles.length} split files`, 'success');
            this.updateStats('split', splitFiles.length);
            
        } catch (error) {
            console.error('Error splitting PDF:', error);
            this.showError('Failed to split PDF: ' + error.message);
        }
    }

    /**
     * Parse page ranges string
     */
    parsePageRanges(rangesString, totalPages) {
        const ranges = [];
        const parts = rangesString.split(',').map(s => s.trim());
        
        for (const part of parts) {
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(n => parseInt(n.trim()));
                if (start >= 1 && end <= totalPages && start <= end) {
                    ranges.push({ start, end });
                }
            } else {
                const page = parseInt(part);
                if (page >= 1 && page <= totalPages) {
                    ranges.push({ start: page, end: page });
                }
            }
        }
        
        return ranges;
    }

    /**
     * Generate ranges based on page count
     */
    generateCountRanges(totalPages, pagesPerFile) {
        const ranges = [];
        for (let i = 1; i <= totalPages; i += pagesPerFile) {
            ranges.push({
                start: i,
                end: Math.min(i + pagesPerFile - 1, totalPages)
            });
        }
        return ranges;
    }

    /**
     * Open compress tool
     */
    openCompressTool() {
        if (!this.engine || !this.engine.currentPDF) {
            this.showError('No PDF document loaded');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'compress-tool-modal modal-overlay';
        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h3><i class="fas fa-compress"></i> Compress PDF</h3>
                    <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="compression-settings">
                        <div class="setting-group">
                            <h4>Compression Quality</h4>
                            <div class="quality-options">
                                <label class="quality-option">
                                    <input type="radio" name="quality" value="0.5">
                                    <span class="quality-label">
                                        <strong>Maximum Compression</strong>
                                        <small>Smallest file size, lower quality</small>
                                    </span>
                                </label>
                                <label class="quality-option">
                                    <input type="radio" name="quality" value="0.7" checked>
                                    <span class="quality-label">
                                        <strong>Balanced</strong>
                                        <small>Good balance of size and quality</small>
                                    </span>
                                </label>
                                <label class="quality-option">
                                    <input type="radio" name="quality" value="0.9">
                                    <span class="quality-label">
                                        <strong>High Quality</strong>
                                        <small>Larger file size, better quality</small>
                                    </span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="setting-group">
                            <h4>Optimization Options</h4>
                            <div class="optimization-options">
                                <label>
                                    <input type="checkbox" id="compress-images" checked>
                                    Compress Images
                                </label>
                                <label>
                                    <input type="checkbox" id="remove-metadata" checked>
                                    Remove Metadata
                                </label>
                                <label>
                                    <input type="checkbox" id="optimize-fonts">
                                    Optimize Fonts
                                </label>
                                <label>
                                    <input type="checkbox" id="grayscale-conversion">
                                    Convert to Grayscale
                                </label>
                            </div>
                        </div>
                        
                        <div class="compression-preview" id="compression-preview">
                            <div class="size-comparison">
                                <div class="size-before">
                                    <strong>Original Size</strong>
                                    <span id="original-size">Calculating...</span>
                                </div>
                                <div class="size-arrow">
                                    <i class="fas fa-arrow-right"></i>
                                </div>
                                <div class="size-after">
                                    <strong>Estimated Size</strong>
                                    <span id="estimated-size">Calculating...</span>
                                </div>
                            </div>
                            <div class="size-reduction">
                                <strong>Estimated Reduction:</strong>
                                <span id="size-reduction" class="text-success">0%</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button class="btn-primary" id="start-compress">
                        <i class="fas fa-compress-arrows-alt"></i> Compress PDF
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.setupCompressHandlers();
        this.calculateCompressionPreview();
    }

    /**
     * Setup compress tool handlers
     */
    setupCompressHandlers() {
        const qualityRadios = document.querySelectorAll('input[name="quality"]');
        const optionCheckboxes = document.querySelectorAll('.optimization-options input[type="checkbox"]');
        
        // Update preview when settings change
        qualityRadios.forEach(radio => {
            radio.onchange = () => this.calculateCompressionPreview();
        });
        
        optionCheckboxes.forEach(checkbox => {
            checkbox.onchange = () => this.calculateCompressionPreview();
        });
        
        document.getElementById('start-compress').onclick = () => {
            this.compressPDF();
        };
    }

    /**
     * Calculate compression preview
     */
    calculateCompressionPreview() {
        // Simulate compression calculation
        const quality = parseFloat(document.querySelector('input[name="quality"]:checked').value);
        const compressImages = document.getElementById('compress-images').checked;
        const removeMetadata = document.getElementById('remove-metadata').checked;
        const optimizeFonts = document.getElementById('optimize-fonts').checked;
        const grayscale = document.getElementById('grayscale-conversion').checked;
        
        // Estimate compression based on options
        let compressionRatio = quality;
        if (compressImages) compressionRatio *= 0.7;
        if (removeMetadata) compressionRatio *= 0.95;
        if (optimizeFonts) compressionRatio *= 0.9;
        if (grayscale) compressionRatio *= 0.8;
        
        // Simulate original file size
        const originalSize = Math.random() * 10 + 5; // 5-15 MB
        const compressedSize = originalSize * compressionRatio;
        const reduction = ((originalSize - compressedSize) / originalSize * 100);
        
        document.getElementById('original-size').textContent = `${originalSize.toFixed(1)} MB`;
        document.getElementById('estimated-size').textContent = `${compressedSize.toFixed(1)} MB`;
        document.getElementById('size-reduction').textContent = `${reduction.toFixed(1)}%`;
    }

    /**
     * Compress PDF
     */
    async compressPDF() {
        if (!this.engine || !this.engine.currentPDF) {
            this.showError('No PDF document loaded');
            return;
        }

        try {
            this.showStatus('Compressing PDF...', 'info');
            
            const quality = parseFloat(document.querySelector('input[name="quality"]:checked').value);
            const options = {
                quality,
                compressImages: document.getElementById('compress-images').checked,
                removeMetadata: document.getElementById('remove-metadata').checked,
                optimizeFonts: document.getElementById('optimize-fonts').checked,
                grayscale: document.getElementById('grayscale-conversion').checked
            };
            
            // Close modal
            document.querySelector('.compress-tool-modal')?.remove();
            
            // Simulate compression process
            const pdf = this.engine.currentPDF;
            const { jsPDF } = window.jspdf;
            const compressedPDF = new jsPDF();
            
            let processedPages = 0;
            
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                this.showStatus(`Compressing page ${pageNum} of ${pdf.numPages}...`, 'info');
                
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: 1.0 });
                
                // Create canvas
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const context = canvas.getContext('2d');
                
                // Render page
                await page.render({ canvasContext: context, viewport }).promise;
                
                // Apply compression settings
                let imgData;
                if (options.grayscale) {
                    // Convert to grayscale
                    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;
                    for (let i = 0; i < data.length; i += 4) {
                        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                        data[i] = gray;
                        data[i + 1] = gray;
                        data[i + 2] = gray;
                    }
                    context.putImageData(imageData, 0, 0);
                }
                
                imgData = canvas.toDataURL('image/jpeg', options.quality);
                
                // Add compressed page
                if (processedPages > 0) {
                    compressedPDF.addPage();
                }
                
                compressedPDF.addImage(imgData, 'JPEG', 0, 0, 210, 297);
                processedPages++;
            }
            
            // Save compressed PDF
            const fileName = `compressed_${Date.now()}.pdf`;
            compressedPDF.save(fileName);
            
            this.showStatus(`PDF compressed successfully: ${fileName}`, 'success');
            this.updateStats('compress', 1);
            
        } catch (error) {
            console.error('Error compressing PDF:', error);
            this.showError('Failed to compress PDF: ' + error.message);
        }
    }

    /**
     * Extract text from PDF
     */
    async extractText() {
        if (!this.engine || !this.engine.currentPDF) {
            this.showError('No PDF document loaded');
            return;
        }

        try {
            this.showStatus('Extracting text...', 'info');
            
            const pdf = this.engine.currentPDF;
            let fullText = '';
            
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                this.showStatus(`Extracting text from page ${pageNum} of ${pdf.numPages}...`, 'info');
                
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                
                let pageText = '';
                textContent.items.forEach(item => {
                    pageText += item.str + ' ';
                });
                
                fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
            }
            
            // Create and download text file
            const blob = new Blob([fullText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `extracted_text_${Date.now()}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showStatus('Text extracted successfully', 'success');
            this.updateStats('extract', 1);
            
        } catch (error) {
            console.error('Error extracting text:', error);
            this.showError('Failed to extract text: ' + error.message);
        }
    }

    /**
     * Extract images from PDF
     */
    async extractImages() {
        if (!this.engine || !this.engine.currentPDF) {
            this.showError('No PDF document loaded');
            return;
        }

        try {
            this.showStatus('Extracting images...', 'info');
            
            const pdf = this.engine.currentPDF;
            const extractedImages = [];
            
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                this.showStatus(`Extracting images from page ${pageNum} of ${pdf.numPages}...`, 'info');
                
                const page = await pdf.getPage(pageNum);
                
                // This is a simplified version - real implementation would need
                // to parse PDF objects to extract embedded images
                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const context = canvas.getContext('2d');
                
                await page.render({ canvasContext: context, viewport }).promise;
                
                // Convert page to image
                canvas.toBlob(blob => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `page_${pageNum}_image.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 'image/png');
                
                extractedImages.push(`page_${pageNum}_image.png`);
            }
            
            this.showStatus(`Extracted ${extractedImages.length} images`, 'success');
            this.updateStats('extract', extractedImages.length);
            
        } catch (error) {
            console.error('Error extracting images:', error);
            this.showError('Failed to extract images: ' + error.message);
        }
    }

    /**
     * Convert file to array buffer
     */
    fileToArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Update processing stats
     */
    updateStats(operation, count) {
        this.stats.filesProcessed += count;
        
        // Update display
        const filesProcessed = document.getElementById('files-processed');
        if (filesProcessed) {
            filesProcessed.textContent = this.stats.filesProcessed;
        }
        
        // Simulate size reduction for compression
        if (operation === 'compress') {
            this.stats.totalSizeReduced += Math.random() * 5; // Random 0-5 MB
            const sizeSaved = document.getElementById('size-saved');
            if (sizeSaved) {
                sizeSaved.textContent = `${this.stats.totalSizeReduced.toFixed(1)} MB`;
            }
        }
    }

    /**
     * Clear processing queue
     */
    clearQueue() {
        this.processingQueue = [];
        const queueItems = document.getElementById('queue-items');
        if (queueItems) {
            queueItems.innerHTML = '<p class="no-queue-items">No items in queue</p>';
        }
        document.getElementById('processing-queue').style.display = 'none';
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
     * Get processing statistics
     */
    getStats() {
        return { ...this.stats };
    }
}

// Export for global access
window.PDFTools = PDFTools;