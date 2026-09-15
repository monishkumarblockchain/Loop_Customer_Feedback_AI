from django.contrib.auth.models import AbstractUser
from django.db import models

from common.constants import ROLES


class User(AbstractUser):
    email = models.EmailField(
        unique=True,
    )

    role = models.CharField(
        max_length=20,
        choices=[
            (x, x)
            for x in ROLES
        ],
        default="VIEWER",
    )

    avatar = models.ImageField(
        upload_to="avatars/",
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    REQUIRED_FIELDS = ["email"]

    def __str__(self):
        return f"{self.username} ({self.role})"