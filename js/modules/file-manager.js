/**
 * PDF Reader Pro - File Management System
 * Advanced file organization with cloud sync and version control
 */

class FileManager {
    constructor() {
        this.files = new Map();
        this.folders = new Map();
        this.currentFolder = 'root';
        this.searchIndex = new Map();
        
        // Cloud storage simulation
        this.cloudStorage = {
            enabled: false,
            provider: 'local', // local, googledrive, onedrive, dropbox
            syncStatus: 'idle', // idle, syncing, error
            lastSync: null
        };
        
        // File categories
        this.categories = {
            recent: [],
            starred: [],
            shared: [],
            trash: []
        };
        
        // Storage management
        this.storageQuota = 1024 * 1024 * 1024; // 1GB default
        this.usedStorage = 0;
        
        // File operations history
        this.operationHistory = [];
        
        this.init();
    }

    /**
     * Initialize file manager
     */
    init() {
        this.createFileManagerInterface();
        this.setupEventHandlers();
        this.loadStoredFiles();
        this.updateStorageInfo();
        
        console.log('File Manager initialized successfully');
    }

    /**
     * Create file manager interface
     */
    createFileManagerInterface() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;
        
        // Create file manager section
        const fileManagerHTML = `
            <div class="file-manager-section">
                <div class="file-manager-header">
                    <h3><i class="fas fa-folder"></i> Files</h3>
                    <div class="file-actions">
                        <button class="btn-icon" id="new-folder" title="New Folder">
                            <i class="fas fa-folder-plus"></i>
                        </button>
                        <button class="btn-icon" id="upload-files" title="Upload Files">
                            <i class="fas fa-upload"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Search -->
                <div class="file-search">
                    <div class="search-input">
                        <i class="fas fa-search"></i>
                        <input type="text" id="file-search-input" placeholder="Search files...">
                        <button class="clear-search" id="clear-search" style="display: none;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Quick Access -->
                <div class="quick-access">
                    <div class="quick-item active" data-category="all">
                        <i class="fas fa-file"></i>
                        <span>All Files</span>
                        <span class="count" id="all-files-count">0</span>
                    </div>
                    <div class="quick-item" data-category="recent">
                        <i class="fas fa-history"></i>
                        <span>Recent</span>
                        <span class="count" id="recent-files-count">0</span>
                    </div>
                    <div class="quick-item" data-category="starred">
                        <i class="fas fa-star"></i>
                        <span>Starred</span>
                        <span class="count" id="starred-files-count">0</span>
                    </div>
                    <div class="quick-item" data-category="shared">
                        <i class="fas fa-users"></i>
                        <span>Shared</span>
                        <span class="count" id="shared-files-count">0</span>
                    </div>
                    <div class="quick-item" data-category="trash">
                        <i class="fas fa-trash"></i>
                        <span>Trash</span>
                        <span class="count" id="trash-files-count">0</span>
                    </div>
                </div>
                
                <!-- Folder Tree -->
                <div class="folder-tree">
                    <div class="folder-tree-header">
                        <h4>Folders</h4>
                        <div class="tree-controls">
                            <button class="btn-icon btn-sm" id="expand-all" title="Expand All">
                                <i class="fas fa-expand-arrows-alt"></i>
                            </button>
                            <button class="btn-icon btn-sm" id="collapse-all" title="Collapse All">
                                <i class="fas fa-compress-arrows-alt"></i>
                            </button>
                        </div>
                    </div>
                    <div class="tree-container" id="folder-tree-container">
                        <!-- Folder tree will be rendered here -->
                    </div>
                </div>
                
                <!-- Storage Info -->
                <div class="storage-info">
                    <div class="storage-header">
                        <h4>Storage</h4>
                        <span class="storage-usage" id="storage-usage">0 MB / 1 GB</span>
                    </div>
                    <div class="storage-bar">
                        <div class="storage-used" id="storage-used-bar" style="width: 0%;"></div>
                    </div>
                    <div class="storage-details">
                        <div class="storage-item">
                            <i class="fas fa-file-pdf"></i>
                            <span>PDFs</span>
                            <span class="storage-size" id="pdf-storage">0 MB</span>
                        </div>
                        <div class="storage-item">
                            <i class="fas fa-image"></i>
                            <span>Images</span>
                            <span class="storage-size" id="image-storage">0 MB</span>
                        </div>
                        <div class="storage-item">
                            <i class="fas fa-file"></i>
                            <span>Other</span>
                            <span class="storage-size" id="other-storage">0 MB</span>
                        </div>
                    </div>
                </div>
                
                <!-- Cloud Sync Status -->
                <div class="cloud-sync" id="cloud-sync-section">
                    <div class="sync-header">
                        <h4>Cloud Sync</h4>
                        <div class="sync-status" id="sync-status">
                            <i class="fas fa-cloud"></i>
                            <span>Local Storage</span>
                        </div>
                    </div>
                    <button class="btn-secondary btn-sm" id="enable-cloud-sync">
                        <i class="fas fa-cloud-upload-alt"></i>
                        Enable Cloud Sync
                    </button>
                </div>
            </div>
        `;
        
