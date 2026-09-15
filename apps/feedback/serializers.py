from rest_framework import serializers

from .models import Feedback


class FeedbackSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = Feedback

        fields = [
            "id",
            "company",
            "product",
            "user",
            "title",
            "content",
            "rating",
            "sentiment",
            "sentiment_score",
            "category",
            "priority",
            "status",
            "is_processed",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "user",
            "sentiment",
            "sentiment_score",
            "category",
            "priority",
            "status",
            "is_processed",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        company = attrs.get("company")
        product = attrs.get("product")

        if company and product:
            if product.company_id != company.id:
                raise serializers.ValidationError({
                    "product": (
                        "Selected product does not "
                        "belong to the selected company."
                    )
                })

        return attrs