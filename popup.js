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
        document.getElementById('copy-insights-btn').addEventListener('click', () => this.copyInsights());
        
        // Download button event listeners
        document.getElementById('download-insights-pdf-btn').addEventListener('click', () => this.downloadInsightsPDF());
        document.getElementById('download-insights-word-btn').addEventListener('click', () => this.downloadInsightsWord());
        document.getElementById('download-complete-pdf-btn').addEventListener('click', () => this.downloadCompletePDF());
        document.getElementById('download-complete-word-btn').addEventListener('click', () => this.downloadCompleteWord());
        
        // Close button event listener
        document.getElementById('close-btn').addEventListener('click', () => this.closeWindow());
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

        // Convert markdown to HTML for better readability
        const htmlOutput = this.convertMarkdownToHTML(enrichedOutput);
        document.getElementById('ai-insights').innerHTML = htmlOutput;
        
        // Update analysis date
        const now = new Date();
        const dateString = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        document.getElementById('analysis-date').textContent = `Analysis completed: ${dateString}`;
    }

    showError(message) {
        document.getElementById('processing-section').style.display = 'none';
        document.getElementById('results-section').style.display = 'none';
        document.getElementById('error-section').style.display = 'block';

        document.getElementById('error-text').textContent = message;
    }

    async copyInsights() {
        const insightsElement = document.getElementById('ai-insights');
        
        // Try to copy as HTML first, then fallback to plain text
        try {
            // Create a rich text format for better copying
            const htmlContent = insightsElement.innerHTML;
            const plainText = insightsElement.textContent;
            
            // Try to copy as HTML with formatting
            if (navigator.clipboard.write) {
                const clipboardItem = new ClipboardItem({
                    'text/html': new Blob([htmlContent], { type: 'text/html' }),
                    'text/plain': new Blob([plainText], { type: 'text/plain' })
                });
                await navigator.clipboard.write([clipboardItem]);
            } else {
                // Fallback to plain text
                await navigator.clipboard.writeText(plainText);
            }
            
            this.showCopySuccess('copy-insights-btn');
        } catch (err) {
            // Final fallback
            const textArea = document.createElement('textarea');
            textArea.value = insightsElement.textContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showCopySuccess('copy-insights-btn');
        }
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

    closeWindow() {
        // Close the current window
        window.close();
    }

    convertMarkdownToHTML(markdown) {
        // Convert markdown to HTML with proper styling
        let html = markdown
            // Convert headers (order matters - do more specific first)
            .replace(/^### (.*$)/gim, '<h3 class="insight-header">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="insight-section">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="insight-title">$1</h1>')
            
            // Convert bold text
            .replace(/\*\*(.*?)\*\*/g, '<strong class="insight-bold">$1</strong>')
            
            // Convert bullet points (handle different bullet styles)
            .replace(/^• (.*$)/gim, '<li class="insight-bullet">$1</li>')
            .replace(/^- (.*$)/gim, '<li class="insight-bullet">$1</li>')
            .replace(/^\* (.*$)/gim, '<li class="insight-bullet">$1</li>')
            
            // Convert numbered lists
            .replace(/^\d+\. (.*$)/gim, '<li class="insight-numbered">$1</li>')
            
            // Convert line breaks to proper HTML
            .replace(/\n\n/g, '</p><p class="insight-paragraph">')
            .replace(/\n/g, '<br>')
            
            // Wrap content in paragraphs (but not headers or lists)
            .replace(/^(?!<[h|l])(.*)$/gm, '<p class="insight-paragraph">$1</p>')
            
            // Clean up empty paragraphs and fix formatting
            .replace(/<p class="insight-paragraph"><\/p>/g, '')
            .replace(/<p class="insight-paragraph"><br><\/p>/g, '')
            .replace(/<p class="insight-paragraph">(<h[1-6].*?<\/h[1-6]>)<\/p>/g, '$1')
            
            // Wrap consecutive bullet points in ul tags
            .replace(/(<li class="insight-bullet">.*?<\/li>(?:\s*<li class="insight-bullet">.*?<\/li>)*)/gs, '<ul class="insight-list">$1</ul>')
            
            // Wrap consecutive numbered items in ol tags
            .replace(/(<li class="insight-numbered">.*?<\/li>(?:\s*<li class="insight-numbered">.*?<\/li>)*)/gs, '<ol class="insight-numbered-list">$1</ol>')
            
            // Clean up nested paragraphs in lists
            .replace(/<p class="insight-paragraph">(<li.*?<\/li>)<\/p>/g, '$1')
            .replace(/<p class="insight-paragraph">(<ul.*?<\/ul>)<\/p>/g, '$1')
            .replace(/<p class="insight-paragraph">(<ol.*?<\/ol>)<\/p>/g, '$1');

        return html;
    }

    // Download methods
    downloadInsightsPDF() {
        const insights = document.getElementById('ai-insights').innerHTML;
        this.downloadAsPDF('AI Insights', insights, 'noteiq-ai-insights.pdf');
        this.showDownloadSuccess('download-insights-pdf-btn');
    }

    downloadInsightsWord() {
        const insights = document.getElementById('ai-insights').innerHTML;
        this.downloadAsWord('AI Insights', insights, 'noteiq-ai-insights.docx');
        this.showDownloadSuccess('download-insights-word-btn');
    }

    downloadCompletePDF() {
        const insights = document.getElementById('ai-insights').innerHTML;
        const completeContent = this.formatCompleteReportHTML(insights);
        this.downloadAsPDF('NoteIQ Complete Report', completeContent, 'noteiq-complete-report.pdf');
        this.showDownloadSuccess('download-complete-pdf-btn');
    }

    downloadCompleteWord() {
        const insights = document.getElementById('ai-insights').innerHTML;
        const completeContent = this.formatCompleteReportHTML(insights);
        this.downloadAsWord('NoteIQ Complete Report', completeContent, 'noteiq-complete-report.docx');
        this.showDownloadSuccess('download-complete-word-btn');
    }

    formatCompleteReport(insights) {
        const timestamp = new Date().toLocaleString();
        return `
# NoteIQ Complete Analysis Report
Generated on: ${timestamp}

## 🧠 AI Insights
${insights}

---
*Report generated by NoteIQ - OCR & AI Brainstorm Assistant*
*Powered by Google Vision API & Gemini AI*
        `.trim();
    }

    formatCompleteReportHTML(insights) {
        const timestamp = new Date().toLocaleString();
        return `
<h1 class="insight-title">NoteIQ Complete Analysis Report</h1>
<p class="insight-paragraph"><strong>Generated on:</strong> ${timestamp}</p>

<h2 class="insight-section">🧠 AI Insights</h2>
${insights}

<hr style="margin: 30px 0; border: 1px solid #e2e8f0;">
<p class="insight-paragraph" style="font-size: 12px; color: #6b7280; text-align: center;">
    <em>Report generated by NoteIQ - OCR & AI Brainstorm Assistant</em><br>
    <em>Powered by Google Vision API & Gemini AI</em>
</p>
        `.trim();
    }

    downloadAsPDF(title, content, filename) {
        // Create a properly formatted HTML document optimized for PDF generation
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        @page {
            size: A4;
            margin: 1in;
        }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; 
            margin: 0;
            color: #1e293b;
            background: white;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
        }
        h1 { 
            color: #1e40af; 
            border-bottom: 3px solid #1e40af; 
            padding-bottom: 15px; 
            font-size: 28px;
            margin-bottom: 30px;
            page-break-after: avoid;
        }
        h2 { 
            color: #374151; 
            margin-top: 30px; 
            font-size: 20px;
            margin-bottom: 15px;
            page-break-after: avoid;
        }
        .content { 
            background: white; 
            padding: 25px; 
            border: 1px solid #e2e8f0;
            font-size: 15px;
            line-height: 1.7;
        }
        .footer { 
            margin-top: 40px; 
            font-size: 12px; 
            color: #6b7280; 
            text-align: center; 
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
            page-break-before: avoid;
        }
        .header-info {
            background: #f1f5f9;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
            font-size: 12px;
            color: #64748b;
        }
        /* Insight formatting styles */
        .insight-title {
            color: #1e40af;
            font-size: 24px;
            font-weight: 700;
            margin: 20px 0 15px 0;
            border-bottom: 2px solid #1e40af;
            padding-bottom: 10px;
            page-break-after: avoid;
        }
        .insight-section {
            color: #374151;
            font-size: 20px;
            font-weight: 600;
            margin: 25px 0 15px 0;
            padding-left: 15px;
            border-left: 4px solid #1e40af;
            page-break-after: avoid;
        }
        .insight-header {
            color: #4b5563;
            font-size: 18px;
            font-weight: 600;
            margin: 20px 0 10px 0;
            padding-left: 10px;
            border-left: 3px solid #10b981;
            page-break-after: avoid;
        }
        .insight-paragraph {
            margin: 12px 0;
            line-height: 1.7;
            color: #374151;
            page-break-inside: avoid;
        }
        .insight-bold {
            color: #1e40af;
            font-weight: 700;
        }
        .insight-list {
            margin: 15px 0;
            padding-left: 20px;
            page-break-inside: avoid;
        }
        .insight-bullet {
            margin: 8px 0;
            padding-left: 8px;
            position: relative;
            line-height: 1.6;
        }
        .insight-bullet::before {
            content: "•";
            color: #10b981;
            font-weight: bold;
            position: absolute;
            left: -15px;
        }
        .insight-numbered-list {
            margin: 15px 0;
            padding-left: 20px;
            page-break-inside: avoid;
        }
        .insight-numbered {
            margin: 8px 0;
            padding-left: 8px;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header-info">
            <strong>NoteIQ Enterprise</strong> - Intelligent Document Analysis Platform<br>
            Generated on: ${new Date().toLocaleString()}
        </div>
        <h1>${title}</h1>
        <div class="content">${content}</div>
        <div class="footer">
            Generated by NoteIQ Enterprise - OCR & AI Brainstorm Assistant<br>
            Powered by Google Vision API & Gemini AI
        </div>
    </div>
</body>
</html>
        `;

        // Create blob with proper MIME type for HTML
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        // Open in new window for printing to PDF
        const printWindow = window.open(url, '_blank');
        if (printWindow) {
            printWindow.onload = function() {
                // Wait a moment for styles to load, then trigger print
                setTimeout(() => {
                    printWindow.print();
                    // Close the window after printing
                    setTimeout(() => {
                        printWindow.close();
                    }, 2000);
                }, 500);
            };
        }
        
        // Clean up after a delay
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 5000);
    }

    downloadAsWord(title, content, filename) {
        // Create a properly formatted HTML document optimized for Word
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; 
            margin: 40px; 
            color: #1e293b;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            background: white;
        }
        h1 { 
            color: #1e40af; 
            border-bottom: 3px solid #1e40af; 
            padding-bottom: 15px; 
            font-size: 28px;
            margin-bottom: 30px;
        }
        h2 { 
            color: #374151; 
            margin-top: 30px; 
            font-size: 20px;
            margin-bottom: 15px;
        }
        .content { 
            background: white; 
            padding: 25px; 
            border: 1px solid #e2e8f0;
            font-size: 15px;
            line-height: 1.7;
        }
        .footer { 
            margin-top: 40px; 
            font-size: 12px; 
            color: #6b7280; 
            text-align: center; 
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
        }
        .header-info {
            background: #f1f5f9;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
            font-size: 12px;
            color: #64748b;
        }
        /* Insight formatting styles */
        .insight-title {
            color: #1e40af;
            font-size: 24px;
            font-weight: 700;
            margin: 20px 0 15px 0;
            border-bottom: 2px solid #1e40af;
            padding-bottom: 10px;
        }
        .insight-section {
            color: #374151;
            font-size: 20px;
            font-weight: 600;
            margin: 25px 0 15px 0;
            padding-left: 15px;
            border-left: 4px solid #1e40af;
        }
        .insight-header {
            color: #4b5563;
            font-size: 18px;
            font-weight: 600;
            margin: 20px 0 10px 0;
            padding-left: 10px;
            border-left: 3px solid #10b981;
        }
        .insight-paragraph {
            margin: 12px 0;
            line-height: 1.7;
            color: #374151;
        }
        .insight-bold {
            color: #1e40af;
            font-weight: 700;
        }
        .insight-list {
            margin: 15px 0;
            padding-left: 20px;
        }
        .insight-bullet {
            margin: 8px 0;
            padding-left: 8px;
            position: relative;
            line-height: 1.6;
        }
        .insight-bullet::before {
            content: "•";
            color: #10b981;
            font-weight: bold;
            position: absolute;
            left: -15px;
        }
        .insight-numbered-list {
            margin: 15px 0;
            padding-left: 20px;
        }
        .insight-numbered {
            margin: 8px 0;
            padding-left: 8px;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="header-info">
        <strong>NoteIQ Enterprise</strong> - Intelligent Document Analysis Platform<br>
        Generated on: ${new Date().toLocaleString()}
    </div>
    <h1>${title}</h1>
    <div class="content">${content}</div>
    <div class="footer">
        Generated by NoteIQ Enterprise - OCR & AI Brainstorm Assistant<br>
        Powered by Google Vision API & Gemini AI
    </div>
</body>
</html>
        `;

        // Create blob with proper MIME type for HTML (Word can open HTML files)
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename; // Keep original filename for Word
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    showDownloadSuccess(buttonId) {
        const button = document.getElementById(buttonId);
        const originalText = button.textContent;
        
        button.classList.add('downloaded');
        button.textContent = '✓ Downloaded!';
        
        setTimeout(() => {
            button.classList.remove('downloaded');
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
