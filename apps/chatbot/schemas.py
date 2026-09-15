from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, ConfigDict


# =========================================================
# PRIORITY
# =========================================================

class Priority(str, Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


# =========================================================
# RECOMMENDATION
# =========================================================

class Recommendation(BaseModel):
    model_config = ConfigDict(extra="ignore")

    insight: str = Field(
        description="What the customer feedback data shows."
    )

    problem: str = Field(
        description="What customers are experiencing."
    )

    action: str = Field(
        description="What the business should concretely do."
    )

    priority: Priority = Field(
        description="Recommendation priority: High, Medium, or Low."
    )

    expected_impact: str = Field(
        description="Expected customer or business impact."
    )

    evidence: str = Field(
        description=(
            "Specific evidence from LOOP data supporting "
            "this recommendation."
        )
    )


# =========================================================
# FINAL ANSWER
# =========================================================

class FinalAnswer(BaseModel):
    """
    Final structured response from LOOP AI.

    This is NOT a LangChain tool.

    It is only used to validate the final JSON returned
    by the final Groq model.
    """

    model_config = ConfigDict(extra="ignore")

    summary: str = Field(
        description=(
            "A direct and useful answer to the user's question."
        )
    )

    facts: List[str] = Field(
        default_factory=list,
        description=(
            "Important facts supported by LOOP data."
        )
    )

    recommendations: List[Recommendation] = Field(
        default_factory=list,
        description=(
            "Evidence-based recommendations when requested."
        )
    )

    data_sufficient: bool = Field(
        description=(
            "Whether available LOOP data is sufficient "
            "to answer the question."
        )
    )


# =========================================================
# CHAT HISTORY
# =========================================================

class ChatTurn(BaseModel):
    model_config = ConfigDict(extra="ignore")

    role: str

    content: str


# =========================================================
# CHAT REQUEST
# =========================================================

class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    message: str = Field(
        min_length=1,
        max_length=4000,
    )

    company_id: Optional[int] = None

    history: List[ChatTurn] = Field(
        default_factory=list
    )