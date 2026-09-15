from rest_framework.permissions import BasePermission
class CommentPermission(BasePermission):
    def has_object_permission(self, request, view, obj):
        u = request.user
        return u.is_superuser or u.role == "ADMIN" or obj.user_id == u.id or obj.feedback.company.owner_id == u.id or obj.feedback.company.members.filter(user=u).exists()
