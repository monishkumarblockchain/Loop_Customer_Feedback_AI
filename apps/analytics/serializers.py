from rest_framework import serializers


class CompanyAnalyticsSerializer(serializers.Serializer):
    company_id = serializers.IntegerField()
    company_name = serializers.CharField()

    total_feedback = serializers.IntegerField()
    positive = serializers.IntegerField()
    negative = serializers.IntegerField()
    neutral = serializers.IntegerField()

    processed = serializers.IntegerField()
    pending = serializers.IntegerField()

    average_rating = serializers.FloatField(
        allow_null=True
    )

    positive_percentage = serializers.FloatField()
    negative_percentage = serializers.FloatField()

    top_issue = serializers.CharField(
        allow_null=True
    )

    feature_requests = serializers.IntegerField()