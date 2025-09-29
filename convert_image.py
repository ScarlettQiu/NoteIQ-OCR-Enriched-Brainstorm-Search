#!/usr/bin/env python3
"""
Convert image to base64 for testing
Usage: python convert_image.py your_image.jpg
"""

import base64
import sys
import os

def convert_to_base64(image_path):
    """Convert image to base64 string"""
    
    if not os.path.exists(image_path):
        print(f"Error: Image file '{image_path}' not found!")
        return None
    
    try:
        with open(image_path, 'rb') as img_file:
            img_base64 = base64.b64encode(img_file.read()).decode('utf-8')
        
        print(f"✅ Successfully converted '{image_path}' to base64")
        print(f"Base64 length: {len(img_base64)} characters")
        print("\nBase64 string (first 100 chars):")
        print(img_base64[:100] + "...")
        
        # Save to file for easy copying
        with open('image_base64.txt', 'w') as f:
            f.write(img_base64)
        print(f"\n💾 Full base64 saved to 'image_base64.txt'")
        
        return img_base64
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python convert_image.py <image_path>")
        print("Example: python convert_image.py my_handwriting.jpg")
        sys.exit(1)
    
    image_path = sys.argv[1]
    convert_to_base64(image_path)
