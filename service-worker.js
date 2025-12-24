/**
 * PDF Reader Pro - Service Worker
 * Enables offline functionality and caching for the PDF editor
 */

const CACHE_NAME = 'pdf-reader-pro-v1.0.0';
const STATIC_CACHE_NAME = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE_NAME = `${CACHE_NAME}-dynamic`;

// Files to cache for offline use
const STATIC_FILES = [
    '/',
    '/index.html',
    '/css/main.css',
    '/css/components.css', 
    '/css/themes.css',
    '/js/app.js',
    '/js/modules/pdf-engine.js',
    '/js/modules/pdf-viewer.js',
    '/js/modules/pdf-editor.js',
    '/js/modules/pdf-converter.js',
    '/js/modules/pdf-signature.js',
    '/js/modules/document-scanner.js',
    '/js/modules/file-manager.js',
    '/js/modules/pdf-security.js',
    '/js/modules/pdf-tools.js',
    // External libraries (cached when accessed)
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Install event - cache static files
self.addEventListener('install', event => {
    console.log('[SW] Installing service worker...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching static files');
                return cache.addAll(STATIC_FILES.map(url => {
                    return new Request(url, { mode: 'no-cors' });
                }));
            })
            .catch(error => {
                console.error('[SW] Failed to cache static files:', error);
            })
    );
    
    // Skip waiting to activate immediately
    self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
    console.log('[SW] Activating service worker...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
    );
    
    // Take control of all clients immediately
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Handle PDF files specially - always try network first for fresh content
    if (request.url.includes('.pdf') || request.headers.get('accept')?.includes('application/pdf')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response.ok) {
                        // Cache successful PDF responses
                        const responseClone = response.clone();
                        caches.open(DYNAMIC_CACHE_NAME)
                            .then(cache => cache.put(request, responseClone));
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if network fails
                    return caches.match(request);
                })
        );
        return;
    }
    
    // Handle static assets - cache first strategy
    if (STATIC_FILES.includes(request.url) || url.origin !== location.origin) {
        event.respondWith(
            caches.match(request)
                .then(response => {
                    if (response) {
                        // Serve from cache
                        return response;
                    }
                    
                    // Fetch from network and cache
                    return fetch(request)
                        .then(response => {
                            if (response.ok) {
                                const responseClone = response.clone();
                                caches.open(STATIC_CACHE_NAME)
                                    .then(cache => cache.put(request, responseClone));
                            }
                            return response;
                        });
                })
                .catch(error => {
                    console.error('[SW] Fetch failed:', error);
                    
                    // Return offline fallback for HTML requests
                    if (request.headers.get('accept')?.includes('text/html')) {
                        return new Response(`
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <title>PDF Reader Pro - Offline</title>
                                <style>
                                    body {
                                        font-family: Arial, sans-serif;
                                        text-align: center;
                                        padding: 50px;
                                        background: #f5f5f5;
                                    }
                                    .offline-message {
                                        background: white;
                                        padding: 40px;
                                        border-radius: 8px;
                                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                                        max-width: 500px;
                                        margin: 0 auto;
                                    }
                                    .icon {
                                        font-size: 64px;
                                        color: #666;
                                        margin-bottom: 20px;
                                    }
                                    h1 { color: #333; }
                                    p { color: #666; }
                                    .retry-btn {
                                        background: #2563eb;
                                        color: white;
                                        border: none;
                                        padding: 12px 24px;
                                        border-radius: 6px;
                                        cursor: pointer;
                                        font-size: 16px;
                                        margin-top: 20px;
                                    }
                                    .retry-btn:hover {
                                        background: #1d4ed8;
                                    }
                                </style>
                            </head>
                            <body>
                                <div class="offline-message">
                                    <div class="icon">📄</div>
                                    <h1>You're Offline</h1>
                                    <p>PDF Reader Pro works offline for cached documents. Connect to the internet to access new features and documents.</p>
                                    <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
                                </div>
                            </body>
                            </html>
                        `, {
                            headers: { 'Content-Type': 'text/html' }
                        });
                    }
                    
                    return new Response('Offline - Content not available', { status: 503 });
                })
        );
        return;
    }
    
    // For other requests, try network first, then cache
    event.respondWith(
        fetch(request)
            .then(response => {
                if (response.ok) {
                    const responseClone = response.clone();
                    caches.open(DYNAMIC_CACHE_NAME)
                        .then(cache => cache.put(request, responseClone));
                }
                return response;
            })
            .catch(() => {
                return caches.match(request);
            })
    );
});

