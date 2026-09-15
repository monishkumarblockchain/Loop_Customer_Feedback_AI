from django.db import models
from apps.feedback.models import Feedback

class FeedbackAnalysis(models.Model):
    feedback = models.OneToOneField(Feedback, on_delete=models.CASCADE, related_name="analysis")
    sentiment = models.CharField(max_length=20)
    sentiment_score = models.FloatField(default=0)
    emotion = models.CharField(max_length=80, blank=True)
    topics = models.JSONField(default=list, blank=True)
    keywords = models.JSONField(default=list, blank=True)
    summary = models.TextField(blank=True)
    complaint = models.TextField(blank=True)
    feature_request = models.TextField(blank=True)
    priority = models.CharField(max_length=20, default="MEDIUM")
    confidence = models.FloatField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
