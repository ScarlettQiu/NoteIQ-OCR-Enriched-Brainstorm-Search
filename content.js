// NoteIQ Chrome Extension - Content Script
// This runs on web pages and can interact with page content

console.log('NoteIQ content script loaded');

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractPageText') {
        const pageText = extractTextFromPage();
        sendResponse({ text: pageText });
    }
    
    if (request.action === 'highlightText') {
        highlightTextOnPage(request.text);
        sendResponse({ success: true });
    }
});

// Extract text from the current page
function extractTextFromPage() {
    // Remove script and style elements
    const elementsToRemove = document.querySelectorAll('script, style, nav, header, footer');
    elementsToRemove.forEach(el => el.remove());
    
    // Get main content text
    const bodyText = document.body.innerText || document.body.textContent;
    
    // Clean up the text
    return bodyText
        .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
        .replace(/\n\s*\n/g, '\n')  // Remove empty lines
        .trim();
}

// Highlight specific text on the page (for search results)
function highlightTextOnPage(searchText) {
    // Remove existing highlights
    const existingHighlights = document.querySelectorAll('.noteiq-highlight');
    existingHighlights.forEach(el => {
        el.replaceWith(el.textContent);
    });
    
    if (!searchText) return;
    
    // Find and highlight text
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    const textNodes = [];
    let node;
    
    while (node = walker.nextNode()) {
        textNodes.push(node);
    }
    
    textNodes.forEach(textNode => {
        const text = textNode.textContent;
        const regex = new RegExp(`(${escapeRegExp(searchText)})`, 'gi');
        
        if (regex.test(text)) {
            const highlightedHTML = text.replace(regex, '<mark class="noteiq-highlight" style="background-color: #ffeb3b; padding: 2px 4px; border-radius: 3px;">$1</mark>');
            
            if (highlightedHTML !== text) {
                const wrapper = document.createElement('div');
                wrapper.innerHTML = highlightedHTML;
                
                while (wrapper.firstChild) {
                    textNode.parentNode.insertBefore(wrapper.firstChild, textNode);
                }
                textNode.remove();
            }
        }
    });
}

// Escape special regex characters
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Add NoteIQ button to images (optional feature)
function addNoteIQButtons() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        if (img.dataset.noteiqButton) return; // Already has button
        
        const button = document.createElement('button');
        button.textContent = '📝 OCR';
        button.className = 'noteiq-ocr-button';
        button.style.cssText = `
            position: absolute;
            background: #4f46e5;
            color: white;
            border: none;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.2s;
        `;
        
        // Position button relative to image
        img.style.position = 'relative';
        img.parentNode.style.position = 'relative';
        
        img.addEventListener('mouseenter', () => {
            button.style.opacity = '1';
        });
        
        img.addEventListener('mouseleave', () => {
            button.style.opacity = '0';
        });
        
        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            await processImageWithNoteIQ(img.src);
        });
        
        img.parentNode.appendChild(button);
        img.dataset.noteiqButton = 'true';
    });
}

// Process image with NoteIQ API
async function processImageWithNoteIQ(imageUrl) {
    try {
        // Convert image to base64
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(blob);
        });
        
        // Send to background script for processing
        chrome.runtime.sendMessage({
            action: 'processImage',
            data: base64
        }, (response) => {
            if (response.success) {
                // Show results in a popup or notification
                showResults(response.data);
            } else {
                console.error('OCR processing failed:', response.error);
            }
        });
    } catch (error) {
        console.error('Error processing image:', error);
    }
}

// Show OCR results
function showResults(data) {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'noteiq-result-popup';
    resultDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 400px;
        max-height: 300px;
        overflow-y: auto;
    `;
    
    resultDiv.innerHTML = `
        <h3>📝 Extracted Text:</h3>
        <p>${data.extracted_text || 'No text found'}</p>
        <button onclick="this.parentNode.remove()" style="margin-top: 10px; padding: 5px 10px;">Close</button>
    `;
    
    document.body.appendChild(resultDiv);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (resultDiv.parentNode) {
            resultDiv.remove();
        }
    }, 10000);
}

// Initialize content script features
document.addEventListener('DOMContentLoaded', () => {
    // Add OCR buttons to images (optional)
    setTimeout(addNoteIQButtons, 1000);
});