// Background sync for queued operations
self.addEventListener('sync', event => {
    console.log('[SW] Background sync triggered:', event.tag);
    
    switch (event.tag) {
        case 'pdf-conversion':
            event.waitUntil(processQueuedConversions());
            break;
        case 'file-upload':
            event.waitUntil(processQueuedUploads());
            break;
        case 'signature-sync':
            event.waitUntil(syncSignatures());
            break;
    }
});

// Push notifications for processing completion
self.addEventListener('push', event => {
    console.log('[SW] Push notification received');
    
    const options = {
        body: 'Your PDF processing is complete!',
        icon: '/assets/icons/icon-192.png',
        badge: '/assets/icons/badge-72.png',
        tag: 'pdf-processing-complete',
        requireInteraction: true,
        actions: [
            {
                action: 'view',
                title: 'View Result',
                icon: '/assets/icons/view.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
                icon: '/assets/icons/dismiss.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('PDF Reader Pro', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'view') {
        // Open the app
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message handling for communication with main thread
self.addEventListener('message', event => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CACHE_PDF':
            event.waitUntil(cachePDF(data.url, data.content));
            break;
            
        case 'CLEAR_CACHE':
            event.waitUntil(clearAllCaches());
            break;
            
        case 'GET_CACHE_SIZE':
            event.waitUntil(getCacheSize().then(size => {
                event.ports[0].postMessage({ type: 'CACHE_SIZE', size });
            }));
            break;
    }
});

/**
 * Process queued PDF conversions
 */
async function processQueuedConversions() {
    try {
        // Get queued conversions from IndexedDB
        const db = await openDB();
        const tx = db.transaction(['conversions'], 'readonly');
        const store = tx.objectStore('conversions');
        const conversions = await store.getAll();
        
        for (const conversion of conversions) {
            if (conversion.status === 'queued') {
                // Process conversion
                await processConversion(conversion);
            }
        }
    } catch (error) {
        console.error('[SW] Failed to process queued conversions:', error);
    }
}

/**
 * Cache a PDF file
 */
async function cachePDF(url, content) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        const response = new Response(content, {
            headers: { 'Content-Type': 'application/pdf' }
        });
        await cache.put(url, response);
        console.log('[SW] PDF cached successfully:', url);
    } catch (error) {
        console.error('[SW] Failed to cache PDF:', error);
    }
}

/**
 * Clear all caches
 */
async function clearAllCaches() {
    try {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('[SW] All caches cleared');
    } catch (error) {
        console.error('[SW] Failed to clear caches:', error);
    }
}

/**
 * Get total cache size
 */
async function getCacheSize() {
    try {
        let totalSize = 0;
        
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            totalSize = estimate.usage || 0;
        }
        
        return totalSize;
    } catch (error) {
        console.error('[SW] Failed to get cache size:', error);
        return 0;
    }
}

/**
 * Open IndexedDB for offline storage
 */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('PDFReaderProDB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = event => {
            const db = event.target.result;
            
            // Create object stores
            if (!db.objectStoreNames.contains('conversions')) {
                const conversionsStore = db.createObjectStore('conversions', { keyPath: 'id', autoIncrement: true });
                conversionsStore.createIndex('status', 'status', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('documents')) {
                const documentsStore = db.createObjectStore('documents', { keyPath: 'id', autoIncrement: true });
                documentsStore.createIndex('name', 'name', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('signatures')) {
                db.createObjectStore('signatures', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

console.log('[SW] Service worker loaded successfully');