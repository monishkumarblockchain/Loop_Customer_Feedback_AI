from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .models import Product
from .serializers import ProductSerializer
from .permissions import ProductPermission


class ProductViewSet(viewsets.ModelViewSet):
    """
    Product API.

    READ:
        ADMIN   -> all products
        OWNER   -> all products
        ANALYST -> all products
        VIEWER  -> all products

    WRITE:
        ADMIN   -> create/update/delete
        OWNER   -> create/update/delete
        ANALYST -> read only
        VIEWER  -> read only
    """

    serializer_class = ProductSerializer

    permission_classes = [
        IsAuthenticated,
        ProductPermission,
    ]

    # ==========================================================
    # GET PRODUCTS
    # ==========================================================

    def get_queryset(self):
        """
        Return ALL stored products for every authenticated role.

        Optional filter:
            /api/v1/products/?company=1
        """

        queryset = (
            Product.objects
            .select_related("company")
            .all()
            .order_by("name")
        )

        # Optional company filter
        company_id = self.request.query_params.get("company")

        if company_id:
            try:
                company_id = int(company_id)
            except (TypeError, ValueError):
                return Product.objects.none()

            queryset = queryset.filter(
                company_id=company_id
            )

        return queryset

    # ==========================================================
    # CREATE PRODUCT
    # ==========================================================

    def perform_create(self, serializer):
        """
        Only ADMIN and OWNER can create products.

        ADMIN:
            Can create a product for any company.

        OWNER:
            Can create a product only for their own company.
        """

        user = self.request.user

        # Only ADMIN / OWNER can create
        if not (
            user.is_superuser
            or user.role in ["ADMIN", "OWNER"]
        ):
            raise PermissionDenied(
                "You do not have permission to create products."
            )

        company = serializer.validated_data.get("company")

        if company is None:
            raise PermissionDenied(
                "A company is required."
            )

        # ADMIN / superuser can create for any company
        if (
            user.is_superuser
            or user.role == "ADMIN"
        ):
            serializer.save()
            return

        # OWNER can create only for their own company
        if company.owner_id != user.id:
            raise PermissionDenied(
                "You can only create products for your own company."
            )

        serializer.save()

    # ==========================================================
    # UPDATE PRODUCT
    # ==========================================================

    def perform_update(self, serializer):
        """
        Only ADMIN and OWNER can update products.

        ADMIN:
            Can update any product.

        OWNER:
            Can update products belonging to their own company.
        """

        user = self.request.user

        # ADMIN / superuser can update anything
        if (
            user.is_superuser
            or user.role == "ADMIN"
        ):
            serializer.save()
            return

        # Only OWNER can continue
        if user.role != "OWNER":
            raise PermissionDenied(
                "You do not have permission to update products."
            )

        product = self.get_object()

        # OWNER can update only their own company's products
        if product.company.owner_id != user.id:
            raise PermissionDenied(
                "You can only update products belonging to your company."
            )

        serializer.save()

    # ==========================================================
    # DELETE PRODUCT
    # ==========================================================

    def perform_destroy(self, instance):
        """
        Only ADMIN and OWNER can delete products.

        ADMIN:
            Can delete any product.

        OWNER:
            Can delete products belonging to their own company.
        """

        user = self.request.user

        # ADMIN / superuser can delete anything
        if (
            user.is_superuser
            or user.role == "ADMIN"
        ):
            instance.delete()
            return

        # Only OWNER can continue
        if user.role != "OWNER":
            raise PermissionDenied(
                "You do not have permission to delete products."
            )

        # OWNER can delete only their own company's products
        if instance.company.owner_id != user.id:
            raise PermissionDenied(
                "You can only delete products belonging to your company."
            )

        instance.delete()