from rest_framework.permissions import BasePermission


class AnalyticsPermission(BasePermission):
    def has_permission(self, request, view):
        user = request.user

        return (
            user.is_authenticated
            and (
                user.is_superuser
                or user.role in [
                    "ADMIN",
                    "OWNER",
                    "ANALYST",
                    "VIEWER",
                ]
            )
        )