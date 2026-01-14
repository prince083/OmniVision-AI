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
import re

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def home(request):
    return JsonResponse({"message": "OmniVision Backend - Day 4 Complete", "status": "ok"})

def health(request):
    return JsonResponse({"status": "ok", "service": "omni_backend"})

@csrf_exempt
def ocr_extract(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    
    try:
        data = json.loads(request.body)
        image_b64 = data.get("image")
        
        if not image_b64:
            return JsonResponse({"error": "No image provided"}, status=400)
        
        if "," in image_b64:
            image_b64 = image_b64.split(",")[1]
        
        image_bytes = base64.b64decode(image_b64)
        original_image = Image.open(io.BytesIO(image_bytes))
        original_image.save("ocr_input_original.png")
        
        # Simple preprocessing
        img_array = np.array(original_image)
        if len(img_array.shape) == 3:
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        else:
            gray = img_array
        
        # Detect dark background
        avg_brightness = np.mean(gray)
        if avg_brightness < 127:
            gray = 255 - gray
        
        # Light enhancement
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        enhanced = clahe.apply(gray)
        
        # Sharpening
        kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
        sharpened = cv2.filter2D(enhanced, -1, kernel)
        
        ocr_image = Image.fromarray(sharpened)
        ocr_image.save("ocr_input_processed.png")
        
        try:
            # PSM 3: Automatic page segmentation for documents
            config = r'--oem 3 --psm 3 -c preserve_interword_spaces=1'
            text = pytesseract.image_to_string(ocr_image, config=config)
            
            print(f"OCR completed. Length: {len(text)}")
            
            # Basic cleanup
            text = re.sub(r'\n\n\n+', '\n\n', text)
            text = re.sub(r' +', ' ', text)
            
            if not text.strip():
                text = "No text detected"
            
            return JsonResponse({
                "text": text.strip(),
                "confidence": 1.0,
                "engine": "Tesseract OCR"
            })
            
        except Exception as ocr_error:
            print(f"OCR error: {ocr_error}")
            import traceback
            traceback.print_exc()
            return JsonResponse({"error": str(ocr_error)}, status=500)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)
