from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Comment
from .serializers import CommentSerializer
from .permissions import CommentPermission

class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated, CommentPermission]

    def get_queryset(self):
        u = self.request.user
        if u.is_superuser or u.role == "ADMIN":
            return Comment.objects.select_related("user", "feedback")
        return Comment.objects.filter(
            feedback__company__owner=u
        ).union(
            Comment.objects.filter(feedback__company__members__user=u)
        ).order_by("created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
