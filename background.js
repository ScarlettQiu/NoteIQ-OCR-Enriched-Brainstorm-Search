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
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'noteiq-ocr' && info.srcUrl) {
        // Open normal window with image
        try {
            const window = await chrome.windows.create({
                url: chrome.runtime.getURL('popup.html'),
                type: 'normal',
                width: 800,
                height: 900,
                left: 100,
                top: 100,
                focused: true
            });
            console.log('NoteIQ window opened from context menu:', window.id);
        } catch (error) {
            console.error('Error opening NoteIQ window from context menu:', error);
            // Fallback: try to open in new tab
            try {
                chrome.tabs.create({
                    url: chrome.runtime.getURL('popup.html')
                });
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
            }
        }
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
        const response = await fetch('http://localhost:5001/ocr', {
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

// Handle extension icon click - open normal window
chrome.action.onClicked.addListener(async (tab) => {
    console.log('Extension icon clicked - opening NoteIQ window');
    console.log('Extension URL:', chrome.runtime.getURL('popup.html'));
    
    try {
        // Create a normal Chrome window
        const window = await chrome.windows.create({
            url: chrome.runtime.getURL('popup.html'),
            type: 'normal',
            width: 800,
            height: 900,
            left: 100,
            top: 100,
            focused: true
        });
        
        console.log('NoteIQ window opened successfully:', window.id);
        
    } catch (error) {
        console.error('Error opening NoteIQ window:', error);
        
        // Fallback: open in new tab
        try {
            const newTab = await chrome.tabs.create({
                url: chrome.runtime.getURL('popup.html'),
                active: true
            });
            console.log('Fallback: opened in new tab:', newTab.id);
        } catch (fallbackError) {
            console.error('All methods failed:', fallbackError);
        }
    }
});
