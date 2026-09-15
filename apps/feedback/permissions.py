from rest_framework.permissions import (
    BasePermission,
    SAFE_METHODS,
)


class FeedbackPermission(BasePermission):
    """
    Feedback permissions.

    ADMIN:
        Full access to all feedback.

    OWNER:
        Read all feedback.
        Create, update and delete feedback.

    ANALYST:
        Read all feedback only.

    VIEWER:
        Read all feedback.
        Create feedback.
    """

    # ==========================================================
    # GENERAL PERMISSION
    # ==========================================================

    def has_permission(self, request, view):
        user = request.user

        # User must be authenticated.
        if not user.is_authenticated:
            return False

        # ------------------------------------------------------
        # READ
        # ------------------------------------------------------
        # ADMIN, OWNER, ANALYST and VIEWER
        # can read ALL stored feedback.
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

        # ------------------------------------------------------
        # ADMIN
        # ------------------------------------------------------
        # ADMIN can create, update and delete.
        if (
            user.is_superuser
            or user.role == "ADMIN"
        ):
            return True

        # ------------------------------------------------------
        # OWNER
        # ------------------------------------------------------
        # OWNER can create, update and delete.
        if user.role == "OWNER":
            return True

        # ------------------------------------------------------
        # VIEWER
        # ------------------------------------------------------
        # VIEWER can create new feedback.
        if (
            user.role == "VIEWER"
            and request.method == "POST"
        ):
            return True

        # ------------------------------------------------------
        # ANALYST
        # ------------------------------------------------------
        # ANALYST is read-only.
        return False

    # ==========================================================
    # OBJECT PERMISSION
    # ==========================================================

    def has_object_permission(
        self,
        request,
        view,
        obj,
    ):
        user = request.user

        # ------------------------------------------------------
        # ADMIN
        # ------------------------------------------------------
        # ADMIN can access any feedback.
        if (
            user.is_superuser
            or user.role == "ADMIN"
        ):
            return True

        # ------------------------------------------------------
        # READ
        # ------------------------------------------------------
        # IMPORTANT:
        # All roles can read ALL stored feedback.
        #
        # Do NOT check company owner/member here.
        # This allows Viewer and Analyst to see the same
        # feedback data as Admin.
        if request.method in SAFE_METHODS:
            return (
                user.role in [
                    "OWNER",
                    "ANALYST",
                    "VIEWER",
                ]
            )

        # ------------------------------------------------------
        # OWNER
        # ------------------------------------------------------
        # OWNER can modify feedback.
        if user.role == "OWNER":
            return True

        # ------------------------------------------------------
        # VIEWER / ANALYST
        # ------------------------------------------------------
        # Viewer cannot modify existing feedback.
        # Analyst cannot modify feedback.
        return False