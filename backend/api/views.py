from django.shortcuts import render

# Create your views here.
from django.http import JsonResponse

from django.http import JsonResponse

def home(request):
    return JsonResponse({
        "message": "OmniVision Backend Running",
        "status": "ok"
    })


def health(request):
    return JsonResponse({"status": "ok", "service": "omni_backend"})
