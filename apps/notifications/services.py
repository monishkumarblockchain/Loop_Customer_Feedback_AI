from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Notification

def broadcast_company_event(company_id, payload):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"company_{company_id}",
        {"type": "company.event", "payload": payload},
    )

def notify_user(user, event, title, message, company_id=None):
    notification = Notification.objects.create(
        user=user, company_id=company_id, event=event, title=title, message=message
    )
    if company_id:
        broadcast_company_event(company_id, {
            "event": "notification.created",
            "notification_id": notification.id,
            "title": title,
            "message": message,
        })
    return notification
