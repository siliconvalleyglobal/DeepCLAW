"""
Embeddable WebChat widget channel adapter.
"""

import time
from typing import Any, Dict
from deepclaw.channels.base_channel import BaseChannel, ChannelMessage


class WebChatWidgetChannel(BaseChannel):
    """Embeddable website webchat widget channel adapter."""

    def __init__(self, widget_id: str = "deepclaw-webchat"):
        super().__init__(channel_name="webchat_widget", permission_ceiling="external_channel")
        self.widget_id = widget_id

    def verify_sender(self, raw_payload: Dict[str, Any]) -> bool:
        return "session_id" in raw_payload or "message" in raw_payload or "text" in raw_payload

    async def receive(self, raw_payload: Dict[str, Any]) -> ChannelMessage:
        session = raw_payload.get("session_id", raw_payload.get("visitor_id", "web-unknown"))
        return ChannelMessage(
            message_id=str(raw_payload.get("id", f"web-{int(time.time())}")),
            channel_name="webchat_widget",
            sender_id=str(session),
            content=str(raw_payload.get("message", raw_payload.get("text", ""))),
            metadata={"session_id": session},
        )

    async def send(self, recipient_id: str, content: str) -> Dict[str, Any]:
        return {
            "platform": "webchat_widget",
            "session_id": recipient_id,
            "status": "sent",
            "text": content,
        }
