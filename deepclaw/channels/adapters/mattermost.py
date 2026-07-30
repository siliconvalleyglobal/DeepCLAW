"""
Mattermost Webhook and API channel adapter.
"""

import time
from typing import Any, Dict
from deepclaw.channels.base_channel import BaseChannel, ChannelMessage


class MattermostChannel(BaseChannel):
    """Mattermost channel adapter enforcing external_channel permission ceiling."""

    def __init__(self, bot_token: str = "mock-mattermost-token"):
        super().__init__(channel_name="mattermost", permission_ceiling="external_channel")
        self.bot_token = bot_token

    def verify_sender(self, raw_payload: Dict[str, Any]) -> bool:
        return "post" in raw_payload or "user_id" in raw_payload or "channel_id" in raw_payload

    async def receive(self, raw_payload: Dict[str, Any]) -> ChannelMessage:
        post = raw_payload.get("post", raw_payload)
        if isinstance(post, str):
            try:
                import json
                post = json.loads(post)
            except Exception:
                post = {}
        sender_id = post.get("user_id", raw_payload.get("user_id", "mm-unknown"))
        return ChannelMessage(
            message_id=str(post.get("id", f"mm-{int(time.time())}")),
            channel_name="mattermost",
            sender_id=str(sender_id),
            content=post.get("message", raw_payload.get("text", "")),
            metadata={"user_id": sender_id},
        )

    async def send(self, recipient_id: str, content: str) -> Dict[str, Any]:
        return {
            "platform": "mattermost",
            "channel_id": recipient_id,
            "status": "sent",
            "text": content,
        }
