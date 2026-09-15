from django.conf import settings
from django.db import models

from common.constants import SENTIMENTS, PRIORITIES
from common.validators import validate_rating

from apps.companies.models import Company
from apps.products.models import Product


class Feedback(models.Model):
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="feedback",
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="feedback",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="feedback",
    )

    title = models.CharField(
        max_length=250
    )

    content = models.TextField()

    rating = models.PositiveSmallIntegerField(
        validators=[validate_rating]
    )

    sentiment = models.CharField(
        max_length=20,
        choices=[
            (x, x)
            for x in SENTIMENTS
        ],
        default="NEUTRAL",
    )

    sentiment_score = models.FloatField(
        default=0
    )

    category = models.CharField(
        max_length=120,
        blank=True,
    )

    priority = models.CharField(
        max_length=20,
        choices=[
            (x, x)
            for x in PRIORITIES
        ],
        default="MEDIUM",
    )

    status = models.CharField(
        max_length=30,
        default="OPEN",
    )

    is_processed = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title