"""
Telegram Bot API channel adapter.
"""

import time
from typing import Any, Dict
from deepclaw.channels.base_channel import BaseChannel, ChannelMessage


class TelegramChannel(BaseChannel):
    """Telegram channel adapter enforcing external_channel permission ceiling."""

    def __init__(self, bot_token: str = "mock-telegram-token"):
        super().__init__(channel_name="telegram", permission_ceiling="external_channel")
        self.bot_token = bot_token

    def verify_sender(self, raw_payload: Dict[str, Any]) -> bool:
        return "update_id" in raw_payload or "message" in raw_payload

    async def receive(self, raw_payload: Dict[str, Any]) -> ChannelMessage:
        msg = raw_payload.get("message", {})
        sender = msg.get("from", {})
        return ChannelMessage(
            message_id=str(msg.get("message_id", f"tg-{int(time.time())}")),
            channel_name="telegram",
            sender_id=str(sender.get("id", "tg-unknown")),
            content=msg.get("text", ""),
            metadata=sender,
        )

    async def send(self, recipient_id: str, content: str) -> Dict[str, Any]:
        return {
            "platform": "telegram",
            "chat_id": recipient_id,
            "status": "sent",
            "text": content,
        }
