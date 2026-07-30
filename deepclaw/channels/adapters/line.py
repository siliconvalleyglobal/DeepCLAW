"""
LINE Messaging API channel adapter.
"""

import time
from typing import Any, Dict
from deepclaw.channels.base_channel import BaseChannel, ChannelMessage


class LineChannel(BaseChannel):
    """LINE channel adapter enforcing external_channel permission ceiling."""

    def __init__(self, channel_secret: str = "mock-line-secret"):
        super().__init__(channel_name="line", permission_ceiling="external_channel")
        self.channel_secret = channel_secret

    def verify_sender(self, raw_payload: Dict[str, Any]) -> bool:
        return "events" in raw_payload or "replyToken" in raw_payload

    async def receive(self, raw_payload: Dict[str, Any]) -> ChannelMessage:
        events = raw_payload.get("events", [raw_payload])
        event = events[0] if events else {}
        source = event.get("source", {})
        message = event.get("message", {})
        return ChannelMessage(
            message_id=str(message.get("id", f"line-{int(time.time())}")),
            channel_name="line",
            sender_id=str(source.get("userId", "line-unknown")),
            content=message.get("text", ""),
            metadata=source,
        )

    async def send(self, recipient_id: str, content: str) -> Dict[str, Any]:
        return {
            "platform": "line",
            "user_id": recipient_id,
            "status": "sent",
            "text": content,
        }
