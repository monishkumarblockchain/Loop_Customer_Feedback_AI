from django.urls import path

from .views import AnalyticsChatbotView

urlpatterns = [
    path("chat/", AnalyticsChatbotView.as_view(), name="analytics-chat"),
]
