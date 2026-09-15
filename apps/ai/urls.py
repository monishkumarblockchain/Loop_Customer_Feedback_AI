from django.urls import path
from .views import AnalysisDetailView
urlpatterns = [path("<int:pk>/", AnalysisDetailView.as_view())]
