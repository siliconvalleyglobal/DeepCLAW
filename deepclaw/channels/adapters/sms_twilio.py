"""
Twilio SMS gateway channel adapter.
"""

import time
from typing import Any, Dict
from deepclaw.channels.base_channel import BaseChannel, ChannelMessage


class TwilioSMSChannel(BaseChannel):
    """SMS via Twilio channel adapter."""

    def __init__(self, account_sid: str = "mock-sid"):
        super().__init__(channel_name="sms_twilio", permission_ceiling="external_channel")
        self.account_sid = account_sid

    def verify_sender(self, raw_payload: Dict[str, Any]) -> bool:
        return "From" in raw_payload or "Body" in raw_payload or "SmsSid" in raw_payload

    async def receive(self, raw_payload: Dict[str, Any]) -> ChannelMessage:
        sender = raw_payload.get("From", "sms-unknown")
        body = raw_payload.get("Body", raw_payload.get("text", ""))
        return ChannelMessage(
            message_id=str(raw_payload.get("SmsSid", f"sms-{int(time.time())}")),
            channel_name="sms_twilio",
            sender_id=str(sender),
            content=str(body),
            metadata={"from_number": sender},
        )

    async def send(self, recipient_id: str, content: str) -> Dict[str, Any]:
        return {
            "platform": "sms_twilio",
            "to": recipient_id,
            "status": "sent",
            "body": content,
        }
