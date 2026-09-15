"""
LOOP chatbot domain tools.

All tools are READ-ONLY.

They access:

- Django/PostgreSQL analytics
- PostgreSQL feedback search

IMPORTANT:

Every tool returns a JSON STRING.

This is required so LangChain/Groq receives
tool-message content as text.

The current implementation intentionally does NOT
load SentenceTransformer or PyTorch.
"""

import json
from typing import List, Optional

from langchain_core.tools import tool

from . import services
from apps.chatbot.vectorstore import search_feedback_database


# =========================================================
# CONSTANTS
# =========================================================

DEFAULT_LIMIT = 8
MAX_LIMIT = 20
MAX_COMPANIES = 10


# =========================================================
# JSON HELPER
# =========================================================

def _json_result(data) -> str:
    """
    Convert Python data into JSON text.
    """

    return json.dumps(
        data,
        ensure_ascii=False,
        default=str,
        separators=(",", ":"),
    )


# =========================================================
# LIMIT HELPER
# =========================================================

def _safe_limit(
    limit: int,
    default: int = DEFAULT_LIMIT,
) -> int:
    """
    Keep tool result sizes controlled.
    """

    try:
        value = int(limit)
    except (TypeError, ValueError):
        return default

    if value < 1:
        return 1

    return min(value, MAX_LIMIT)


# =========================================================
# SATISFACTION STATISTICS
# =========================================================

@tool
def get_satisfaction_stats(
    company_id: Optional[int] = None,
) -> str:
    """
    Get customer satisfaction analytics.

    Use for:
    - satisfaction
    - ratings
    - sentiment
    - feedback count
    - positive percentage
    - negative percentage
    - neutral percentage
    - average rating
    - company performance
    """

    try:
        result = services.get_company_analytics(
            company_id=company_id,
        )

        return _json_result(result)

    except Exception as exc:
        return _json_result(
            {
                "error": "Unable to retrieve satisfaction statistics.",
                "results": [],
                "details": str(exc),
            }
        )


# =========================================================
# TOP ISSUES
# =========================================================

@tool
def get_top_issues(
    company_id: Optional[int] = None,
    limit: int = 10,
) -> str:
    """
    Get the most common customer issues.

    Use for:
    - biggest problems
    - complaints
    - recurring problems
    - customer pain points
    - negative feedback themes
    """

    limit = _safe_limit(
        limit,
        default=10,
    )

    try:
        analytics = services.get_company_analytics(
            company_id=company_id,
        )

        result = analytics.get(
            "top_issues",
            [],
        )

        if not isinstance(result, list):
            result = []

        return _json_result(
            result[:limit]
        )

    except Exception as exc:
        return _json_result(
            {
                "error": "Unable to retrieve top issues.",
                "results": [],
                "details": str(exc),
            }
        )


# =========================================================
# FEATURE REQUESTS
# =========================================================

@tool
def get_feature_requests(
    company_id: Optional[int] = None,
    limit: int = 10,
) -> str:
    """
    Get customer feature requests.

    Use for:
    - requested features
    - customer wants
    - product improvements
    - feature ideas
    - missing functionality
    """

    limit = _safe_limit(
        limit,
        default=10,
    )

    try:
        result = services.get_feature_requests(
            company_id=company_id,
            limit=limit,
        )

        if not isinstance(result, list):
            result = []

        return _json_result(
            result[:limit]
        )

    except Exception as exc:
        return _json_result(
            {
                "error": "Unable to retrieve feature requests.",
                "results": [],
                "details": str(exc),
            }
        )


# =========================================================
# COMPANY COMPARISON
# =========================================================

@tool
def compare_companies(
    company_ids: List[int],
) -> str:
    """
    Compare multiple companies using LOOP analytics.
    """

    if not company_ids:
        return _json_result(
            {
                "error": "No company IDs were provided.",
                "results": [],
            }
        )

    try:
        normalized_ids = []

        for company_id in company_ids:
            try:
                normalized_ids.append(
                    int(company_id)
                )
            except (TypeError, ValueError):
                continue

        if not normalized_ids:
            return _json_result(
                {
                    "error": "No valid company IDs were provided.",
                    "results": [],
                }
            )

        unique_ids = list(
            dict.fromkeys(
                normalized_ids
            )
        )

        unique_ids = unique_ids[:MAX_COMPANIES]

        result = []

        for company_id in unique_ids:

            analytics = services.get_company_analytics(
                company_id=company_id,
            )

            result.append(
                {
                    "company_id": company_id,
                    **analytics,
                }
            )

        return _json_result(result)

    except Exception as exc:
        return _json_result(
            {
                "error": "Company comparison failed.",
                "results": [],
                "details": str(exc),
            }
        )


# =========================================================
# COMPANY LOOKUP
# =========================================================

@tool
def list_companies() -> str:
    """
    List available companies.

    Use when:
    - company name must be converted to company_id
    - user asks about available companies
    - companies need to be compared
    """

    try:
        from apps.companies.models import Company

        companies = (
            Company.objects
            .only(
                "id",
                "name",
            )
            .order_by("name")
        )

        result = [
            {
                "company_id": company.id,
                "company_name": company.name,
            }
            for company in companies
        ]

        return _json_result(result)

    except Exception as exc:
        return _json_result(
            {
                "error": "Unable to retrieve companies.",
                "results": [],
                "details": str(exc),
            }
        )


# =========================================================
# FEEDBACK SEARCH
# =========================================================

@tool
def search_feedback(
    query: str,
    company_id: Optional[int] = None,
    limit: int = DEFAULT_LIMIT,
) -> str:
    """
    Search LOOP customer feedback.

    Use for:

    - customer complaints
    - specific feedback
    - product problems
    - customer comments
    - reasons for dissatisfaction
    - return problems
    - refund problems
    - delivery problems
    - application problems
    - product quality problems
    - feature requests
    - customer wants
    - customer opinions
    - feedback examples

    Searches PostgreSQL directly.
    """

    query = (query or "").strip()

    if not query:
        return _json_result(
            {
                "error": "Search query cannot be empty.",
                "results": [],
            }
        )

    limit = _safe_limit(
        limit,
        default=DEFAULT_LIMIT,
    )

    try:

        results = search_feedback_database(
            query=query,
            company_id=company_id,
            limit=limit,
        )

        if not isinstance(results, list):
            results = []

        return _json_result(
            {
                "query": query,
                "company_id": company_id,
                "count": len(results),
                "results": results,
            }
        )

    except Exception as exc:

        return _json_result(
            {
                "error": "Feedback search failed.",
                "query": query,
                "company_id": company_id,
                "count": 0,
                "results": [],
                "details": str(exc),
            }
        )


# =========================================================
# DOMAIN TOOLS
# =========================================================

DOMAIN_TOOLS = [
    get_satisfaction_stats,
    get_top_issues,
    get_feature_requests,
    compare_companies,
    list_companies,
    search_feedback,
]