# NoteIQ Enterprise - OCR and AI Enrichment Platform

An intelligent enterprise-grade document analysis platform that uses Google Vision API for OCR and Google Gemini AI for advanced text enrichment, insights, and professional document generation.

## 🚀 Features

### Core Capabilities
- **📄 OCR Processing**: Extract text from handwritten notes and images using Google Vision API
- **🧠 AI Enrichment**: Generate comprehensive summaries, insights, and actionable recommendations using Google Gemini 2.5
- **🎨 Visual Analysis**: Advanced image analysis with object, label, face, landmark, and logo detection
- **📊 Professional Insights**: Formatted markdown-to-HTML conversion for readable, enterprise-grade insights
- **📥 Document Export**: Download results as PDF or Word documents with full formatting
- **📋 Enhanced Copy**: Copy formatted content to clipboard with preserved styling
- **🎯 Enterprise UI**: Professional, corporate-grade interface with status indicators and processing steps

### Chrome Extension Features
- **🪟 Full Window Interface**: Opens as a normal Chrome window for better user experience
- **📤 Image Upload**: Drag & drop or click to upload images (PNG, JPEG, JPG, GIF, BMP, WEBP)
- **⚡ Real-time Processing**: Live OCR and AI analysis with progress indicators
- **💼 Enterprise Branding**: Professional NoteIQ Enterprise interface
- **📄 PDF/Word Downloads**: Generate professional documents directly from the extension
- **🔄 Auto-refresh**: Automatic updates as analysis completes

## 🎯 API Endpoints

### OCR Endpoint
```
POST /ocr
Content-Type: application/json

{
    "image_base64": "base64_encoded_image_data"
}
```

**Response:**
```json
{
    "extracted_text": "Recognized text from the image",
    "visual_analysis": {
        "objects": [...],
        "labels": [...],
        "faces": [...],
        "landmarks": [...],
        "logos": [...],
        "shapes": [...],
        "mood": "...",
        "visual_summary": "..."
    }
}
```

### Enrichment Endpoint
```
POST /enrich
Content-Type: application/json

{
    "text": "Text to be enriched",
    "visual_analysis": {...}
}
```

**Response:**
```json
{
    "original_text": "Original input text",
    "enriched_output": "AI-generated comprehensive analysis with insights, recommendations, and key sentences"
}
```

## 📦 Setup

### Prerequisites
- Python 3.9+
- Google Cloud Vision API credentials
- Google Gemini API key (for Gemini 2.5 Flash)
- Chrome browser (for extension)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/ScarlettQiu/NoteIQ-OCR-Enriched-Brainstorm-Search.git
cd NoteIQ-OCR-Enriched-Brainstorm-Search
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Set up environment variables:**
Create a `.env` file:
```
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account.json
GOOGLE_API_KEY=your_gemini_api_key
```

4. **Run the Flask server:**
```bash
python app.py
```

The server will start on `http://localhost:5001`

## 🖥️ Chrome Extension Setup

### Installation Steps

1. **Start the Flask API**:
```bash
python app.py
```
Make sure it's running on `http://localhost:5001`

2. **Install Extension in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select this project directory
   - The NoteIQ Enterprise extension will appear in your extensions list

3. **Use the Extension**:
   - Click the NoteIQ icon in your Chrome toolbar
   - A full window will open with the enterprise interface
   - Upload an image (PNG, JPEG, JPG, GIF, BMP, WEBP)
   - Wait for OCR and AI analysis
   - View formatted insights
   - Copy or download results as PDF/Word

### Supported File Formats
- ✅ **PNG, JPEG, JPG, GIF, BMP, WEBP**
- ❌ **PDF files are NOT supported** (image formats only)
- **Maximum file size**: 10MB

### Extension Features

#### 📊 AI Insights Display
- **Formatted Output**: Beautiful markdown-to-HTML conversion
- **Color-coded Sections**: Visual hierarchy with professional styling
- **Key Sentences**: Highlighted important information
- **Actionable Recommendations**: Clear next steps and insights

#### 📥 Download Options
- **PDF Download**: Generates print-ready PDF via browser print dialog
- **Word Download**: Creates HTML document that opens in Microsoft Word
- **Complete Reports**: Executive-ready documents with timestamps and metadata
- **Preserved Formatting**: All styling and colors maintained in downloads

