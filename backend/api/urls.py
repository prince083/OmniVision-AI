from django.urls import path
from .views import health
from api.views import home

urlpatterns = [
    path('', home, name='home'),
    path('health/', health, name='health'),
]