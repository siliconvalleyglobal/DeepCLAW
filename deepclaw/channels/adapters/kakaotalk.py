"""
KakaoTalk Business API channel adapter.
"""

import time
from typing import Any, Dict
from deepclaw.channels.base_channel import BaseChannel, ChannelMessage


class KakaoTalkChannel(BaseChannel):
    """KakaoTalk channel adapter enforcing external_channel permission ceiling."""

    def __init__(self, app_key: str = "mock-kakao-key"):
        super().__init__(channel_name="kakaotalk", permission_ceiling="external_channel")
        self.app_key = app_key

    def verify_sender(self, raw_payload: Dict[str, Any]) -> bool:
        return "user_id" in raw_payload or "user" in raw_payload or "user_key" in raw_payload

    async def receive(self, raw_payload: Dict[str, Any]) -> ChannelMessage:
        sender_id = raw_payload.get("user_id", raw_payload.get("user_key", "kakao-unknown"))
        content = raw_payload.get("content", raw_payload.get("text", ""))
        return ChannelMessage(
            message_id=str(raw_payload.get("message_id", f"kakao-{int(time.time())}")),
            channel_name="kakaotalk",
            sender_id=str(sender_id),
            content=content,
            metadata={"user": sender_id},
        )

    async def send(self, recipient_id: str, content: str) -> Dict[str, Any]:
        return {
            "platform": "kakaotalk",
            "user_key": recipient_id,
            "status": "sent",
            "text": content,
        }
