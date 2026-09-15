from rest_framework import serializers
from .models import Comment

class CommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "feedback", "user", "user_name", "parent_comment", "content", "created_at", "updated_at"]
        read_only_fields = ["id", "feedback", "user", "user_name", "created_at", "updated_at"]
