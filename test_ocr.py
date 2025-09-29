#!/usr/bin/env python3
"""
Test script for OCR endpoint
Usage: python test_ocr.py path/to/your/image.jpg
"""

import base64
import requests
import json
import sys
import os

def test_ocr(image_path):
    """Test the OCR endpoint with a real image"""
    
    # Check if image file exists
    if not os.path.exists(image_path):
        print(f"Error: Image file '{image_path}' not found!")
        return
    
    try:
        # Read and encode the image
        print(f"Reading image: {image_path}")
        with open(image_path, 'rb') as img_file:
            img_base64 = base64.b64encode(img_file.read()).decode('utf-8')
        
        # Send POST request to OCR endpoint
        print("Sending request to OCR endpoint...")
        url = 'http://localhost:5003/ocr'
        data = {'image_base64': img_base64}
        
        response = requests.post(url, json=data)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ OCR Success!")
            print(f"Extracted Text:\n{result['extracted_text']}")
        else:
            print("❌ OCR Failed!")
            print(f"Error: {response.json()}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to server. Make sure Flask app is running on port 5001")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def test_enrich(text):
    """Test the enrich endpoint with text"""
    
    try:
        print(f"Testing enrich with text: '{text[:50]}...'")
        url = 'http://localhost:5001/enrich'
        data = {'text': text}
        
        response = requests.post(url, json=data)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Enrich Success!")
            print(f"Enriched Output:\n{result['enriched_output']}")
        else:
            print("❌ Enrich Failed!")
            print(f"Error: {response.json()}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to server. Make sure Flask app is running on port 5001")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_ocr.py <image_path>")
        print("Example: python test_ocr.py my_handwriting.jpg")
        sys.exit(1)
    
    image_path = sys.argv[1]
    test_ocr(image_path)
