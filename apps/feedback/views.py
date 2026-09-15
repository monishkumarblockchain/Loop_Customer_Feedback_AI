from rest_framework import (
    status,
    viewsets,
)
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.comments.models import Comment
from apps.comments.serializers import CommentSerializer

from .filters import FeedbackFilter
from .models import Feedback
from .permissions import FeedbackPermission
from .serializers import FeedbackSerializer
from .services import queue_feedback_analysis


class FeedbackViewSet(viewsets.ModelViewSet):
    """
    Feedback API.

    ADMIN:
        - Can view all feedback.
        - Can create feedback.
        - Can update feedback.
        - Can delete feedback.

    OWNER:
        - Can view all feedback.
        - Can create feedback.
        - Can update feedback.
        - Can delete feedback.

    ANALYST:
        - Can view all feedback.
        - Read only.

    VIEWER:
        - Can view all feedback.
        - Can create feedback.

    All roles can access the stored feedback data.
    """

    serializer_class = FeedbackSerializer

    permission_classes = [
        IsAuthenticated,
        FeedbackPermission,
    ]

    # ==========================================================
    # FILTERING
    # ==========================================================

    filterset_class = FeedbackFilter

    search_fields = [
        "title",
        "content",
        "category",
    ]

    ordering_fields = [
        "created_at",
        "rating",
        "sentiment_score",
    ]

    ordering = [
        "-created_at",
    ]

    # ==========================================================
    # GET FEEDBACK
    # ==========================================================

    def get_queryset(self):
        """
        IMPORTANT:

        ALL authenticated roles receive ALL stored feedback.

        ADMIN   -> all feedback
        OWNER   -> all feedback
        ANALYST -> all feedback
        VIEWER  -> all feedback
        """

        return (
            Feedback.objects
            .select_related(
                "company",
                "product",
                "user",
            )
            .all()
            .order_by("-created_at")
        )

    # ==========================================================
    # CREATE FEEDBACK
    # ==========================================================

    def perform_create(self, serializer):
        """
        Create feedback.

        The authenticated user is automatically stored
        as the feedback creator.

        AI analysis is queued after creation.
        """

        user = self.request.user

        company = serializer.validated_data.get("company")

        if company is None:
            raise PermissionDenied(
                "Company is required."
            )

        # Permission for ADMIN / OWNER / VIEWER
        # is already handled by FeedbackPermission.

        if user.role == "ANALYST":
            raise PermissionDenied(
                "Analysts can only view feedback."
            )

        if user.role not in [
            "ADMIN",
            "OWNER",
            "VIEWER",
        ] and not user.is_superuser:
            raise PermissionDenied(
                "You do not have permission to create feedback."
            )

        # Save feedback with current user.
        feedback = serializer.save(
            user=user
        )

        # Queue AI sentiment/category analysis.
        queue_feedback_analysis(
            feedback.id
        )

    # ==========================================================
    # UPDATE FEEDBACK
    # ==========================================================

    def perform_update(self, serializer):
        """
        Update feedback.

        ADMIN / superuser:
            Can update any feedback.

        OWNER:
            Can update feedback.

        ANALYST:
            Read only.

        VIEWER:
            Cannot update existing feedback.

        AI analysis is queued again after update.
        """

        user = self.request.user

        # ------------------------------------------------------
        # ADMIN
        # ------------------------------------------------------

        if (
            user.is_superuser
            or user.role == "ADMIN"
        ):
            pass

        # ------------------------------------------------------
        # OWNER
        # ------------------------------------------------------

        elif user.role == "OWNER":
            pass

        # ------------------------------------------------------
        # ANALYST / VIEWER
        # ------------------------------------------------------

        else:
            raise PermissionDenied(
                "You do not have permission to update feedback."
            )

        # Save updated feedback.
        feedback = serializer.save()

        # Previous AI result may now be outdated.
        feedback.is_processed = False

        feedback.save(
            update_fields=[
                "is_processed",
            ]
        )

        # Run AI analysis again.
        queue_feedback_analysis(
            feedback.id
        )

    # ==========================================================
    # DELETE FEEDBACK
    # ==========================================================

    def perform_destroy(self, instance):
        """
        Delete feedback.

        ADMIN / superuser:
            Can delete any feedback.

        OWNER:
            Can delete feedback.

        ANALYST:
            Cannot delete.

        VIEWER:
            Cannot delete.
        """

        user = self.request.user

        # ADMIN / superuser
        if (
            user.is_superuser
            or user.role == "ADMIN"
        ):
            instance.delete()
            return

        # OWNER
        if user.role == "OWNER":
            instance.delete()
            return

        # ANALYST / VIEWER
        raise PermissionDenied(
            "You do not have permission to delete feedback."
        )

    # ==========================================================
    # COMMENTS
    # ==========================================================

    @action(
        detail=True,
        methods=[
            "get",
            "post",
        ],
        url_path="comments",
    )
    def comments(
        self,
        request,
        pk=None,
    ):
        """
        GET:
            Return all comments for the feedback.

        POST:
            Add a comment to the feedback.

        Since get_object() uses get_queryset(), all authenticated
        roles can access comments for stored feedback.
        """

        feedback = self.get_object()

        # ======================================================
        # GET COMMENTS
        # ======================================================

        if request.method == "GET":

            comments = (
                Comment.objects
                .filter(
                    feedback=feedback
                )
                .select_related(
                    "user"
                )
                .order_by(
                    "created_at"
                )
            )

            serializer = CommentSerializer(
                comments,
                many=True,
            )

            return Response(
                serializer.data,
                status=status.HTTP_200_OK,
            )

        # ======================================================
        # POST COMMENT
        # ======================================================

        serializer = CommentSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save(
            feedback=feedback,
            user=request.user,
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )