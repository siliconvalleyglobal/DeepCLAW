"""
Slack Web API channel adapter.
"""

import time
from typing import Any, Dict
from deepclaw.channels.base_channel import BaseChannel, ChannelMessage


class SlackChannel(BaseChannel):
    """Slack channel adapter."""

    def __init__(self, bot_token: str = "mock-slack-token"):
        super().__init__(channel_name="slack", permission_ceiling="external_channel")
        self.bot_token = bot_token

    def verify_sender(self, raw_payload: Dict[str, Any]) -> bool:
        return "event" in raw_payload or "channel" in raw_payload

    async def receive(self, raw_payload: Dict[str, Any]) -> ChannelMessage:
        event = raw_payload.get("event", raw_payload)
        return ChannelMessage(
            message_id=str(event.get("ts", f"slack-{int(time.time())}")),
            channel_name="slack",
            sender_id=str(event.get("user", "slack-unknown")),
            content=str(event.get("text", "")),
            metadata={"channel_id": event.get("channel")},
        )

    async def send(self, recipient_id: str, content: str) -> Dict[str, Any]:
        return {
            "platform": "slack",
            "channel": recipient_id,
            "status": "sent",
            "text": content,
        }
