"""
Google Chat API channel adapter.
"""

import time
from typing import Any, Dict
from deepclaw.channels.base_channel import BaseChannel, ChannelMessage


class GoogleChatChannel(BaseChannel):
    """Google Chat channel adapter."""

    def __init__(self, space_id: str = "mock-space-id"):
        super().__init__(channel_name="google_chat", permission_ceiling="external_channel")
        self.space_id = space_id

    def verify_sender(self, raw_payload: Dict[str, Any]) -> bool:
        return "space" in raw_payload or "user" in raw_payload or "message" in raw_payload

    async def receive(self, raw_payload: Dict[str, Any]) -> ChannelMessage:
        msg = raw_payload.get("message", raw_payload)
        user = msg.get("sender", msg.get("user", {})).get("name", "gchat-unknown")
        return ChannelMessage(
            message_id=str(msg.get("name", f"gchat-{int(time.time())}")),
            channel_name="google_chat",
            sender_id=str(user),
            content=str(msg.get("text", "")),
            metadata={"space_name": msg.get("space", {}).get("name")},
        )

    async def send(self, recipient_id: str, content: str) -> Dict[str, Any]:
        return {
            "platform": "google_chat",
            "space_name": recipient_id,
            "status": "sent",
            "text": content,
        }
