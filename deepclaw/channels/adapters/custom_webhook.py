"""
Generic inbound webhook channel adapter.
"""

import time
from typing import Any, Dict
from deepclaw.channels.base_channel import BaseChannel, ChannelMessage


class CustomWebhookChannel(BaseChannel):
    """Generic fallback webhook adapter for custom web apps or platforms."""

    def __init__(self, secret: str = "mock-webhook-secret"):
        super().__init__(channel_name="custom_webhook", permission_ceiling="external_channel")
        self.secret = secret

    def verify_sender(self, raw_payload: Dict[str, Any]) -> bool:
        return "sender_id" in raw_payload or "content" in raw_payload or "text" in raw_payload

    async def receive(self, raw_payload: Dict[str, Any]) -> ChannelMessage:
        return ChannelMessage(
            message_id=str(raw_payload.get("id", f"wh-{int(time.time())}")),
            channel_name="custom_webhook",
            sender_id=str(raw_payload.get("sender_id", "wh-anonymous")),
            content=str(raw_payload.get("content", raw_payload.get("text", ""))),
            metadata=raw_payload.get("metadata", {}),
        )

    async def send(self, recipient_id: str, content: str) -> Dict[str, Any]:
        return {
            "platform": "custom_webhook",
            "recipient_id": recipient_id,
            "status": "sent",
            "payload": {"text": content},
        }
