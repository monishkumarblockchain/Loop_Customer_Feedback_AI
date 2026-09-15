from celery import shared_task


@shared_task
def analyze_feedback_task(feedback_id):
    from .models import Feedback

    try:
        feedback = Feedback.objects.get(id=feedback_id)
    except Feedback.DoesNotExist:
        return {
            "success": False,
            "error": "Feedback not found",
        }

    # Import AI analysis here to avoid circular imports
    try:
        from apps.ai.services import analyze_feedback

        result = analyze_feedback(
            title=feedback.title,
            content=feedback.content,
        )

        feedback.sentiment = result.get(
            "sentiment",
            feedback.sentiment,
        )

        feedback.sentiment_score = result.get(
            "sentiment_score",
            feedback.sentiment_score,
        )

        feedback.category = result.get(
            "category",
            feedback.category,
        )

        feedback.is_processed = True
        feedback.save()

        return {
            "success": True,
            "feedback_id": feedback_id,
        }

    except Exception as exc:
        feedback.is_processed = False
        feedback.save(
            update_fields=["is_processed"]
        )

        return {
            "success": False,
            "error": str(exc),
        }