from django.urls import path
from .views import health, ocr_extract
from api.views import home

urlpatterns = [
    path('', home, name='home'),
    path('health/', health, name='health'),
    path('ocr/', ocr_extract, name='ocr_extract'),
]
