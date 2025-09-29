#app.py
from flask import Flask, request, jsonify
import base64
import os
from dotenv import load_dotenv
from google.cloud import vision
import google.generativeai as genai

# Load environment variables from .env
load_dotenv()

# Get credentials from .env
service_account_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
api_key = os.getenv("GOOGLE_API_KEY")

if not service_account_path or not api_key:
    raise ValueError("Missing GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_API_KEY in .env")

# Set up Google Vision client (OCR)
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = service_account_path
vision_client = vision.ImageAnnotatorClient()

# Set up Gemini client
genai.configure(api_key=api_key)
gemini_model = genai.GenerativeModel("gemini-1.5-flash")

# Flask app
app = Flask(__name__)

@app.route("/ocr", methods=["POST"])
def ocr_handwriting():
    """
    Accepts base64 image and returns extracted text
    """
    data = request.json
    img_base64 = data.get("image_base64")
    
    if not img_base64:
        return jsonify({"error": "No image provided"}), 400
    
    image_content = base64.b64decode(img_base64)
    image = vision.Image(content=image_content)
    
    try:
        response = vision_client.document_text_detection(image=image)
        
        if response.error.message:
            return jsonify({"error": f"Vision API error: {response.error.message}"}), 500
        
        text = response.full_text_annotation.text if response.full_text_annotation else ""
        
        return jsonify({"extracted_text": text})
    except Exception as e:
        return jsonify({"error": f"OCR processing failed: {str(e)}"}), 500

@app.route("/enrich", methods=["POST"])
def enrich_text():
    """
    Accepts text and returns enriched summary and insights
    """
    data = request.json
    text = data.get("text")
    
    if not text:
        return jsonify({"error": "No text provided"}), 400

    # Generate enriched content using Gemini
    try:
        prompt = f"""
        You are NoteIQ. Summarize the following brainstorm notes, 
        extract key themes, and suggest 2-3 actionable insights:

        {text}
        """
        response = gemini_model.generate_content(prompt)
        
        if not response or not response.text:
            return jsonify({"error": "Failed to generate enriched content"}), 500
            
        enriched = response.text

        return jsonify({
            "original_text": text,
            "enriched_output": enriched
        })
    except Exception as e:
        return jsonify({"error": f"Content enrichment failed: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)