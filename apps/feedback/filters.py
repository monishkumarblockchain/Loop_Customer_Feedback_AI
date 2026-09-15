import django_filters
from .models import Feedback

class FeedbackFilter(django_filters.FilterSet):
    date_from = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="gte")
    date_to = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="lte")

    class Meta:
        model = Feedback
        fields = ["company", "product", "sentiment", "priority", "category", "rating", "status"]
