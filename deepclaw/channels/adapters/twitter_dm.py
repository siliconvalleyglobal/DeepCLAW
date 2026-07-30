"""
Twitter/X Direct Messaging API channel adapter.
"""

import time
from typing import Any, Dict
from deepclaw.channels.base_channel import BaseChannel, ChannelMessage


class TwitterDMChannel(BaseChannel):
    """Twitter/X Direct Message channel adapter enforcing external_channel permission ceiling."""

    def __init__(self, bearer_token: str = "mock-twitter-token"):
        super().__init__(channel_name="twitter_dm", permission_ceiling="external_channel")
        self.bearer_token = bearer_token

    def verify_sender(self, raw_payload: Dict[str, Any]) -> bool:
        return "direct_message_events" in raw_payload or "event" in raw_payload or "sender_id" in raw_payload

    async def receive(self, raw_payload: Dict[str, Any]) -> ChannelMessage:
        events = raw_payload.get("direct_message_events", [raw_payload])
        event = events[0] if events else {}
        message_create = event.get("message_create", {})
        sender_id = message_create.get("sender_id", raw_payload.get("sender_id", "tw-unknown"))
        target_data = message_create.get("message_data", {})
        return ChannelMessage(
            message_id=str(event.get("id", f"tw-{int(time.time())}")),
            channel_name="twitter_dm",
            sender_id=str(sender_id),
            content=target_data.get("text", raw_payload.get("text", "")),
            metadata={"sender_id": sender_id},
        )

    async def send(self, recipient_id: str, content: str) -> Dict[str, Any]:
        return {
            "platform": "twitter_dm",
            "participant_id": recipient_id,
            "status": "sent",
            "text": content,
        }
