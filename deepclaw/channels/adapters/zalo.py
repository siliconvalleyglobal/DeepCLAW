"""
Zalo Official Account API channel adapter.
"""

import time
from typing import Any, Dict
from deepclaw.channels.base_channel import BaseChannel, ChannelMessage


class ZaloChannel(BaseChannel):
    """Zalo channel adapter enforcing external_channel permission ceiling."""

    def __init__(self, access_token: str = "mock-zalo-token"):
        super().__init__(channel_name="zalo", permission_ceiling="external_channel")
        self.access_token = access_token

    def verify_sender(self, raw_payload: Dict[str, Any]) -> bool:
        return "sender" in raw_payload or "recipient" in raw_payload or "user_id_by_app" in raw_payload

    async def receive(self, raw_payload: Dict[str, Any]) -> ChannelMessage:
        sender = raw_payload.get("sender", {})
        message = raw_payload.get("message", {})
        sender_id = sender.get("id", raw_payload.get("user_id_by_app", "zalo-unknown"))
        return ChannelMessage(
            message_id=str(message.get("msg_id", f"zalo-{int(time.time())}")),
            channel_name="zalo",
            sender_id=str(sender_id),
            content=message.get("text", raw_payload.get("text", "")),
            metadata=sender,
        )

    async def send(self, recipient_id: str, content: str) -> Dict[str, Any]:
        return {
            "platform": "zalo",
            "user_id": recipient_id,
            "status": "sent",
            "text": content,
        }
