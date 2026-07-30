"""
Meta Messenger API channel adapter.
"""

import time
from typing import Any, Dict
from deepclaw.channels.base_channel import BaseChannel, ChannelMessage


class MessengerChannel(BaseChannel):
    """Facebook Messenger channel adapter enforcing external_channel permission ceiling."""

    def __init__(self, page_token: str = "mock-messenger-token"):
        super().__init__(channel_name="messenger", permission_ceiling="external_channel")
        self.page_token = page_token

    def verify_sender(self, raw_payload: Dict[str, Any]) -> bool:
        return "entry" in raw_payload or "messaging" in raw_payload or "sender" in raw_payload

    async def receive(self, raw_payload: Dict[str, Any]) -> ChannelMessage:
        entries = raw_payload.get("entry", [raw_payload])
        entry = entries[0] if entries else {}
        messaging = entry.get("messaging", [raw_payload])
        event = messaging[0] if messaging else {}
        sender = event.get("sender", {})
        message = event.get("message", {})
        return ChannelMessage(
            message_id=str(message.get("mid", f"msg-{int(time.time())}")),
            channel_name="messenger",
            sender_id=str(sender.get("id", "msg-unknown")),
            content=message.get("text", raw_payload.get("text", "")),
            metadata=sender,
        )

    async def send(self, recipient_id: str, content: str) -> Dict[str, Any]:
        return {
            "platform": "messenger",
            "recipient_id": recipient_id,
            "status": "sent",
            "text": content,
        }
