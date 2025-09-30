// NoteIQ Chrome Extension - Background Service Worker

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
    console.log('NoteIQ Extension installed');
    
    // Set up context menu (optional)
    chrome.contextMenus.create({
        id: 'noteiq-ocr',
        title: 'Extract text with NoteIQ',
        contexts: ['image']
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'noteiq-ocr' && info.srcUrl) {
        // Open popup with image
        chrome.action.openPopup();
    }
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'processImage') {
        // Handle image processing requests
        processImageRequest(request.data)
            .then(result => sendResponse({ success: true, data: result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        
        return true; // Keep message channel open for async response
    }
});

// Process image through your Flask API
async function processImageRequest(imageData) {
    try {
        const response = await fetch('http://localhost:5003/ocr', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image_base64: imageData
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Background processing error:', error);
        throw error;
    }
}

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    // This is handled by the popup, but we can add additional logic here
    console.log('Extension icon clicked');
});
