from rest_framework.permissions import BasePermission


class CompanyAccessPermission(BasePermission):

    def has_permission(self, request, view):
        user = request.user

        if not user.is_authenticated:
            return False

        return (
            user.is_superuser
            or user.role in ["ADMIN", "OWNER"]
        )

    def has_object_permission(
        self,
        request,
        view,
        obj,
    ):
        user = request.user

        if user.is_superuser:
            return True

        if user.role == "ADMIN":
            return True

        return obj.owner_id == user.id