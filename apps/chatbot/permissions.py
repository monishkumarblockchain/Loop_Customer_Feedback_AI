from rest_framework.permissions import BasePermission


class IsAuthenticatedForChat(BasePermission):
    """
    All authenticated LOOP users can use the Analytics AI chatbot.

    ADMIN   -> full analytics access
    OWNER   -> analytics access
    ANALYST -> analytics access
    VIEWER  -> analytics access

    Management permissions are handled by the individual
    company/product/feedback APIs.
    """

    def has_permission(self, request, view):
        user = request.user

        return (
            user.is_authenticated
            and user.role in [
                "ADMIN",
                "OWNER",
                "ANALYST",
                "VIEWER",
            ]
        )