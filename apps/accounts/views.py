from rest_framework import generics, permissions
from rest_framework_simplejwt.views import TokenObtainPairView

from common.permissions import IsAdmin

from .models import User
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    LoginSerializer,
    MeSerializer,
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [
        permissions.AllowAny,
    ]


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = MeSerializer
    permission_classes = [
        permissions.IsAuthenticated,
    ]

    def get_object(self):
        return self.request.user


class UserListView(generics.ListAPIView):
    queryset = User.objects.all().order_by("-created_at")
    serializer_class = UserSerializer
    permission_classes = [
        IsAdmin,
    ]


class UserDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [
        IsAdmin,
    ]