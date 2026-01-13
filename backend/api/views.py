from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import base64
import numpy as np
import cv2
from PIL import Image
import pytesseract
import io

# Configure Tesseract path for Windows
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def home(request):
    return JsonResponse({
        "message": "OmniVision Backend Running - Using Tesseract OCR",
        "status": "ok"
    })

def health(request):
    return JsonResponse({"status": "ok", "service": "omni_backend"})

@csrf_exempt
def ocr_extract(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    
    try:
        # Parse request
        data = json.loads(request.body)
        image_b64 = data.get("image")
        
        if not image_b64:
            return JsonResponse({"error": "No image provided"}, status=400)
        
        # Decode image
        if "," in image_b64:
            image_b64 = image_b64.split(",")[1]
        
        image_bytes = base64.b64decode(image_b64)
        
        # Use PIL to load image (Tesseract works better with PIL)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Save for debugging
        image.save("ocr_input.png")
        print(f"Saved ocr_input.png - Size: {image.size}, Mode: {image.mode}")
        
        # Run Tesseract OCR
        try:
            text = pytesseract.image_to_string(image)
            print(f"OCR completed. Extracted text length: {len(text)}")
            print(f"Text: {text[:200]}")  # Print first 200 chars
            
            if not text or not text.strip():
                text = "No text detected"
            
            return JsonResponse({
                "text": text.strip(),
                "confidence": 1.0,
                "engine": "Tesseract OCR"
            })
            
        except Exception as ocr_error:
            print(f"Tesseract error: {type(ocr_error).__name__}: {ocr_error}")
            import traceback
            traceback.print_exc()
            return JsonResponse({
                "error": f"Tesseract error: {str(ocr_error)}. Make sure Tesseract is installed on your system."
            }, status=500)
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print("ERROR:", error_details)
        return JsonResponse({
            "error": f"{type(e).__name__}: {str(e)}"
        }, status=500)
