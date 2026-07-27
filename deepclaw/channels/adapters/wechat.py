"""
WeChat Official Account / Work WeChat channel adapter.
"""

import time
from typing import Any, Dict
from deepclaw.channels.base_channel import BaseChannel, ChannelMessage


class WeChatChannel(BaseChannel):
    """WeChat channel adapter."""

    def __init__(self, app_id: str = "mock-wechat-appid"):
        super().__init__(channel_name="wechat", permission_ceiling="external_channel")
        self.app_id = app_id

    def verify_sender(self, raw_payload: Dict[str, Any]) -> bool:
        return "FromUserName" in raw_payload or "openid" in raw_payload or "Content" in raw_payload

    async def receive(self, raw_payload: Dict[str, Any]) -> ChannelMessage:
        openid = raw_payload.get("FromUserName", raw_payload.get("openid", "wechat-unknown"))
        return ChannelMessage(
            message_id=str(raw_payload.get("MsgId", f"wx-{int(time.time())}")),
            channel_name="wechat",
            sender_id=str(openid),
            content=str(raw_payload.get("Content", raw_payload.get("text", ""))),
            metadata={"openid": openid},
        )

    async def send(self, recipient_id: str, content: str) -> Dict[str, Any]:
        return {
            "platform": "wechat",
            "touser": recipient_id,
            "status": "sent",
            "text": content,
        }
