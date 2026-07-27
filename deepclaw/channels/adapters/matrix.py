"""
Matrix open protocol channel adapter.
"""

import time
from typing import Any, Dict
from deepclaw.channels.base_channel import BaseChannel, ChannelMessage


class MatrixChannel(BaseChannel):
    """Matrix open protocol adapter."""

    def __init__(self, homeserver_url: str = "https://matrix.org"):
        super().__init__(channel_name="matrix", permission_ceiling="external_channel")
        self.homeserver_url = homeserver_url

    def verify_sender(self, raw_payload: Dict[str, Any]) -> bool:
        return "event_id" in raw_payload or "sender" in raw_payload or "room_id" in raw_payload

    async def receive(self, raw_payload: Dict[str, Any]) -> ChannelMessage:
        sender = raw_payload.get("sender", "matrix-unknown")
        content = raw_payload.get("content", {})
        text = content.get("body", raw_payload.get("text", ""))
        return ChannelMessage(
            message_id=str(raw_payload.get("event_id", f"mtx-{int(time.time())}")),
            channel_name="matrix",
            sender_id=str(sender),
            content=str(text),
            metadata={"room_id": raw_payload.get("room_id")},
        )

    async def send(self, recipient_id: str, content: str) -> Dict[str, Any]:
        return {
            "platform": "matrix",
            "room_id": recipient_id,
            "status": "sent",
            "body": content,
        }