#### 📋 Copy Functionality
- **Rich Text Copy**: Preserves formatting when pasting
- **HTML Format**: Compatible with Word, Google Docs, and other editors
- **Visual Feedback**: Success indicators when copying

## 🧪 Testing

### Test OCR with an image:
```bash
python test_ocr.py your_image.jpg
```

### Convert image to base64:
```bash
python convert_image.py your_image.jpg
```

### Test with Jupyter Notebook:
```bash
jupyter notebook test_notebook.ipynb
```

## 📁 Project Structure

```
├── app.py                 # Main Flask application with Gemini AI integration
├── app_simple.py         # Simplified Flask app for testing
├── test_ocr.py           # OCR testing script
├── convert_image.py      # Image to base64 converter
├── test_notebook.ipynb   # Jupyter notebook for testing
├── requirements.txt      # Python dependencies
├── .env                  # Environment variables (not in repo)
├── .gitignore           # Git ignore rules
├── .cursorignore        # Cursor IDE ignore rules
├── LICENSE               # MIT License
├── README.md            # This file
│
├── Chrome Extension Files:
├── manifest.json         # Extension configuration (Manifest V3)
├── popup.html            # Extension UI (Enterprise design)
├── popup.css             # Professional styling
├── popup.js              # Extension functionality (PDF/Word downloads, formatting)
├── background.js         # Background service worker
├── content.js            # Content script for web pages
└── icons/                # Extension icons (16, 32, 48, 128px)
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

## 🔧 Technologies Used

### Backend
- **Flask**: Web framework for RESTful API
- **Google Vision API**: OCR and advanced image analysis
- **Google Gemini 2.5 Flash**: AI-powered text enrichment and insights
- **Python 3.9+**: Backend language
- **Base64**: Image encoding for API transmission

### Frontend
- **Chrome Extension API**: Manifest V3
- **JavaScript (ES6+)**: Extension functionality
- **HTML5/CSS3**: Enterprise-grade UI
- **Markdown-to-HTML**: Content formatting

### Document Generation
- **Browser Print API**: PDF generation
- **HTML Export**: Word document compatibility
- **CSS Print Styles**: Professional page layouts

## ✨ Key Features

### 🤖 AI-Powered Analysis
- **Comprehensive Insights**: Deep analysis of extracted text
- **Visual Context Integration**: Combines OCR text with image analysis
- **Key Sentence Identification**: Highlights important information
- **Actionable Recommendations**: Clear next steps and strategic insights

### 📄 Professional Documents
- **PDF Generation**: Print-ready documents with proper page breaks
- **Word Compatibility**: HTML format that opens seamlessly in Word
- **Enterprise Styling**: Professional formatting and branding
- **Timestamped Reports**: Automatic metadata and generation dates

### 🎨 Enterprise UI
- **Modern Design**: Clean, professional interface
- **Status Indicators**: Real-time processing feedback
- **Processing Steps**: Visual progress indicators
- **Responsive Layout**: Works on different screen sizes
- **Scrollable Window**: Normal Chrome window with scrolling

## 📝 Usage Examples

### Basic OCR and Enrichment
1. Upload an image through the Chrome extension
2. Wait for OCR processing
3. View extracted text and visual analysis
4. Get AI-powered insights and recommendations
5. Copy or download results

### Document Generation
1. After analysis, click "PDF" or "Word" button
2. For PDF: Browser print dialog will open - select "Save as PDF"
3. For Word: File downloads as HTML - open in Microsoft Word
4. All formatting and styling preserved

### Advanced Analysis
- Visual elements (objects, labels, faces) are detected
- Combined with text analysis for comprehensive insights
- Key sentences are identified and highlighted
- Strategic recommendations provided

## 🔐 Security & Privacy

- **Local Processing**: All processing happens on your machine (OCR via API)
- **No Data Storage**: Images and text are processed in real-time
- **API Keys**: Stored in `.env` file (not committed to repo)
- **Chrome Extension**: Runs locally, connects to your Flask server

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Feel free to submit issues and pull requests to improve this project!

## 🙏 Acknowledgments

- Google Vision API for OCR capabilities
- Google Gemini AI for advanced text enrichment
- Flask for the web framework
- Chrome Extension APIs for browser integration

---

**NoteIQ Enterprise** - Intelligent Document Analysis Platform  
*Powered by Google Vision API & Gemini AI*
