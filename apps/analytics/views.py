from django.db.models import (
    Avg,
    Count,
)

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.companies.models import Company
from apps.feedback.models import Feedback

from .permissions import AnalyticsPermission


class CompanyBreakdownView(APIView):
    """
    Returns feedback analytics for every stored company.

    All authenticated roles can read this:
    ADMIN
    OWNER
    ANALYST
    VIEWER
    """

    permission_classes = [
        IsAuthenticated,
        AnalyticsPermission,
    ]

    def get(self, request):

        company_id = request.query_params.get(
            "company"
        )

        companies = Company.objects.all().order_by(
            "name"
        )

        # Optional company filter
        if company_id:

            try:
                company_id = int(company_id)

            except (TypeError, ValueError):
                return Response(
                    {
                        "detail": "Invalid company ID."
                    },
                    status=400,
                )

            companies = companies.filter(
                id=company_id
            )

        results = []

        for company in companies:

            feedback = Feedback.objects.filter(
                company_id=company.id
            )

            total_feedback = feedback.count()

            positive = feedback.filter(
                sentiment__iexact="POSITIVE"
            ).count()

            negative = feedback.filter(
                sentiment__iexact="NEGATIVE"
            ).count()

            neutral = feedback.filter(
                sentiment__iexact="NEUTRAL"
            ).count()

            processed = feedback.filter(
                is_processed=True
            ).count()

            pending = feedback.filter(
                is_processed=False
            ).count()

            rating_data = feedback.aggregate(
                average=Avg("rating")
            )

            average_rating = rating_data[
                "average"
            ]

            if average_rating is not None:
                average_rating = round(
                    float(average_rating),
                    2,
                )

            # Positive percentage
            if total_feedback > 0:
                positive_percentage = round(
                    (
                        positive
                        / total_feedback
                    ) * 100,
                    2,
                )

                negative_percentage = round(
                    (
                        negative
                        / total_feedback
                    ) * 100,
                    2,
                )
            else:
                positive_percentage = 0
                negative_percentage = 0

            # Top negative issue/category
            top_issue_data = (
                feedback
                .filter(
                    sentiment__iexact="NEGATIVE"
                )
                .exclude(
                    category__isnull=True
                )
                .exclude(
                    category__exact=""
                )
                .values("category")
                .annotate(
                    total=Count("id")
                )
                .order_by("-total")
                .first()
            )

            if top_issue_data:
                top_issue = top_issue_data[
                    "category"
                ]
            else:
                top_issue = None

            # Feature request count
            feature_requests = 0

            try:
                from apps.ai.models import (
                    FeedbackAnalysis
                )

                feature_requests = (
                    FeedbackAnalysis.objects
                    .filter(
                        feedback__company_id=company.id
                    )
                    .exclude(
                        feature_request__isnull=True
                    )
                    .exclude(
                        feature_request__exact=""
                    )
                    .count()
                )

            except Exception:
                feature_requests = 0

            results.append(
                {
                    "company_id": company.id,
                    "company_name": company.name,

                    "total_feedback":
                        total_feedback,

                    "positive":
                        positive,

                    "negative":
                        negative,

                    "neutral":
                        neutral,

                    "processed":
                        processed,

                    "pending":
                        pending,

                    "average_rating":
                        average_rating,

                    "positive_percentage":
                        positive_percentage,

                    "negative_percentage":
                        negative_percentage,

                    "top_issue":
                        top_issue,

                    "feature_requests":
                        feature_requests,
                }
            )

        return Response(results)


# ============================================================
# HELPER
# ============================================================

def get_feedback_queryset(request):
    """
    Return feedback for analytics.

    Without ?company=:
        ALL stored feedback.

    With ?company=ID:
        Feedback for that company.

    All authenticated roles can use this.
    """

    company_id = request.query_params.get("company")

    if not company_id:
        return Feedback.objects.all()

    try:
        company_id = int(company_id)
    except (TypeError, ValueError):
        return None

    return Feedback.objects.filter(
        company_id=company_id
    )


# ============================================================
# OVERVIEW
# ============================================================

class OverviewView(APIView):

    permission_classes = [
        IsAuthenticated,
        AnalyticsPermission,
    ]

    def get(self, request):

        feedback = get_feedback_queryset(request)

        # Invalid company ID
        if feedback is None:
            return Response(
                {
                    "detail": "Invalid company ID."
                },
                status=400,
            )

        total_feedback = feedback.count()

        positive = feedback.filter(
            sentiment="POSITIVE"
        ).count()

        negative = feedback.filter(
            sentiment="NEGATIVE"
        ).count()

        neutral = feedback.filter(
            sentiment="NEUTRAL"
        ).count()

        processed = feedback.filter(
            is_processed=True
        ).count()

        companies = (
            feedback
            .values("company_id")
            .distinct()
            .count()
        )

        return Response(
            {
                "total_feedback": total_feedback,
                "positive": positive,
                "negative": negative,
                "neutral": neutral,
                "processed": processed,
                "companies": companies,
            }
        )


