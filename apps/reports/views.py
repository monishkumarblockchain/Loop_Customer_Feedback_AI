from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .generators.csv import feedback_csv
from .generators.pdf import feedback_pdf

class FeedbackCSVView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        return feedback_csv(request.query_params.get("company"))

class FeedbackPDFView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        return feedback_pdf(request.query_params.get("company"))
