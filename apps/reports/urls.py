from django.urls import path
from .views import FeedbackCSVView, FeedbackPDFView
urlpatterns = [
    path("feedback.csv", FeedbackCSVView.as_view()),
    path("feedback.pdf", FeedbackPDFView.as_view()),
]