# ============================================================
# SENTIMENT
# ============================================================

class SentimentView(APIView):

    permission_classes = [
        IsAuthenticated,
        AnalyticsPermission,
    ]

    def get(self, request):

        feedback = get_feedback_queryset(request)

        # Invalid company ID
        if feedback is None:
            return Response(
                {
                    "detail": "Invalid company ID."
                },
                status=400,
            )

        data = (
            feedback
            .values("sentiment")
            .annotate(
                total=Count("id")
            )
            .order_by("-total")
        )

        return Response(
            list(data)
        )


# ============================================================
# TOP ISSUES
# ============================================================

class TopIssuesView(APIView):

    permission_classes = [
        IsAuthenticated,
        AnalyticsPermission,
    ]

    def get(self, request):

        feedback = get_feedback_queryset(request)

        # Invalid company ID
        if feedback is None:
            return Response(
                {
                    "detail": "Invalid company ID."
                },
                status=400,
            )

        data = (
            feedback
            .filter(
                sentiment="NEGATIVE"
            )
            .values("category")
            .annotate(
                total=Count("id")
            )
            .order_by("-total")[:10]
        )

        return Response(
            list(data)
        )


# ============================================================
# FEATURE REQUESTS
# ============================================================

class FeatureRequestsView(APIView):

    permission_classes = [
        IsAuthenticated,
        AnalyticsPermission,
    ]

    def get(self, request):

        from apps.ai.models import FeedbackAnalysis

        company_id = request.query_params.get(
            "company"
        )

        # ------------------------------------------------------
        # ALL COMPANIES
        # ------------------------------------------------------

        if not company_id:

            queryset = (
                FeedbackAnalysis.objects
                .exclude(
                    feature_request=""
                )
                .order_by("-id")
            )

        # ------------------------------------------------------
        # SPECIFIC COMPANY
        # ------------------------------------------------------

        else:

            try:
                company_id = int(company_id)

            except (TypeError, ValueError):

                return Response(
                    {
                        "detail": "Invalid company ID."
                    },
                    status=400,
                )

            queryset = (
                FeedbackAnalysis.objects
                .filter(
                    feedback__company_id=company_id
                )
                .exclude(
                    feature_request=""
                )
                .order_by("-id")
            )

        # ------------------------------------------------------
        # RETURN MAXIMUM 50
        # ------------------------------------------------------

        return Response(
            [
                {
                    "feature_request": item.feature_request,
                    "feedback_id": item.feedback_id,
                }
                for item in queryset[:50]
            ]
        )


# ============================================================
# AI SUMMARY
# ============================================================

class AISummaryView(APIView):

    permission_classes = [
        IsAuthenticated,
        AnalyticsPermission,
    ]

    def get(self, request):

        feedback = get_feedback_queryset(request)

        # Invalid company ID
        if feedback is None:
            return Response(
                {
                    "detail": "Invalid company ID."
                },
                status=400,
            )

        total = feedback.count()

        positive = feedback.filter(
            sentiment="POSITIVE"
        ).count()

        negative = feedback.filter(
            sentiment="NEGATIVE"
        ).count()

        neutral = feedback.filter(
            sentiment="NEUTRAL"
        ).count()

        # ------------------------------------------------------
        # RECENT FEEDBACK
        # ------------------------------------------------------
        # IMPORTANT:
        # Filter first, slice last.
        #
        # This avoids:
        # "Cannot filter a query once a slice has been taken."
        # ------------------------------------------------------

        recent_feedback = (
            feedback
            .order_by("-created_at")[:100]
        )

        recent_count = len(
            list(recent_feedback)
        )

        # ------------------------------------------------------
        # SUMMARY
        # ------------------------------------------------------

        summary = (
            f"Recent feedback: "
            f"{positive} positive, "
            f"{negative} negative, and "
            f"{neutral} neutral items "
            f"out of {total} feedback entries. "
            f"{recent_count} recent feedback entries "
            f"were reviewed. "
            f"Review the highest-priority negative "
            f"issues first."
        )

        return Response(
            {
                "summary": summary,
                "total": total,
                "positive": positive,
                "negative": negative,
                "neutral": neutral,
                "recent_count": recent_count,
            }
        )





