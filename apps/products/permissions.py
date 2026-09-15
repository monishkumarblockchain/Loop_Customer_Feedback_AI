from rest_framework.permissions import (
    BasePermission,
    SAFE_METHODS,
)


class ProductPermission(BasePermission):

    def has_permission(self, request, view):
        user = request.user

        if not user.is_authenticated:
            return False

        # All roles can READ products
        if request.method in SAFE_METHODS:
            return (
                user.is_superuser
                or user.role in [
                    "ADMIN",
                    "OWNER",
                    "ANALYST",
                    "VIEWER",
                ]
            )

        # Only ADMIN and OWNER can modify
        return (
            user.is_superuser
            or user.role in [
                "ADMIN",
                "OWNER",
            ]
        )

    def has_object_permission(
        self,
        request,
        view,
        obj,
    ):
        user = request.user

        # ADMIN / superuser
        if (
            user.is_superuser
            or user.role == "ADMIN"
        ):
            return True

        # Everyone can read every product
        if request.method in SAFE_METHODS:
            return True

        # OWNER can modify their company's products
        return (
            user.role == "OWNER"
            and obj.company.owner_id == user.id
        )