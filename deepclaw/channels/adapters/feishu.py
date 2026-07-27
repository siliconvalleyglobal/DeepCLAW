"""
Feishu / Lark Open Platform channel adapter.
"""

import time
from typing import Any, Dict
from deepclaw.channels.base_channel import BaseChannel, ChannelMessage


class FeishuChannel(BaseChannel):
    """Feishu / Lark channel adapter."""

    def __init__(self, app_id: str = "mock-feishu-app"):
        super().__init__(channel_name="feishu", permission_ceiling="external_channel")
        self.app_id = app_id

    def verify_sender(self, raw_payload: Dict[str, Any]) -> bool:
        return "header" in raw_payload or "event" in raw_payload or "open_id" in raw_payload

    async def receive(self, raw_payload: Dict[str, Any]) -> ChannelMessage:
        event = raw_payload.get("event", raw_payload)
        sender = event.get("sender", {}).get("sender_id", {})
        open_id = sender.get("open_id", event.get("open_id", "feishu-unknown"))
        message = event.get("message", event)
        return ChannelMessage(
            message_id=str(message.get("message_id", f"feishu-{int(time.time())}")),
            channel_name="feishu",
            sender_id=str(open_id),
            content=str(message.get("content", message.get("text", ""))),
            metadata={"open_id": open_id},
        )

    async def send(self, recipient_id: str, content: str) -> Dict[str, Any]:
        return {
            "platform": "feishu",
            "receive_id": recipient_id,
            "status": "sent",
            "text": content,
        }
