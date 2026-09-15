import csv
from django.http import HttpResponse
from apps.feedback.models import Feedback

def feedback_csv(company_id):
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="loop-feedback-{company_id}.csv"'
    writer = csv.writer(response)
    writer.writerow(["id","title","content","rating","sentiment","priority","category","created_at"])
    for f in Feedback.objects.filter(company_id=company_id):
        writer.writerow([f.id,f.title,f.content,f.rating,f.sentiment,f.priority,f.category,f.created_at.isoformat()])
    return response
