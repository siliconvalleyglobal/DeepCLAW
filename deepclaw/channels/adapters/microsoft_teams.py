"""
Microsoft Teams Bot Framework channel adapter.
"""

import time
from typing import Any, Dict
from deepclaw.channels.base_channel import BaseChannel, ChannelMessage


class MicrosoftTeamsChannel(BaseChannel):
    """Microsoft Teams channel adapter."""

    def __init__(self, app_id: str = "mock-teams-appid"):
        super().__init__(channel_name="microsoft_teams", permission_ceiling="external_channel")
        self.app_id = app_id

    def verify_sender(self, raw_payload: Dict[str, Any]) -> bool:
        return "from" in raw_payload or "conversation" in raw_payload or "text" in raw_payload

    async def receive(self, raw_payload: Dict[str, Any]) -> ChannelMessage:
        sender = raw_payload.get("from", {}).get("id", "teams-unknown")
        return ChannelMessage(
            message_id=str(raw_payload.get("id", f"teams-{int(time.time())}")),
            channel_name="microsoft_teams",
            sender_id=str(sender),
            content=str(raw_payload.get("text", "")),
            metadata={"conversation_id": raw_payload.get("conversation", {}).get("id")},
        )

    async def send(self, recipient_id: str, content: str) -> Dict[str, Any]:
        return {
            "platform": "microsoft_teams",
            "conversation_id": recipient_id,
            "status": "sent",
            "text": content,
        }
