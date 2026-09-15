from django.db import models
class Report(models.Model):
    company_id = models.PositiveBigIntegerField()
    report_type = models.CharField(max_length=80)
    file_path = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
