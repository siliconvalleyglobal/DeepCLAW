"""
Viber Bot API channel adapter.
"""

import time
from typing import Any, Dict
from deepclaw.channels.base_channel import BaseChannel, ChannelMessage


class ViberChannel(BaseChannel):
    """Viber channel adapter enforcing external_channel permission ceiling."""

    def __init__(self, auth_token: str = "mock-viber-token"):
        super().__init__(channel_name="viber", permission_ceiling="external_channel")
        self.auth_token = auth_token

    def verify_sender(self, raw_payload: Dict[str, Any]) -> bool:
        return "event" in raw_payload or "sender" in raw_payload or "message" in raw_payload

    async def receive(self, raw_payload: Dict[str, Any]) -> ChannelMessage:
        sender = raw_payload.get("sender", {})
        message = raw_payload.get("message", {})
        return ChannelMessage(
            message_id=str(message.get("message_token", f"viber-{int(time.time())}")),
            channel_name="viber",
            sender_id=str(sender.get("id", "viber-unknown")),
            content=message.get("text", raw_payload.get("text", "")),
            metadata=sender,
        )

    async def send(self, recipient_id: str, content: str) -> Dict[str, Any]:
        return {
            "platform": "viber",
            "receiver": recipient_id,
            "status": "sent",
            "text": content,
        }
