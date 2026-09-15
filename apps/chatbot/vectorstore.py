"""
LOOP Feedback Search
====================

Customer-feedback search for LOOP Analytics AI.

Architecture
------------

User
  |
  v
Chatbot Agent
  |
  v
search_feedback_database()
  |
  v
Django ORM
  |
  v
PostgreSQL
  |
  v
Feedback records

IMPORTANT
---------

This implementation intentionally does NOT use:

- SentenceTransformer
- PyTorch
- HuggingFaceEmbeddings
- LangChain PGVector
- similarity_search()

PostgreSQL/Django ORM remains the source of truth.

The function returns normal Python dictionaries.

tools.py is responsible for converting the result into JSON
strings before sending results to LangChain/Groq.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from django.db.models import Q


# ============================================================
# CONSTANTS
# ============================================================

DEFAULT_LIMIT = 8
MAX_LIMIT = 20
MAX_QUERY_LENGTH = 300


# ============================================================
# GENERIC / STOP WORDS
# ============================================================

STOP_WORDS = {
    "what",
    "what's",
    "whats",
    "are",
    "is",
    "the",
    "a",
    "an",
    "of",
    "to",
    "for",
    "about",
    "me",
    "give",
    "tell",
    "show",
    "please",
    "can",
    "could",
    "would",
    "you",
    "we",
    "our",
    "your",
    "their",
    "this",
    "that",
    "these",
    "those",
    "from",
    "with",
    "into",
    "on",
    "in",
    "at",
    "by",
    "and",
    "or",
    "do",
    "does",
    "did",
    "should",
    "main",
    "top",
    "details",
    "detail",
    "information",
    "customers",
    "customer",
    "feedback",
    "reviews",
    "review",
    "data",
    "available",
}


# ============================================================
# INTENT KEYWORDS
# ============================================================

BROAD_FEEDBACK_WORDS = {
    "complaint",
    "complaints",
    "problem",
    "problems",
    "issue",
    "issues",
    "negative",
    "positives",
    "positive",
    "neutral",
    "return",
    "returns",
    "refund",
    "refunds",
    "delivery",
    "deliveries",
    "quality",
    "improve",
    "improvement",
    "improvements",
    "waste",
    "feature",
    "features",
    "request",
    "requests",
    "recommendation",
    "recommendations",
    "satisfaction",
    "rating",
    "ratings",
    "experience",
    "experiences",
    "product",
    "products",
}


# ============================================================
# LIMIT HELPER
# ============================================================

def _safe_limit(
    limit: int,
    default: int = DEFAULT_LIMIT,
) -> int:
    """
    Safely normalize the result limit.
    """

    try:
        value = int(limit)
    except (TypeError, ValueError):
        value = default

    if value < 1:
        return 1

    return min(value, MAX_LIMIT)


# ============================================================
# QUERY NORMALIZATION
# ============================================================

def _normalize_query(
    query: str,
) -> str:
    """
    Normalize the user's chatbot search query.
    """

    query = (query or "").strip()

    if not query:
        return ""

    return query[:MAX_QUERY_LENGTH]


# ============================================================
# SEARCH TERM BUILDER
# ============================================================

def _build_search_terms(
    query: str,
) -> List[str]:
    """
    Convert a natural-language query into meaningful
    search terms.

    Example:

        "What are the main return and refund problems?"

    becomes approximately:

        ["return", "refund", "problems"]

    Generic words such as "what", "are", "customer",
    and "feedback" are ignored.
    """

    terms: List[str] = []

    for word in query.lower().split():

        word = (
            word
            .strip()
            .strip(".,!?;:'\"()[]{}")
        )

        if not word:
            continue

        if len(word) < 2:
            continue

        if word in STOP_WORDS:
            continue

        if word not in terms:
            terms.append(word)

    return terms


# ============================================================
# FEEDBACK SERIALIZER
# ============================================================

def _serialize_feedback(
    feedback,
) -> Dict[str, Any]:
    """
    Convert a Feedback Django model into a
    chatbot-friendly dictionary.
    """

    company = getattr(
        feedback,
        "company",
        None,
    )

    product = getattr(
        feedback,
        "product",
        None,
    )

    user = getattr(
        feedback,
        "user",
        None,
    )

    created_at = getattr(
        feedback,
        "created_at",
        None,
    )

    return {
        "feedback_id": feedback.id,

        "company_id": (
            feedback.company_id
        ),

        "company": (
            company.name
            if company
            else None
        ),

        "product_id": (
            feedback.product_id
            if getattr(
                feedback,
                "product_id",
                None,
            )
            else None
        ),

        "product": (
            product.name
            if product
            else None
        ),

        "title": (
            feedback.title
            or ""
        ),

        "content": (
            feedback.content
            or ""
        ),

        "rating": (
            feedback.rating
        ),

        "sentiment": (
            feedback.sentiment
        ),

        "category": (
            feedback.category
        ),

        "user": (
            getattr(
                user,
                "username",
                None,
            )
            if user
            else None
        ),

        "created_at": (
            created_at.isoformat()
            if created_at
            else None
        ),
    }


# ============================================================
# BASE QUERYSET
# ============================================================

def _get_base_queryset(
    company_id: Optional[int] = None,
):
    """
    Build the common Feedback queryset.
    """

    from apps.feedback.models import Feedback

    queryset = (
        Feedback.objects
        .select_related(
            "company",
            "product",
            "user",
        )
    )

    if company_id is not None:

        try:
            company_id = int(
                company_id
            )

        except (
            TypeError,
            ValueError,
        ):
            return Feedback.objects.none()

        queryset = queryset.filter(
            company_id=company_id
        )

    return queryset


# ============================================================
# RECENT FEEDBACK
# ============================================================

def _get_recent_feedback(
    company_id: Optional[int] = None,
    limit: int = DEFAULT_LIMIT,
) -> List[Dict[str, Any]]:
    """
    Return recent feedback.

    This is the important fallback for broad questions such as:

        "What are the top customer complaints?"

        "Tell me about customer feedback"

        "Give me details about Samsung"

    When the natural-language query contains no useful
    database search term, we still provide actual database
    evidence instead of returning [].
    """

    limit = _safe_limit(
        limit
    )

    queryset = _get_base_queryset(
        company_id=company_id
    )

    feedback_items = list(
        queryset
        .order_by("-created_at")
        [:limit]
    )

    return [
        _serialize_feedback(
            feedback
        )
        for feedback in feedback_items
    ]


# ============================================================
# SEARCH FEEDBACK DATABASE
# ============================================================

def search_feedback_database(
    query: str,
    company_id: Optional[int] = None,
    limit: int = DEFAULT_LIMIT,
) -> List[Dict[str, Any]]:
    """
    Search LOOP customer feedback using Django ORM/PostgreSQL.

    Search priority:

    1. Exact phrase search
    2. Keyword search
    3. Intent/category search
    4. Recent feedback fallback

    This ensures broad chatbot questions still receive
    real database evidence.
    """

    query = _normalize_query(
        query
    )

    if not query:
        return _get_recent_feedback(
            company_id=company_id,
            limit=limit,
        )

    limit = _safe_limit(
        limit
    )

    queryset = _get_base_queryset(
        company_id=company_id
    )

    # --------------------------------------------------------
    # 1. EXACT PHRASE SEARCH
    # --------------------------------------------------------

    exact_query = (
        Q(title__icontains=query)
        |
        Q(content__icontains=query)
        |
        Q(category__icontains=query)
        |
        Q(sentiment__icontains=query)
        |
        Q(company__name__icontains=query)
        |
        Q(product__name__icontains=query)
    )

    exact_results = list(
        queryset
        .filter(exact_query)
        .distinct()
        .order_by("-created_at")
        [:limit]
    )

    if exact_results:
        return [
            _serialize_feedback(
                feedback
            )
            for feedback in exact_results
        ]

    # --------------------------------------------------------
    # 2. BUILD MEANINGFUL SEARCH TERMS
    # --------------------------------------------------------

    terms = _build_search_terms(
        query
    )

    # --------------------------------------------------------
    # 3. NO USEFUL TERMS
    #
    # Example:
    #
    # "customer feedback"
    #
    # Instead of returning [] immediately,
    # return recent real feedback.
    # --------------------------------------------------------

    if not terms:

        return _get_recent_feedback(
            company_id=company_id,
            limit=limit,
        )

    # --------------------------------------------------------
    # 4. KEYWORD SEARCH
    # --------------------------------------------------------

    keyword_query = Q()

    for term in terms:

        keyword_query |= (
            Q(
                title__icontains=term
            )
            |
            Q(
                content__icontains=term
            )
            |
            Q(
                category__icontains=term
            )
            |
            Q(
                sentiment__icontains=term
            )
            |
            Q(
                company__name__icontains=term
            )
            |
            Q(
                product__name__icontains=term
            )
        )

    keyword_results = list(
        queryset
        .filter(keyword_query)
        .distinct()
        .order_by("-created_at")
        [:limit]
    )

    if keyword_results:
        return [
            _serialize_feedback(
                feedback
            )
            for feedback in keyword_results
        ]

    # --------------------------------------------------------
    # 5. BROAD FEEDBACK INTENT
    # --------------------------------------------------------

    is_broad_feedback_question = any(
        term in BROAD_FEEDBACK_WORDS
        for term in terms
    )

    if is_broad_feedback_question:

        broad_query = (
            Q(title__isnull=False)
            |
            Q(content__isnull=False)
            |
            Q(category__isnull=False)
            |
            Q(sentiment__isnull=False)
        )

        broad_results = list(
            queryset
            .filter(broad_query)
            .distinct()
            .order_by("-created_at")
            [:limit]
        )

        if broad_results:
            return [
                _serialize_feedback(
                    feedback
                )
                for feedback in broad_results
            ]

    # --------------------------------------------------------
    # 6. FINAL FALLBACK
    #
    # If the user's query doesn't directly match any field,
    # provide recent database evidence.
    #
    # This is much better than returning [] for an
    # analytics chatbot.
    # --------------------------------------------------------

    return _get_recent_feedback(
        company_id=company_id,
        limit=limit,
    )


# ============================================================
# COMPANY FEEDBACK SEARCH
# ============================================================

def search_company_feedback(
    company_id: int,
    query: str,
    limit: int = DEFAULT_LIMIT,
) -> List[Dict[str, Any]]:
    """
    Search feedback belonging to one company.
    """

    return search_feedback_database(
        query=query,
        company_id=company_id,
        limit=limit,
    )


# ============================================================
# ALL FEEDBACK SEARCH
# ============================================================

def search_all_feedback(
    query: str,
    limit: int = DEFAULT_LIMIT,
) -> List[Dict[str, Any]]:
    """
    Search feedback across all companies.

    Useful for questions such as:

    - What are the top complaints?
    - What are common problems?
    - What features do customers request?
    - What are the common return problems?
    - What do customers want improved?
    """

    return search_feedback_database(
        query=query,
        company_id=None,
        limit=limit,
    )


# ============================================================
# COMPANY RECENT FEEDBACK
# ============================================================

def get_company_recent_feedback(
    company_id: int,
    limit: int = DEFAULT_LIMIT,
) -> List[Dict[str, Any]]:
    """
    Get recent feedback for a specific company.
    """

    return _get_recent_feedback(
        company_id=company_id,
        limit=limit,
    )


# ============================================================
# ALL RECENT FEEDBACK
# ============================================================

def get_recent_feedback(
    limit: int = DEFAULT_LIMIT,
) -> List[Dict[str, Any]]:
    """
    Get recent feedback across all companies.
    """

    return _get_recent_feedback(
        company_id=None,
        limit=limit,
    )


# ============================================================
# COMPATIBILITY FUNCTION
# ============================================================

def get_vector_store():
    """
    Compatibility function.

    LOOP currently performs feedback retrieval directly
    through Django ORM/PostgreSQL.

    No LangChain vector store is required here.
    """

    return None