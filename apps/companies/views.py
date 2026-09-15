from rest_framework import viewsets
from rest_framework.permissions import (
    IsAuthenticated,
    BasePermission,
    SAFE_METHODS,
)

from .models import Company, CompanyMember
from .serializers import (
    CompanySerializer,
    CompanyMemberSerializer,
)


# ============================================================
# COMPANY PERMISSION
# ============================================================

class CompanyPermission(BasePermission):
    """
    All authenticated users can READ companies.

    ADMIN and OWNER can:
    - Create
    - Update
    - Delete

    ANALYST and VIEWER:
    - Read only
    """

    def has_permission(self, request, view):
        user = request.user

        if not user.is_authenticated:
            return False

        # ADMIN, OWNER, ANALYST and VIEWER
        # can read all stored companies.
        if request.method in SAFE_METHODS:
            return True

        # Only ADMIN and OWNER can modify companies.
        return (
            user.is_superuser
            or user.role in ["ADMIN", "OWNER"]
        )

    def has_object_permission(self, request, view, obj):
        user = request.user

        # ADMIN / superuser can access everything.
        if (
            user.is_superuser
            or user.role == "ADMIN"
        ):
            return True

        # Everyone can read every company.
        if request.method in SAFE_METHODS:
            return True

        # OWNER can modify companies.
        return user.role == "OWNER"


# ============================================================
# COMPANY MEMBER PERMISSION
# ============================================================

class CompanyMemberPermission(BasePermission):
    """
    Only ADMIN and OWNER can manage company members.
    """

    def has_permission(self, request, view):
        user = request.user

        if not user.is_authenticated:
            return False

        return (
            user.is_superuser
            or user.role in ["ADMIN", "OWNER"]
        )

    def has_object_permission(self, request, view, obj):
        user = request.user

        # ADMIN / superuser can manage all members.
        if (
            user.is_superuser
            or user.role == "ADMIN"
        ):
            return True

        # OWNER can manage members of their company.
        return (
            user.role == "OWNER"
            and obj.company.owner_id == user.id
        )


# ============================================================
# COMPANY VIEWSET
# ============================================================

class CompanyViewSet(viewsets.ModelViewSet):

    serializer_class = CompanySerializer

    permission_classes = [
        IsAuthenticated,
        CompanyPermission,
    ]

    def get_queryset(self):
        """
        IMPORTANT:
        Every authenticated role receives ALL stored companies.

        ADMIN   -> all companies
        OWNER   -> all companies
        ANALYST -> all companies
        VIEWER  -> all companies
        """

        return (
            Company.objects
            .all()
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        """
        ADMIN / OWNER create a company.

        The logged-in user becomes the owner.
        """

        company = serializer.save(
            owner=self.request.user
        )

        # Automatically add owner as company member.
        CompanyMember.objects.get_or_create(
            company=company,
            user=self.request.user,
            defaults={
                "role": "OWNER"
            },
        )


# ============================================================
# COMPANY MEMBER VIEWSET
# ============================================================

class CompanyMemberViewSet(viewsets.ModelViewSet):

    serializer_class = CompanyMemberSerializer

    permission_classes = [
        IsAuthenticated,
        CompanyMemberPermission,
    ]

    def get_queryset(self):
        """
        ADMIN -> all company members

        OWNER -> members belonging to their companies
        """

        user = self.request.user

        if (
            user.is_superuser
            or user.role == "ADMIN"
        ):
            return (
                CompanyMember.objects
                .select_related(
                    "company",
                    "user",
                )
                .all()
                .order_by("-created_at")
            )

        return (
            CompanyMember.objects
            .select_related(
                "company",
                "user",
            )
            .filter(
                company__owner=user
            )
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        """
        OWNER can add members only to their own companies.
        ADMIN can add members to any company.
        """

        user = self.request.user
        company = serializer.validated_data.get("company")

        if not company:
            raise ValueError("Company is required.")

        if (
            not user.is_superuser
            and user.role != "ADMIN"
            and company.owner_id != user.id
        ):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied(
                "You can only add members to your own company."
            )

        serializer.save()