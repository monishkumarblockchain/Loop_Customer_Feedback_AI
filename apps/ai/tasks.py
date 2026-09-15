from celery import shared_task
from django.db import transaction
from .models import FeedbackAnalysis
from .services.sentiment import analyze_sentiment
from .services.classifier import classify_feedback
from .services.feature_extractor import extract_feature_request
from .services.issue_detector import detect_priority
from .services.summarizer import summarize
from apps.feedback.models import Feedback

@shared_task
def analyze_feedback_task(feedback_id):
    try:
        feedback = Feedback.objects.get(pk=feedback_id)
    except Feedback.DoesNotExist:
        return {"ok": False, "error": "Feedback not found"}

    text = f"{feedback.title}. {feedback.content}"
    sentiment, score = analyze_sentiment(text)
    category = classify_feedback(text)
    feature_request = extract_feature_request(text)
    priority = detect_priority(sentiment, feedback.rating, text)

    analysis, _ = FeedbackAnalysis.objects.update_or_create(
        feedback=feedback,
        defaults={
            "sentiment": sentiment,
            "sentiment_score": score,
            "topics": [category],
            "keywords": [w.strip(".,!?") for w in text.lower().split() if len(w.strip(".,!?")) > 4][:10],
            "summary": summarize(text),
            "complaint": feedback.content if sentiment == "NEGATIVE" else "",
            "feature_request": feature_request,
            "priority": priority,
            "confidence": score,
        },
    )

    feedback.sentiment = sentiment
    feedback.sentiment_score = score
    feedback.category = category
    feedback.priority = priority
    feedback.is_processed = True
    feedback.save(update_fields=["sentiment", "sentiment_score", "category", "priority", "is_processed", "updated_at"])

    from apps.notifications.services import broadcast_company_event
    broadcast_company_event(feedback.company_id, {
        "event": "analysis.completed",
        "feedback_id": feedback.id,
        "sentiment": sentiment,
        "priority": priority,
    })

    return {"ok": True, "feedback_id": feedback.id, "sentiment": sentiment}
