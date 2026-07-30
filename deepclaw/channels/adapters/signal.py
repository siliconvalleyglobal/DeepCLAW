"""
Signal Messaging API channel adapter.
"""

import time
from typing import Any, Dict
from deepclaw.channels.base_channel import BaseChannel, ChannelMessage


class SignalChannel(BaseChannel):
    """Signal channel adapter enforcing external_channel permission ceiling."""

    def __init__(self, api_token: str = "mock-signal-token"):
        super().__init__(channel_name="signal", permission_ceiling="external_channel")
        self.api_token = api_token

    def verify_sender(self, raw_payload: Dict[str, Any]) -> bool:
        return "envelope" in raw_payload or "source" in raw_payload

    async def receive(self, raw_payload: Dict[str, Any]) -> ChannelMessage:
        envelope = raw_payload.get("envelope", raw_payload)
        sender = envelope.get("source", "signal-unknown")
        data = envelope.get("dataMessage", {})
        return ChannelMessage(
            message_id=str(data.get("timestamp", f"sig-{int(time.time())}")),
            channel_name="signal",
            sender_id=str(sender),
            content=data.get("message", raw_payload.get("text", "")),
            metadata={"source": sender},
        )

    async def send(self, recipient_id: str, content: str) -> Dict[str, Any]:
        return {
            "platform": "signal",
            "recipient": recipient_id,
            "status": "sent",
            "text": content,
        }