        // Add to sidebar
        sidebar.insertAdjacentHTML('beforeend', fileManagerHTML);
    }

    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // File operations
        document.getElementById('new-folder')?.addEventListener('click', () => this.createNewFolder());
        document.getElementById('upload-files')?.addEventListener('click', () => this.uploadFiles());
        
        // Search
        const searchInput = document.getElementById('file-search-input');
        searchInput?.addEventListener('input', (e) => this.searchFiles(e.target.value));
        document.getElementById('clear-search')?.addEventListener('click', () => this.clearSearch());
        
        // Quick access
        document.querySelectorAll('.quick-item').forEach(item => {
            item.addEventListener('click', () => this.selectCategory(item.dataset.category));
        });
        
        // Tree controls
        document.getElementById('expand-all')?.addEventListener('click', () => this.expandAllFolders());
        document.getElementById('collapse-all')?.addEventListener('click', () => this.collapseAllFolders());
        
        // Cloud sync
        document.getElementById('enable-cloud-sync')?.addEventListener('click', () => this.showCloudSyncOptions());
        
        // File drag and drop
        this.setupDragAndDrop();
    }

    /**
     * Setup drag and drop functionality
     */
    setupDragAndDrop() {
        const workspace = document.querySelector('.workspace');
        if (!workspace) return;
        
        workspace.addEventListener('dragover', (e) => {
            e.preventDefault();
            workspace.classList.add('drag-over');
        });
        
        workspace.addEventListener('dragleave', (e) => {
            if (!workspace.contains(e.relatedTarget)) {
                workspace.classList.remove('drag-over');
            }
        });
        
        workspace.addEventListener('drop', (e) => {
            e.preventDefault();
            workspace.classList.remove('drag-over');
            
            const files = Array.from(e.dataTransfer.files);
            this.handleDroppedFiles(files);
        });
    }

    /**
     * Handle dropped files
     */
    async handleDroppedFiles(files) {
        if (files.length === 0) return;
        
        try {
            this.showStatus('Processing dropped files...', 'info');
            
            for (const file of files) {
                await this.addFile(file);
            }
            
            this.showStatus(`${files.length} file(s) added successfully`, 'success');
            this.updateFileList();
            
        } catch (error) {
            console.error('Error handling dropped files:', error);
            this.showStatus('Error processing dropped files: ' + error.message, 'error');
        }
    }

    /**
     * Add file to manager
     */
    async addFile(file, folder = this.currentFolder) {
        try {
            // Generate unique file ID
            const fileId = this.generateFileId();
            
            // Read file data
            const fileData = await this.readFileData(file);
            
            // Create file object
            const fileObj = {
                id: fileId,
                name: file.name,
                type: file.type,
                size: file.size,
                folder: folder,
                data: fileData,
                thumbnail: null,
                metadata: {
                    created: new Date(),
                    modified: new Date(file.lastModified),
                    accessed: new Date(),
                    version: 1
                },
                tags: [],
                starred: false,
                shared: false,
                permissions: {
                    read: true,
                    write: true,
                    delete: true
                }
            };
            
            // Generate thumbnail for images and PDFs
            if (file.type.startsWith('image/') || file.type === 'application/pdf') {
                fileObj.thumbnail = await this.generateThumbnail(file);
            }
            
            // Add to files map
            this.files.set(fileId, fileObj);
            
            // Add to recent files
            this.categories.recent.unshift(fileId);
            if (this.categories.recent.length > 20) {
                this.categories.recent = this.categories.recent.slice(0, 20);
            }
            
            // Update search index
            this.updateSearchIndex(fileObj);
            
            // Update storage usage
            this.usedStorage += file.size;
            this.updateStorageInfo();
            
            // Save to local storage
            this.saveToStorage();
            
            // Add to operation history
            this.addToHistory('add', fileObj);
            
            return fileObj;
            
        } catch (error) {
            console.error('Error adding file:', error);
            throw error;
        }
    }

    /**
     * Read file data
     */
    readFileData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            
            if (file.type.startsWith('text/')) {
                reader.readAsText(file);
            } else {
                reader.readAsArrayBuffer(file);
            }
        });
    }

    /**
     * Generate thumbnail for file
     */
    async generateThumbnail(file) {
        try {
            if (file.type.startsWith('image/')) {
                return await this.generateImageThumbnail(file);
            } else if (file.type === 'application/pdf') {
                return await this.generatePDFThumbnail(file);
            }
            return null;
        } catch (error) {
            console.error('Error generating thumbnail:', error);
            return null;
        }
    }

    /**
     * Generate image thumbnail
     */
    generateImageThumbnail(file) {
        return new Promise((resolve) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            img.onload = () => {
                // Set thumbnail size
                const maxSize = 150;
                let { width, height } = img;
                
                if (width > height) {
                    if (width > maxSize) {
                        height = (height * maxSize) / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width = (width * maxSize) / height;
                        height = maxSize;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            
            img.onerror = () => resolve(null);
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Generate PDF thumbnail
     */
    async generatePDFThumbnail(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const page = await pdf.getPage(1);
            
            const viewport = page.getViewport({ scale: 0.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            await page.render({ canvasContext: context, viewport }).promise;
            
            return canvas.toDataURL('image/jpeg', 0.7);
            
        } catch (error) {
            console.error('Error generating PDF thumbnail:', error);
            return null;
        }
    }

    /**
     * Create new folder
     */
    createNewFolder(parentFolder = this.currentFolder) {
        const folderName = prompt('Enter folder name:');
        if (!folderName || folderName.trim() === '') return;
        
        const folderId = this.generateFileId();
        const folderObj = {
            id: folderId,
            name: folderName.trim(),
            parent: parentFolder,
            children: [],
            metadata: {
                created: new Date(),
                modified: new Date()
            }
        };
        
        this.folders.set(folderId, folderObj);
        
        // Add to parent folder if not root
        if (parentFolder !== 'root' && this.folders.has(parentFolder)) {
            this.folders.get(parentFolder).children.push(folderId);
        }
        
        this.updateFolderTree();
        this.saveToStorage();
        
        this.showStatus(`Folder "${folderName}" created successfully`, 'success');
    }

    /**
     * Delete file or folder
     */
    deleteItem(itemId, itemType = 'file') {
        if (!confirm(`Are you sure you want to delete this ${itemType}?`)) return;
        
        if (itemType === 'file') {
            const file = this.files.get(itemId);
            if (file) {
                // Move to trash instead of permanent delete
                this.categories.trash.push(itemId);
                this.files.get(itemId).deleted = true;
                
                // Remove from other categories
                this.categories.recent = this.categories.recent.filter(id => id !== itemId);
                this.categories.starred = this.categories.starred.filter(id => id !== itemId);
                
                // Update storage
                this.usedStorage -= file.size;
                this.updateStorageInfo();
                
                this.showStatus(`File moved to trash`, 'info');
            }
        } else if (itemType === 'folder') {
            const folder = this.folders.get(itemId);
            if (folder) {
                // Move all files in folder to trash
                this.moveFileInFolderToTrash(itemId);
                
                // Remove folder
                this.folders.delete(itemId);
                
                this.showStatus(`Folder deleted`, 'info');
            }
        }
        
        this.updateFileList();
        this.updateFolderTree();
        this.saveToStorage();
    }

    /**
     * Search files
     */
    searchFiles(query) {
        const searchInput = document.getElementById('file-search-input');
        const clearBtn = document.getElementById('clear-search');
        
        if (query.trim() === '') {
            clearBtn.style.display = 'none';
            this.showAllFiles();
            return;
        }
        
        clearBtn.style.display = 'block';
        
        const results = [];
        const lowerQuery = query.toLowerCase();
        
        // Search in file names, tags, and content
        this.files.forEach((file, id) => {
            if (file.deleted) return;
            
            const searchText = `${file.name} ${file.tags.join(' ')}`.toLowerCase();
            if (searchText.includes(lowerQuery)) {
                results.push({ id, relevance: this.calculateRelevance(file, lowerQuery) });
            }
        });
        
        // Sort by relevance
        results.sort((a, b) => b.relevance - a.relevance);
        
        this.showSearchResults(results.map(r => r.id), query);
    }

    /**
     * Calculate search relevance
     */
    calculateRelevance(file, query) {
        let relevance = 0;
        
        // Name match
        if (file.name.toLowerCase().includes(query)) {
            relevance += file.name.toLowerCase().indexOf(query) === 0 ? 10 : 5;
        }
        
        // Tag match
        file.tags.forEach(tag => {
            if (tag.toLowerCase().includes(query)) {
                relevance += 3;
            }
        });
        
        // File type relevance
        if (query === 'pdf' && file.type === 'application/pdf') relevance += 5;
        if (query === 'image' && file.type.startsWith('image/')) relevance += 5;
        
        return relevance;
    }

    /**
     * Update search index
     */
    updateSearchIndex(file) {
        const words = file.name.toLowerCase().split(/\s+/);
        words.forEach(word => {
            if (!this.searchIndex.has(word)) {
                this.searchIndex.set(word, new Set());
            }
            this.searchIndex.get(word).add(file.id);
        });
    }

    /**
     * Update file list display
     */
    updateFileList() {
        // This would update the main workspace file list
        // Implementation depends on the current view
        this.updateFileCounts();
    }

    /**
     * Update file counts
     */
    updateFileCounts() {
        const allCount = Array.from(this.files.values()).filter(f => !f.deleted).length;
        const recentCount = this.categories.recent.filter(id => this.files.has(id) && !this.files.get(id).deleted).length;
        const starredCount = this.categories.starred.filter(id => this.files.has(id) && !this.files.get(id).deleted).length;
        const sharedCount = this.categories.shared.filter(id => this.files.has(id) && !this.files.get(id).deleted).length;
        const trashCount = this.categories.trash.length;
        
        document.getElementById('all-files-count').textContent = allCount;
        document.getElementById('recent-files-count').textContent = recentCount;
        document.getElementById('starred-files-count').textContent = starredCount;
        document.getElementById('shared-files-count').textContent = sharedCount;
        document.getElementById('trash-files-count').textContent = trashCount;
    }

    /**
     * Update folder tree
     */
    updateFolderTree() {
        const container = document.getElementById('folder-tree-container');
        if (!container) return;
        
        const treeHTML = this.buildFolderTreeHTML('root', 0);
        container.innerHTML = treeHTML;
    }

    /**
     * Build folder tree HTML
     */
    buildFolderTreeHTML(parentId, level) {
        let html = '';
        
        // Get folders with this parent
        const childFolders = Array.from(this.folders.values()).filter(f => f.parent === parentId);
        
        childFolders.forEach(folder => {
            const indent = '  '.repeat(level);
            const hasChildren = Array.from(this.folders.values()).some(f => f.parent === folder.id);
            
            html += `
                <div class="tree-item" style="padding-left: ${level * 20}px;" data-folder-id="${folder.id}">
                    <div class="tree-item-content">
                        ${hasChildren ? '<i class="fas fa-chevron-right tree-toggle"></i>' : '<span class="tree-spacer"></span>'}
                        <i class="fas fa-folder"></i>
                        <span class="folder-name">${folder.name}</span>
                        <div class="folder-actions">
                            <button class="btn-icon btn-xs" onclick="fileManager.deleteItem('${folder.id}', 'folder')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    ${hasChildren ? '<div class="tree-children">' + this.buildFolderTreeHTML(folder.id, level + 1) + '</div>' : ''}
                </div>
            `;
        });
        
        return html;
    }

    /**
     * Update storage info
     */
    updateStorageInfo() {
        const usedMB = Math.round(this.usedStorage / (1024 * 1024));
        const totalGB = Math.round(this.storageQuota / (1024 * 1024 * 1024));
        const usedPercent = (this.usedStorage / this.storageQuota) * 100;
        
        document.getElementById('storage-usage').textContent = `${usedMB} MB / ${totalGB} GB`;
        document.getElementById('storage-used-bar').style.width = `${Math.min(usedPercent, 100)}%`;
        
        // Calculate storage by type
        let pdfSize = 0, imageSize = 0, otherSize = 0;
        
        this.files.forEach(file => {
            if (file.deleted) return;
            
            if (file.type === 'application/pdf') {
                pdfSize += file.size;
            } else if (file.type.startsWith('image/')) {
                imageSize += file.size;
            } else {
                otherSize += file.size;
            }
        });
        
        document.getElementById('pdf-storage').textContent = `${Math.round(pdfSize / (1024 * 1024))} MB`;
        document.getElementById('image-storage').textContent = `${Math.round(imageSize / (1024 * 1024))} MB`;
        document.getElementById('other-storage').textContent = `${Math.round(otherSize / (1024 * 1024))} MB`;
    }

    /**
     * Save to local storage
     */
    saveToStorage() {
        try {
            const data = {
                files: Array.from(this.files.entries()),
                folders: Array.from(this.folders.entries()),
                categories: this.categories,
                settings: {
                    currentFolder: this.currentFolder,
                    usedStorage: this.usedStorage
                }
            };
            
            localStorage.setItem('pdf-reader-pro-files', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving to storage:', error);
        }
    }

    /**
     * Load from storage
     */
    loadStoredFiles() {
        try {
            const stored = localStorage.getItem('pdf-reader-pro-files');
            if (!stored) return;
            
            const data = JSON.parse(stored);
            
            this.files = new Map(data.files || []);
            this.folders = new Map(data.folders || []);
            this.categories = data.categories || this.categories;
            
            if (data.settings) {
                this.currentFolder = data.settings.currentFolder || 'root';
                this.usedStorage = data.settings.usedStorage || 0;
            }
            
            // Rebuild search index
            this.files.forEach(file => {
                if (!file.deleted) {
                    this.updateSearchIndex(file);
                }
            });
            
            this.updateFileList();
            this.updateFolderTree();
            
        } catch (error) {
            console.error('Error loading from storage:', error);
        }
    }

    /**
     * Generate unique file ID
     */
    generateFileId() {
        return 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Add operation to history
     */
    addToHistory(operation, data) {
        this.operationHistory.unshift({
            operation,
            data,
            timestamp: new Date()
        });
        
        // Limit history size
        if (this.operationHistory.length > 100) {
            this.operationHistory = this.operationHistory.slice(0, 100);
        }
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
     * Get file by ID
     */
    getFile(fileId) {
        return this.files.get(fileId);
    }

    /**
     * Get files in folder
     */
    getFilesInFolder(folderId) {
        return Array.from(this.files.values()).filter(f => f.folder === folderId && !f.deleted);
    }

    /**
     * Export file data
     */
    exportFile(fileId) {
        const file = this.files.get(fileId);
        if (!file) return null;
        
        return {
            name: file.name,
            type: file.type,
            data: file.data
        };
    }
}

// Export for global access
window.FileManager = FileManager;