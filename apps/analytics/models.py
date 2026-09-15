from django.db import models
class AnalyticsSnapshot(models.Model):
    company_id = models.PositiveBigIntegerField()
    date = models.DateField()
    total_feedback = models.PositiveIntegerField(default=0)
    positive = models.PositiveIntegerField(default=0)
    neutral = models.PositiveIntegerField(default=0)
    negative = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
