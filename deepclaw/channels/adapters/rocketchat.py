"""
Rocket.Chat API channel adapter.
"""

import time
from typing import Any, Dict
from deepclaw.channels.base_channel import BaseChannel, ChannelMessage


class RocketChatChannel(BaseChannel):
    """Rocket.Chat channel adapter enforcing external_channel permission ceiling."""

    def __init__(self, auth_token: str = "mock-rocketchat-token"):
        super().__init__(channel_name="rocketchat", permission_ceiling="external_channel")
        self.auth_token = auth_token

    def verify_sender(self, raw_payload: Dict[str, Any]) -> bool:
        return "message" in raw_payload or "_id" in raw_payload or "u" in raw_payload

    async def receive(self, raw_payload: Dict[str, Any]) -> ChannelMessage:
        msg = raw_payload.get("message", raw_payload)
        user = msg.get("u", {})
        return ChannelMessage(
            message_id=str(msg.get("_id", f"rc-{int(time.time())}")),
            channel_name="rocketchat",
            sender_id=str(user.get("_id", user.get("username", "rc-unknown"))),
            content=msg.get("msg", raw_payload.get("text", "")),
            metadata=user,
        )

    async def send(self, recipient_id: str, content: str) -> Dict[str, Any]:
        return {
            "platform": "rocketchat",
            "room_id": recipient_id,
            "status": "sent",
            "text": content,
        }
