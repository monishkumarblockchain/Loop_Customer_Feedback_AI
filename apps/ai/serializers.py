from rest_framework import serializers
from .models import FeedbackAnalysis

class FeedbackAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeedbackAnalysis
        fields = "__all__"
