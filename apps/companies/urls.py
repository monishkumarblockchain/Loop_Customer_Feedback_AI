from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import CompanyViewSet, CompanyMemberViewSet


router = DefaultRouter()

router.register(
    r"",
    CompanyViewSet,
    basename="company",
)

router.register(
    r"members",
    CompanyMemberViewSet,
    basename="company-member",
)

urlpatterns = [
    path("", include(router.urls)),
]