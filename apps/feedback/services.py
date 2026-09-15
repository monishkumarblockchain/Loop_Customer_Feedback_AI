import logging

from .tasks import analyze_feedback_task

logger = logging.getLogger(__name__)


def queue_feedback_analysis(feedback_id):
    try:
        analyze_feedback_task.delay(feedback_id)

    except Exception as exc:
        logger.warning(
            "Could not queue AI analysis for feedback %s: %s",
            feedback_id,
            exc,
        )
        return False

    return True