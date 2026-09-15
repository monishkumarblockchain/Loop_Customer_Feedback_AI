import json
from channels.generic.websocket import AsyncWebsocketConsumer

class CompanyConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.company_id = self.scope["url_route"]["kwargs"]["company_id"]
        self.group_name = f"company_{self.company_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def company_event(self, event):
        await self.send(text_data=json.dumps(event["payload"]))
