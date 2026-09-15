from django.db.models import Q

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.companies.models import Company

from .permissions import IsAuthenticatedForChat
from .schemas import ChatTurn
from .serializers import ChatMessageSerializer
from .services import get_company_analytics, run_chat


class AnalyticsChatbotView(APIView):
    """
    LOOP Analytics AI Chatbot.

    Endpoint:
        POST /api/v1/chatbot/chat/

    Supported roles:
        ADMIN
        OWNER
        ANALYST
        VIEWER

    All authenticated roles can READ analytics.

    Example request:

    {
        "message": "Why are customers unhappy?",
        "company_id": 1,
        "history": [
            {
                "role": "user",
                "content": "What are the main problems?"
            },
            {
                "role": "assistant",
                "content": "The main problems are..."
            }
        ]
    }

    company_id is optional.

    Response:

    {
        "answer": {
            "summary": "...",
            "facts": [],
            "recommendations": [],
            "data_sufficient": true
        },
        "analytics": {}
    }
    """

    permission_classes = [
        IsAuthenticatedForChat
    ]

    def post(
        self,
        request,
        *args,
        **kwargs,
    ):
        # =========================================================
        # 1. Validate request
        # =========================================================

        serializer = ChatMessageSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        message = serializer.validated_data.get(
            "message",
            ""
        )

        message = message.strip()

        company_id = serializer.validated_data.get(
            "company_id"
        )

        history_data = serializer.validated_data.get(
            "history",
            []
        )

        # =========================================================
        # 2. Validate message
        # =========================================================

        if not message:
            return Response(
                {
                    "detail": "Message cannot be empty."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # =========================================================
        # 3. Convert history to Pydantic ChatTurn objects
        # =========================================================

        try:
            history = [
                ChatTurn(
                    role=turn["role"],
                    content=turn["content"],
                )
                for turn in history_data
            ]

        except Exception:
            return Response(
                {
                    "detail": (
                        "Invalid chat history format."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # =========================================================
        # 4. Current authenticated user
        # =========================================================

        user = request.user

        # =========================================================
        # 5. Validate company
        # =========================================================

        company = None

        if company_id is not None:

            company = (
                Company.objects
                .filter(
                    id=company_id
                )
                .first()
            )

            if company is None:
                return Response(
                    {
                        "detail": "Company not found."
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )

        # =========================================================
        # 6. Determine company access
        # =========================================================
        #
        # ADMIN:
        #   Can access all companies.
        #
        # OWNER:
        #   Can access own/member companies.
        #
        # ANALYST:
        #   Can read analytics.
        #
        # VIEWER:
        #   Can read analytics.
        #
        # =========================================================

        if company is not None:

            has_access = False

            # -----------------------------------------------------
            # ADMIN / SUPERUSER
            # -----------------------------------------------------

            if (
                user.is_superuser
                or user.role == "ADMIN"
            ):
                has_access = True

            # -----------------------------------------------------
            # Company owner
            # -----------------------------------------------------

            elif company.owner_id == user.id:
                has_access = True

            # -----------------------------------------------------
            # Company member
            # -----------------------------------------------------

            elif company.members.filter(
                user=user
            ).exists():
                has_access = True

            # -----------------------------------------------------
            # If your application allows ANALYST and VIEWER to
            # read every company's analytics, enable this block.
            #
            # This matches your requirement that:
            #
            # ANALYST -> Analytics READ
            # VIEWER   -> Analytics READ
            #
            # -----------------------------------------------------

            elif user.role in [
                "ANALYST",
                "VIEWER",
            ]:
                has_access = True

            if not has_access:

                return Response(
                    {
                        "detail": (
                            "You do not have permission "
                            "to access this company's "
                            "analytics."
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

        # =========================================================
        # 7. No company selected
        # =========================================================
        #
        # If company_id is omitted:
        #
        # ADMIN:
        #   Can use all company analytics.
        #
        # OWNER:
        #   Can use own/member companies.
        #
        # ANALYST:
        #   Can use analytics.
        #
        # VIEWER:
        #   Can use analytics.
        #
        # =========================================================

        if company_id is None:

            if (
                user.is_superuser
                or user.role == "ADMIN"
            ):
                accessible_companies = (
                    Company.objects.all()
                )

            elif user.role in [
                "ANALYST",
                "VIEWER",
            ]:
                # -------------------------------------------------
                # READ-ONLY analytics access.
                #
                # They can ask the chatbot about all companies.
                # They still cannot create/update/delete companies.
                # -------------------------------------------------

                accessible_companies = (
                    Company.objects.all()
                )

            else:
                # -------------------------------------------------
                # OWNER
                #
                # Owner sees own/member companies.
                # -------------------------------------------------

                accessible_companies = (
                    Company.objects
                    .filter(
                        Q(owner=user)
                        | Q(members__user=user)
                    )
                    .distinct()
                )

            if not accessible_companies.exists():

                return Response(
                    {
                        "detail": (
                            "No company analytics "
                            "are available."
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

        # =========================================================
        # 8. Run LOOP AI chatbot
        # =========================================================

        try:

            final_answer = run_chat(
                message=message,
                company_id=company_id,
                history=history,
            )

        except Exception as exc:

            # -----------------------------------------------------
            # Log the actual exception on the backend.
            # Do not expose internal details to the frontend.
            # -----------------------------------------------------

            import logging

            logger = logging.getLogger(
                __name__
            )

            logger.exception(
                "LOOP Analytics Chatbot failed: %s",
                exc,
            )

            return Response(
                {
                    "detail": (
                        "The analytics AI assistant "
                        "could not process your request. "
                        "Please try again."
                    )
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # =========================================================
        # 9. Get analytics
        # =========================================================

        try:

            analytics = get_company_analytics(
                company_id=company_id
            )

        except Exception as exc:

            import logging

            logger = logging.getLogger(
                __name__
            )

            logger.exception(
                "LOOP analytics failed: %s",
                exc,
            )

            return Response(
                {
                    "detail": (
                        "Analytics data could not "
                        "be loaded."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # =========================================================
        # 10. Serialize FinalAnswer
        # =========================================================

        try:

            if hasattr(
                final_answer,
                "model_dump",
            ):

                answer_data = (
                    final_answer.model_dump(
                        mode="json"
                    )
                )

            elif isinstance(
                final_answer,
                dict,
            ):

                answer_data = final_answer

            else:

                raise ValueError(
                    "Invalid chatbot response."
                )

        except Exception as exc:

            import logging

            logger = logging.getLogger(
                __name__
            )

            logger.exception(
                "Invalid LOOP chatbot response: %s",
                exc,
            )

            return Response(
                {
                    "detail": (
                        "The AI assistant returned "
                        "an invalid response."
                    )
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # =========================================================
        # 11. Final response
        # =========================================================

        return Response(
            {
                "answer": answer_data,
                "analytics": analytics,
            },
            status=status.HTTP_200_OK,
        )