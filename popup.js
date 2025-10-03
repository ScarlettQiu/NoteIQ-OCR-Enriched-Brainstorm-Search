// NoteIQ Chrome Extension - Popup JavaScript

class NoteIQExtension {
    constructor() {
        this.apiUrl = 'http://localhost:5001'; // Your Flask API URL
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const imageUpload = document.getElementById('image-upload');
        imageUpload.addEventListener('change', (e) => this.handleImageUpload(e));
        
        // Copy button event listeners
        document.getElementById('copy-text-btn').addEventListener('click', () => this.copyText());
        document.getElementById('copy-insights-btn').addEventListener('click', () => this.copyInsights());
    }

    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Show image preview
        this.showImagePreview(file);

        // Convert to base64 and process
        try {
            const base64 = await this.fileToBase64(file);
            await this.processImage(base64);
        } catch (error) {
            this.showError('Failed to process image: ' + error.message);
        }
    }

    showImagePreview(file) {
        const preview = document.getElementById('image-preview');
        const reader = new FileReader();
        
        reader.onload = (e) => {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        
        reader.readAsDataURL(file);
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1]; // Remove data:image/... prefix
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async processImage(base64Image) {
        this.showProcessing();

        try {
            // Step 1: OCR Processing
            const ocrResult = await this.performOCR(base64Image);
            
            if (!ocrResult.extracted_text) {
                throw new Error('No text found in image');
            }

            // Step 2: AI Enrichment
            const enrichmentResult = await this.performEnrichment(ocrResult.extracted_text, ocrResult.visual_analysis);

            // Show results
            this.showResults(ocrResult.extracted_text, enrichmentResult.enriched_output);

        } catch (error) {
            this.showError('Processing failed: ' + error.message);
        }
    }

    async performOCR(base64Image) {
        const response = await fetch(`${this.apiUrl}/ocr`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image_base64: base64Image
            })
        });

        if (!response.ok) {
            throw new Error(`OCR API error: ${response.status}`);
        }

        return await response.json();
    }

    async performEnrichment(text, visualAnalysis) {
        const response = await fetch(`${this.apiUrl}/enrich`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                visual_analysis: visualAnalysis
            })
        });

        if (!response.ok) {
            throw new Error(`Enrichment API error: ${response.status}`);
        }

        return await response.json();
    }

    showProcessing() {
        document.getElementById('processing-section').style.display = 'block';
        document.getElementById('results-section').style.display = 'none';
        document.getElementById('error-section').style.display = 'none';
    }

    showResults(extractedText, enrichedOutput) {
        document.getElementById('processing-section').style.display = 'none';
        document.getElementById('results-section').style.display = 'block';
        document.getElementById('error-section').style.display = 'none';

        document.getElementById('extracted-text').textContent = extractedText;
        document.getElementById('ai-insights').textContent = enrichedOutput;
    }

    showError(message) {
        document.getElementById('processing-section').style.display = 'none';
        document.getElementById('results-section').style.display = 'none';
        document.getElementById('error-section').style.display = 'block';

        document.getElementById('error-text').textContent = message;
    }

    async copyText() {
        const text = document.getElementById('extracted-text').textContent;
        await this.copyToClipboard(text, 'copy-text-btn');
    }

    async copyInsights() {
        const insights = document.getElementById('ai-insights').textContent;
        await this.copyToClipboard(insights, 'copy-insights-btn');
    }

    async copyToClipboard(text, buttonId) {
        try {
            await navigator.clipboard.writeText(text);
            this.showCopySuccess(buttonId);
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showCopySuccess(buttonId);
        }
    }

    showCopySuccess(buttonId) {
        const button = document.getElementById(buttonId);
        const originalText = button.textContent;
        
        button.classList.add('copied');
        button.textContent = '✓ Copied!';
        
        setTimeout(() => {
            button.classList.remove('copied');
            button.textContent = originalText;
        }, 2000);
    }
}

// Initialize the extension when popup loads
document.addEventListener('DOMContentLoaded', () => {
    new NoteIQExtension();
});

// Utility function to copy text to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Could add a toast notification here
        console.log('Text copied to clipboard');
    });
}
