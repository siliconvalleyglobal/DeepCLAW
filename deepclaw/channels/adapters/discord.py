"""
Discord Bot API channel adapter.
"""

import time
from typing import Any, Dict
from deepclaw.channels.base_channel import BaseChannel, ChannelMessage


class DiscordChannel(BaseChannel):
    """Discord channel adapter."""

    def __init__(self, bot_token: str = "mock-discord-token"):
        super().__init__(channel_name="discord", permission_ceiling="external_channel")
        self.bot_token = bot_token

    def verify_sender(self, raw_payload: Dict[str, Any]) -> bool:
        return "author" in raw_payload or "channel_id" in raw_payload

    async def receive(self, raw_payload: Dict[str, Any]) -> ChannelMessage:
        author = raw_payload.get("author", {})
        return ChannelMessage(
            message_id=str(raw_payload.get("id", f"dc-{int(time.time())}")),
            channel_name="discord",
            sender_id=str(author.get("id", "dc-unknown")),
            content=str(raw_payload.get("content", "")),
            metadata={"channel_id": raw_payload.get("channel_id")},
        )

    async def send(self, recipient_id: str, content: str) -> Dict[str, Any]:
        return {
            "platform": "discord",
            "channel_id": recipient_id,
            "status": "sent",
            "text": content,
        }
