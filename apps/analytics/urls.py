from django.urls import path
from .views import OverviewView, SentimentView, CompanyBreakdownView,TopIssuesView, FeatureRequestsView, AISummaryView
urlpatterns = [
    path("overview/", OverviewView.as_view()),
    path("sentiment/", SentimentView.as_view()),
    path("top-issues/", TopIssuesView.as_view()),
    path("feature-requests/", FeatureRequestsView.as_view()),
    path("ai-summary/", AISummaryView.as_view()),
    path(
        "company-breakdown/",
        CompanyBreakdownView.as_view(),
        name="company-breakdown",
    ),
]
