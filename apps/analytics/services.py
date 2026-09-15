from django.db.models import Avg, Count
from apps.feedback.models import Feedback

def company_feedback(company_id):
    return Feedback.objects.filter(company_id=company_id)

def overview(company_id):
    qs = company_feedback(company_id)
    counts = qs.values("sentiment").annotate(total=Count("id"))
    data = {"total_feedback": qs.count(), "positive": 0, "neutral": 0, "negative": 0,
            "average_rating": round(qs.aggregate(v=Avg("rating"))["v"] or 0, 2)}
    for row in counts:
        key = row["sentiment"].lower()
        if key in data:
            data[key] = row["total"]
    return data
