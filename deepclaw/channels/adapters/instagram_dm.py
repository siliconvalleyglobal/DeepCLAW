"""
Instagram Direct Messaging API channel adapter.
"""

import time
from typing import Any, Dict
from deepclaw.channels.base_channel import BaseChannel, ChannelMessage


class InstagramDMChannel(BaseChannel):
    """Instagram Direct Messaging channel adapter enforcing external_channel permission ceiling."""

    def __init__(self, access_token: str = "mock-instagram-token"):
        super().__init__(channel_name="instagram_dm", permission_ceiling="external_channel")
        self.access_token = access_token

    def verify_sender(self, raw_payload: Dict[str, Any]) -> bool:
        return "entry" in raw_payload or "messaging" in raw_payload or "ig_id" in raw_payload

    async def receive(self, raw_payload: Dict[str, Any]) -> ChannelMessage:
        entries = raw_payload.get("entry", [raw_payload])
        entry = entries[0] if entries else {}
        messaging = entry.get("messaging", [raw_payload])
        event = messaging[0] if messaging else {}
        sender = event.get("sender", {})
        message = event.get("message", {})
        return ChannelMessage(
            message_id=str(message.get("mid", f"ig-{int(time.time())}")),
            channel_name="instagram_dm",
            sender_id=str(sender.get("id", "ig-unknown")),
            content=message.get("text", raw_payload.get("text", "")),
            metadata=sender,
        )

    async def send(self, recipient_id: str, content: str) -> Dict[str, Any]:
        return {
            "platform": "instagram_dm",
            "ig_user_id": recipient_id,
            "status": "sent",
            "text": content,
        }
