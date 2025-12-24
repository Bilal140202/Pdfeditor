/**
 * PDF Reader Pro - PDF Converter Module
 * Advanced PDF conversion system supporting multiple formats
 */

class PDFConverter {
    constructor() {
        this.engine = null;
        this.conversionQueue = [];
        this.isProcessing = false;
        
        // Supported formats
        this.supportedFormats = {
            output: ['docx', 'xlsx', 'pptx', 'txt', 'html', 'jpg', 'png', 'svg'],
            input: ['jpg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'html', 'txt']
        };
        
        // OCR configuration
        this.ocrEnabled = false;
        this.ocrLanguage = 'eng';
        
        this.init();
    }

    /**
     * Initialize the converter
     */
    init() {
        // Initialize conversion workers if available
        this.initializeWorkers();
        
        console.log('PDF Converter initialized successfully');
    }

    /**
     * Initialize web workers for heavy conversion tasks
     */
    initializeWorkers() {
        // Create conversion worker
        try {
            this.conversionWorker = new Worker('js/workers/conversion-worker.js');
            this.conversionWorker.onmessage = (e) => this.handleWorkerMessage(e);
            this.conversionWorker.onerror = (error) => console.error('Conversion worker error:', error);
        } catch (error) {
            console.warn('Web workers not available, falling back to main thread');
        }
    }

    /**
     * Set PDF engine reference
     */
    setEngine(engine) {
        this.engine = engine;
    }

    /**
     * Convert PDF to Word document
     */
    async convertToWord(options = {}) {
        if (!this.engine || !this.engine.currentPDF) {
            throw new Error('No PDF loaded');
        }

        const {
            includeImages = true,
            maintainFormatting = true,
            extractTables = true,
            pages = null // null means all pages
        } = options;

        try {
            this.showStatus('Converting PDF to Word...', 'info');
            
            const pdf = this.engine.currentPDF;
            const totalPages = pages ? pages.length : pdf.numPages;
            const docContent = [];
            
            // Process each page
            for (let i = 1; i <= pdf.numPages; i++) {
                if (pages && !pages.includes(i)) continue;
                
                this.showStatus(`Converting page ${i} of ${totalPages}...`, 'info');
                
                const page = await pdf.getPage(i);
                const pageContent = await this.extractPageContent(page, {
                    includeImages,
                    maintainFormatting,
                    extractTables
                });
                
                docContent.push(pageContent);
            }
            
            // Generate Word document
            const wordDoc = await this.generateWordDocument(docContent);
            
            this.showStatus('Word document generated successfully', 'success');
            return wordDoc;
            
        } catch (error) {
            console.error('Error converting to Word:', error);
            this.showStatus('Failed to convert to Word: ' + error.message, 'error');
            throw error;
        }
    }

    /**
     * Convert PDF to Excel spreadsheet
     */
    async convertToExcel(options = {}) {
        if (!this.engine || !this.engine.currentPDF) {
            throw new Error('No PDF loaded');
        }

        const {
            detectTables = true,
            separateSheets = true,
            preserveFormatting = true,
            pages = null
        } = options;

        try {
            this.showStatus('Converting PDF to Excel...', 'info');
            
            const pdf = this.engine.currentPDF;
            const workbookData = [];
            
            // Process each page for table detection
            for (let i = 1; i <= pdf.numPages; i++) {
                if (pages && !pages.includes(i)) continue;
                
                this.showStatus(`Analyzing page ${i} for tables...`, 'info');
                
                const page = await pdf.getPage(i);
                const tables = await this.extractTables(page);
                
                if (tables.length > 0) {
                    tables.forEach((table, index) => {
                        workbookData.push({
                            name: separateSheets ? `Page ${i} Table ${index + 1}` : `Table ${workbookData.length + 1}`,
                            data: table.data,
                            formatting: preserveFormatting ? table.formatting : null
                        });
                    });
                } else if (!detectTables) {
                    // Extract all text as structured data
                    const textData = await this.extractStructuredText(page);
                    workbookData.push({
                        name: `Page ${i}`,
                        data: textData,
                        formatting: null
                    });
                }
            }
            
            // Generate Excel workbook
            const excelFile = await this.generateExcelWorkbook(workbookData);
            
            this.showStatus('Excel document generated successfully', 'success');
            return excelFile;
            
        } catch (error) {
            console.error('Error converting to Excel:', error);
            this.showStatus('Failed to convert to Excel: ' + error.message, 'error');
            throw error;
        }
    }

    /**
     * Convert PDF to PowerPoint presentation
     */
    async convertToPowerPoint(options = {}) {
        if (!this.engine || !this.engine.currentPDF) {
            throw new Error('No PDF loaded');
        }

        const {
            oneSlidePerPage = true,
            includeImages = true,
            maintainLayout = true,
            pages = null
        } = options;

        try {
            this.showStatus('Converting PDF to PowerPoint...', 'info');
            
            const pdf = this.engine.currentPDF;
            const slides = [];
            
            // Process each page as a slide
            for (let i = 1; i <= pdf.numPages; i++) {
                if (pages && !pages.includes(i)) continue;
                
                this.showStatus(`Converting page ${i} to slide...`, 'info');
                
                const page = await pdf.getPage(i);
                const slideContent = await this.createSlideFromPage(page, {
                    includeImages,
                    maintainLayout
                });
                
                slides.push(slideContent);
            }
            
            // Generate PowerPoint presentation
            const pptxFile = await this.generatePowerPointPresentation(slides);
            
            this.showStatus('PowerPoint presentation generated successfully', 'success');
            return pptxFile;
            
        } catch (error) {
            console.error('Error converting to PowerPoint:', error);
            this.showStatus('Failed to convert to PowerPoint: ' + error.message, 'error');
            throw error;
        }
    }

    /**
     * Convert PDF to images
     */
    async convertToImages(format = 'png', options = {}) {
        if (!this.engine || !this.engine.currentPDF) {
            throw new Error('No PDF loaded');
        }

        const {
            quality = 1.0,
            scale = 2.0,
            pages = null,
            backgroundColor = 'white'
        } = options;

        try {
            this.showStatus(`Converting PDF to ${format.toUpperCase()} images...`, 'info');
            
            const pdf = this.engine.currentPDF;
            const images = [];
            
            // Process each page
            for (let i = 1; i <= pdf.numPages; i++) {
                if (pages && !pages.includes(i)) continue;
                
                this.showStatus(`Converting page ${i} to image...`, 'info');
                
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale });
                
                // Create canvas
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                // Set background
                if (backgroundColor !== 'transparent') {
                    context.fillStyle = backgroundColor;
                    context.fillRect(0, 0, canvas.width, canvas.height);
                }
                
                // Render page
                await page.render({ canvasContext: context, viewport }).promise;
                
                // Convert to desired format
                const imageData = canvas.toDataURL(`image/${format}`, quality);
                images.push({
                    page: i,
                    data: imageData,
                    width: canvas.width,
                    height: canvas.height
                });
            }
            
            this.showStatus(`${images.length} images generated successfully`, 'success');
            return images;
            
        } catch (error) {
            console.error('Error converting to images:', error);
            this.showStatus('Failed to convert to images: ' + error.message, 'error');
            throw error;
        }
    }

    /**
     * Convert images to PDF
     */
    async convertImagesToPDF(images, options = {}) {
        const {
            pageSize = 'A4',
            orientation = 'portrait',
            margin = 20,
            quality = 0.8,
            title = 'Converted PDF'
        } = options;

        try {
            this.showStatus('Converting images to PDF...', 'info');
            
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation,
                unit: 'mm',
                format: pageSize
            });
            
            // Remove the default first page
            pdf.deletePage(1);
            
            for (let i = 0; i < images.length; i++) {
                this.showStatus(`Adding image ${i + 1} of ${images.length}...`, 'info');
                
                const image = images[i];
                
                // Add new page
                pdf.addPage();
                
                // Calculate dimensions
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                const availableWidth = pageWidth - (margin * 2);
                const availableHeight = pageHeight - (margin * 2);
                
                // Get image dimensions
                const img = await this.loadImage(image.src || image);
                const imgAspectRatio = img.width / img.height;
                const availableAspectRatio = availableWidth / availableHeight;
                
                let imgWidth, imgHeight;
                
                if (imgAspectRatio > availableAspectRatio) {
                    // Image is wider than available space
                    imgWidth = availableWidth;
                    imgHeight = availableWidth / imgAspectRatio;
                } else {
                    // Image is taller than available space
                    imgHeight = availableHeight;
                    imgWidth = availableHeight * imgAspectRatio;
                }
                
                // Center the image
                const x = (pageWidth - imgWidth) / 2;
                const y = (pageHeight - imgHeight) / 2;
                
                // Add image to PDF
                pdf.addImage(image.src || image, 'JPEG', x, y, imgWidth, imgHeight, undefined, 'MEDIUM');
            }
            
            // Set document properties
            pdf.setProperties({
                title: title,
                subject: 'PDF created from images',
                author: 'PDF Reader Pro',
                creator: 'PDF Reader Pro'
            });
            
            this.showStatus('PDF generated successfully from images', 'success');
            return pdf;
            
        } catch (error) {
            console.error('Error converting images to PDF:', error);
            this.showStatus('Failed to convert images to PDF: ' + error.message, 'error');
            throw error;
        }
    }

    /**
     * Convert webpage to PDF
     */
    async convertWebPageToPDF(url, options = {}) {
        const {
            pageSize = 'A4',
            orientation = 'portrait',
            margin = {
                top: 20,
                right: 20,
                bottom: 20,
                left: 20
            },
            scale = 1,
            waitForSelector = null,
            timeout = 30000
        } = options;

        try {
            this.showStatus('Converting webpage to PDF...', 'info');
            
            // Create iframe to load the webpage
            const iframe = document.createElement('iframe');
            iframe.style.cssText = `
                width: 1024px;
                height: 768px;
                position: absolute;
                left: -9999px;
                top: -9999px;
            `;
            
            document.body.appendChild(iframe);
            
            // Load webpage
            await new Promise((resolve, reject) => {
                iframe.onload = resolve;
                iframe.onerror = reject;
                iframe.src = url;
                
                setTimeout(() => reject(new Error('Timeout loading webpage')), timeout);
            });
            
            // Wait for specific selector if provided
            if (waitForSelector) {
                await this.waitForSelector(iframe.contentDocument, waitForSelector, 5000);
            }
            
            // Convert to PDF using html2canvas
            const canvas = await html2canvas(iframe.contentDocument.body, {
                scale: scale,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff'
            });
            
            // Create PDF from canvas
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation,
                unit: 'mm',
                format: pageSize
            });
            
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = pdf.internal.pageSize.getWidth() - margin.left - margin.right;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', margin.left, margin.top, imgWidth, imgHeight);
            
            // Cleanup
            document.body.removeChild(iframe);
            
            this.showStatus('Webpage converted to PDF successfully', 'success');
            return pdf;
            
        } catch (error) {
            console.error('Error converting webpage to PDF:', error);
            this.showStatus('Failed to convert webpage to PDF: ' + error.message, 'error');
            throw error;
        }
    }

    /**
     * Extract page content for Word conversion
     */
    async extractPageContent(page, options) {
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1.0 });
        
        const content = {
            text: '',
            images: [],
            tables: [],
            formatting: []
        };
        
        // Extract text with positioning
        if (textContent.items.length > 0) {
            const textItems = textContent.items.map(item => ({
                text: item.str,
                x: item.transform[4],
                y: viewport.height - item.transform[5],
                width: item.width,
                height: item.height,
                font: item.fontName,
                fontSize: item.height
            }));
            
            // Sort by position (top to bottom, left to right)
            textItems.sort((a, b) => {
                const yDiff = Math.abs(a.y - b.y);
                if (yDiff < 5) { // Same line
                    return a.x - b.x;
                }
                return a.y - b.y;
            });
            
            // Group into paragraphs and extract formatting
            let currentParagraph = '';
            let lastY = -1;
            
            textItems.forEach(item => {
                if (lastY !== -1 && Math.abs(item.y - lastY) > item.height * 1.5) {
                    // New paragraph
                    if (currentParagraph.trim()) {
                        content.text += currentParagraph.trim() + '\n\n';
                        currentParagraph = '';
                    }
                }
                
                currentParagraph += item.text;
                lastY = item.y;
                
                // Store formatting information
                content.formatting.push({
                    text: item.text,
                    font: item.font,
                    fontSize: item.fontSize,
                    position: { x: item.x, y: item.y }
                });
            });
            
            if (currentParagraph.trim()) {
                content.text += currentParagraph.trim();
            }
        }
        
        // Extract images if requested
        if (options.includeImages) {
            try {
                const operatorList = await page.getOperatorList();
                // Process operator list to find images
                // This is a simplified version - full implementation would be more complex
                content.images = await this.extractImagesFromOperatorList(operatorList);
            } catch (error) {
                console.warn('Could not extract images:', error);
            }
        }
        
        // Extract tables if requested
        if (options.extractTables) {
            content.tables = await this.extractTables(page);
        }
        
        return content;
    }

    /**
     * Extract tables from page
     */
    async extractTables(page) {
        // Simplified table extraction
        // Full implementation would use more sophisticated algorithms
        const textContent = await page.getTextContent();
        const tables = [];
        
        if (textContent.items.length === 0) return tables;
        
        // Group text items by similar Y positions (rows)
        const rows = new Map();
        
        textContent.items.forEach(item => {
            const y = Math.round(item.transform[5] / 5) * 5; // Group by 5-pixel intervals
            if (!rows.has(y)) {
                rows.set(y, []);
            }
            rows.get(y).push({
                text: item.str,
                x: item.transform[4],
                width: item.width
            });
        });
        
        // Sort rows by Y position
        const sortedRows = Array.from(rows.entries()).sort((a, b) => b[0] - a[0]);
        
        // Detect table-like structures
        if (sortedRows.length > 2) {
            const tableData = sortedRows.map(([y, items]) => {
                // Sort items in row by X position
                items.sort((a, b) => a.x - b.x);
                return items.map(item => item.text);
            });
            
            // Check if this looks like a table (similar number of columns)
            const columnCounts = tableData.map(row => row.length);
            const avgColumns = columnCounts.reduce((a, b) => a + b, 0) / columnCounts.length;
            const variance = columnCounts.reduce((acc, count) => acc + Math.pow(count - avgColumns, 2), 0) / columnCounts.length;
            
            if (variance < 2 && avgColumns > 1) { // Low variance suggests table structure
                tables.push({
                    data: tableData,
                    rows: tableData.length,
                    columns: Math.round(avgColumns),
                    formatting: null
                });
            }
        }
        
        return tables;
    }

    /**
     * Generate Word document from content
     */
    async generateWordDocument(docContent) {
        // This would use a library like docx or officegen
        // For now, generate HTML that can be saved as .doc
        let htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Converted Document</title>
                <style>
                    body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; margin: 1in; }
                    h1, h2, h3 { color: #333; }
                    table { border-collapse: collapse; width: 100%; margin: 10px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                </style>
            </head>
            <body>
        `;
        
        docContent.forEach((pageContent, pageIndex) => {
            htmlContent += `<h2>Page ${pageIndex + 1}</h2>`;
            
            // Add text content
            if (pageContent.text) {
                const paragraphs = pageContent.text.split('\n\n');
                paragraphs.forEach(paragraph => {
                    if (paragraph.trim()) {
                        htmlContent += `<p>${this.escapeHtml(paragraph)}</p>`;
                    }
                });
            }
            
            // Add tables
            pageContent.tables.forEach(table => {
                htmlContent += '<table>';
                table.data.forEach((row, rowIndex) => {
                    const tag = rowIndex === 0 ? 'th' : 'td';
                    htmlContent += '<tr>';
                    row.forEach(cell => {
                        htmlContent += `<${tag}>${this.escapeHtml(cell)}</${tag}>`;
                    });
                    htmlContent += '</tr>';
                });
                htmlContent += '</table>';
            });
            
            if (pageIndex < docContent.length - 1) {
                htmlContent += '<div style="page-break-after: always;"></div>';
            }
        });
        
        htmlContent += '</body></html>';
        
        // Create blob
        const blob = new Blob([htmlContent], { type: 'application/msword' });
        return {
            blob,
            filename: 'converted-document.doc',
            type: 'application/msword'
        };
    }

    /**
     * Generate Excel workbook from data
     */
    async generateExcelWorkbook(workbookData) {
        // Using SheetJS library
        const XLSX = window.XLSX;
        const workbook = XLSX.utils.book_new();
        
        workbookData.forEach(sheetData => {
            const worksheet = XLSX.utils.aoa_to_sheet(sheetData.data);
            
            // Apply formatting if available
            if (sheetData.formatting) {
                // Apply cell formatting
                Object.keys(sheetData.formatting).forEach(cellRef => {
                    if (!worksheet[cellRef]) worksheet[cellRef] = {};
                    worksheet[cellRef].s = sheetData.formatting[cellRef];
                });
            }
            
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetData.name);
        });
        
        // Generate file
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        return {
            blob,
            filename: 'converted-spreadsheet.xlsx',
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        };
    }

    /**
     * Utility functions
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    waitForSelector(document, selector, timeout) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkElement = () => {
                const element = document.querySelector(selector);
                if (element) {
                    resolve(element);
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error(`Timeout waiting for selector: ${selector}`));
                } else {
                    setTimeout(checkElement, 100);
                }
            };
            
            checkElement();
        });
    }

    showStatus(message, type) {
        // Emit status event
        this.emit('statusUpdate', { message, type });
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
                console.error('Error in converter event listener:', error);
            }
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PDFConverter;
}