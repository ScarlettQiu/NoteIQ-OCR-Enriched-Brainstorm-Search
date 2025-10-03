# NoteIQ - OCR and AI Enrichment App

An intelligent note-taking application that uses Google Vision API for OCR and Google Gemini AI for text enrichment and insights.

## Features

- **OCR Processing**: Extract text from handwritten notes using Google Vision API
- **AI Enrichment**: Generate summaries, insights, and actionable items using Google Gemini
- **RESTful API**: Easy-to-use endpoints for integration
- **Error Handling**: Robust error handling and validation

## API Endpoints

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
    "extracted_text": "Recognized text from the image"
}
```

### Enrichment Endpoint
```
POST /enrich
Content-Type: application/json

{
    "text": "Text to be enriched"
}
```

**Response:**
```json
{
    "original_text": "Original input text",
    "enriched_output": "AI-generated summary and insights"
}
```

## Setup

### Prerequisites
- Python 3.9+
- Google Cloud Vision API credentials
- Google Gemini API key

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/YOUR_USERNAME/NoteIQ-OCR-Enriched-Brainstorm-Search.git
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

4. **Run the application:**
```bash
python app.py
```

The server will start on `http://localhost:5001`

## Testing

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

## Chrome Extension Setup

### Prerequisites
1. **Start the Flask API**:
```bash
python app_simple.py &
```

2. **Install Extension in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)
   - Click "Load unpacked"
   - Select this project folder
   - The NoteIQ extension should appear in your extensions

### Extension Features
- **Popup Interface**: Click the extension icon to open the OCR interface
- **Image Upload**: Drag & drop or click to upload images
- **Real-time Processing**: Uses your Flask API for OCR and AI enrichment
- **Content Script**: Can extract text from web pages and process images

### Extension Usage
1. Click the NoteIQ icon in your Chrome toolbar
2. Upload an image of handwritten notes
3. View extracted text and AI insights
4. Copy results to clipboard

**Note**: Make sure your Flask API is running on `http://localhost:5001` for the extension to work.

## Project Structure

```
├── app.py                 # Main Flask application
├── app_simple.py         # Simplified Flask app with real API integration
├── test_ocr.py           # OCR testing script
├── convert_image.py      # Image to base64 converter
├── test_notebook.ipynb   # Jupyter notebook for testing
├── requirements.txt      # Python dependencies
├── .env                  # Environment variables (not in repo)
├── .gitignore           # Git ignore rules
├── LICENSE               # MIT License
├── README.md            # This file
│
├── Chrome Extension Files:
├── manifest.json         # Extension configuration
├── popup.html           # Extension popup UI
├── popup.css            # Popup styling
├── popup.js             # Popup functionality
├── background.js        # Background service worker
├── content.js           # Content script for web pages
└── icons/               # Extension icons (16, 32, 48, 128px)
```

## Technologies Used

- **Flask**: Web framework
- **Google Vision API**: OCR processing
- **Google Gemini AI**: Text enrichment
- **Python**: Backend language
- **Base64**: Image encoding

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Feel free to submit issues and pull requests to improve this project!
