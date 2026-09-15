from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """
    ADMIN only.
    """

    def has_permission(self, request, view):
        user = request.user

        return (
            user.is_authenticated
            and (
                user.is_superuser
                or user.role == "ADMIN"
            )
        )


class IsAdminOrOwner(BasePermission):
    """
    ADMIN or OWNER.
    """

    def has_permission(self, request, view):
        user = request.user

        return (
            user.is_authenticated
            and (
                user.is_superuser
                or user.role in [
                    "ADMIN",
                    "OWNER",
                ]
            )
        )


class IsFeedbackUser(BasePermission):
    """
    All four roles can use feedback.
    """

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


class IsAnalyticsUser(BasePermission):
    """
    All four roles can view analytics.
    """

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