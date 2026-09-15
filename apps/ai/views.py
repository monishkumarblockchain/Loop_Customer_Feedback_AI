from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import FeedbackAnalysis
from .serializers import FeedbackAnalysisSerializer

class AnalysisDetailView(generics.RetrieveAPIView):
    queryset = FeedbackAnalysis.objects.select_related("feedback")
    serializer_class = FeedbackAnalysisSerializer
    permission_classes = [IsAuthenticated]
