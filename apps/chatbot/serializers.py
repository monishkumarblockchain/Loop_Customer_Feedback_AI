from rest_framework import serializers

MAX_HISTORY_ITEMS = 12
MAX_MESSAGE_LENGTH = 2000


class ChatHistoryItemSerializer(serializers.Serializer):
    """A single prior turn, sent back by the client so the agent keeps
    short-term conversational context."""

    role = serializers.ChoiceField(choices=["user", "assistant"])
    content = serializers.CharField(
        allow_blank=False,
        max_length=MAX_MESSAGE_LENGTH,
    )


class ChatMessageSerializer(serializers.Serializer):
    """Payload for POST /api/v1/chatbot/chat/"""

    message = serializers.CharField(
        required=True,
        allow_blank=False,
        trim_whitespace=True,
        max_length=MAX_MESSAGE_LENGTH,
    )

    company_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        default=None,
    )

    history = ChatHistoryItemSerializer(
        many=True,
        required=False,
        default=list,
    )

    def validate_history(self, value):
        if len(value) > MAX_HISTORY_ITEMS:
            return value[-MAX_HISTORY_ITEMS:]
        return value


class RecommendationSerializer(serializers.Serializer):
    insight = serializers.CharField()
    problem = serializers.CharField()
    action = serializers.CharField()
    priority = serializers.ChoiceField(choices=["High", "Medium", "Low"])
    expected_impact = serializers.CharField()
    evidence = serializers.CharField()


class FinalAnswerSerializer(serializers.Serializer):
    """Mirrors schemas.FinalAnswer - documents the structured response
    shape returned by the agent."""

    summary = serializers.CharField()
    facts = serializers.ListField(child=serializers.CharField())
    recommendations = RecommendationSerializer(many=True)
    data_sufficient = serializers.BooleanField()


class ChatResponseSerializer(serializers.Serializer):
    answer = FinalAnswerSerializer()
    analytics = serializers.DictField()
