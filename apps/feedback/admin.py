from django.contrib import admin
from .models import Feedback

@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ("title", "company", "product", "rating", "sentiment", "priority", "status", "is_processed")
    list_filter = ("sentiment", "priority", "status", "category")
    search_fields = ("title", "content")
