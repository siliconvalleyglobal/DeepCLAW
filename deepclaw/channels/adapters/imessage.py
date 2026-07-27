"""
iMessage channel adapter.
"""

import time
from typing import Any, Dict
from deepclaw.channels.base_channel import BaseChannel, ChannelMessage


class IMessageChannel(BaseChannel):
    """iMessage platform channel adapter."""

    def __init__(self, service_handle: str = "imessage-gateway"):
        super().__init__(channel_name="imessage", permission_ceiling="external_channel")
        self.service_handle = service_handle

    def verify_sender(self, raw_payload: Dict[str, Any]) -> bool:
        return "sender_handle" in raw_payload or "apple_id" in raw_payload or "body" in raw_payload

    async def receive(self, raw_payload: Dict[str, Any]) -> ChannelMessage:
        sender = raw_payload.get("sender_handle", raw_payload.get("apple_id", "im-unknown"))
        return ChannelMessage(
            message_id=str(raw_payload.get("id", f"im-{int(time.time())}")),
            channel_name="imessage",
            sender_id=str(sender),
            content=str(raw_payload.get("body", raw_payload.get("text", ""))),
            metadata={"apple_id": sender},
        )

    async def send(self, recipient_id: str, content: str) -> Dict[str, Any]:
        return {
            "platform": "imessage",
            "to": recipient_id,
            "status": "sent",
            "text": content,
        }
