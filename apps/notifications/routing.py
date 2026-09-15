from django.urls import re_path
from .consumers import CompanyConsumer
websocket_urlpatterns = [
    re_path(r"ws/notifications/(?P<company_id>\d+)/$", CompanyConsumer.as_asgi()),
]
