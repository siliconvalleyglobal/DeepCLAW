"""
WhatsApp Cloud API channel adapter.
"""

import time
from typing import Any, Dict
from deepclaw.channels.base_channel import BaseChannel, ChannelMessage


class WhatsAppChannel(BaseChannel):
    """WhatsApp Cloud API adapter."""

    def __init__(self, api_token: str = "mock-wa-token"):
        super().__init__(channel_name="whatsapp", permission_ceiling="external_channel")
        self.api_token = api_token

    def verify_sender(self, raw_payload: Dict[str, Any]) -> bool:
        return "entry" in raw_payload or "object" in raw_payload or "phone_number" in raw_payload

    async def receive(self, raw_payload: Dict[str, Any]) -> ChannelMessage:
        phone = raw_payload.get("phone_number", "wa-unknown")
        text = raw_payload.get("text", "")
        return ChannelMessage(
            message_id=f"wa-{int(time.time())}",
            channel_name="whatsapp",
            sender_id=phone,
            content=text,
            metadata={"phone": phone},
        )

    async def send(self, recipient_id: str, content: str) -> Dict[str, Any]:
        return {
            "platform": "whatsapp",
            "to": recipient_id,
            "status": "sent",
            "text": content,
        }
