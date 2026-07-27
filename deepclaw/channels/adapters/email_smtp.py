"""
Email SMTP / IMAP inbound & outbound channel adapter.
"""

import time
from typing import Any, Dict
from deepclaw.channels.base_channel import BaseChannel, ChannelMessage


class EmailChannel(BaseChannel):
    """Email treated as a governed messaging channel."""

    def __init__(self, smtp_server: str = "localhost"):
        super().__init__(channel_name="email_smtp", permission_ceiling="external_channel")
        self.smtp_server = smtp_server

    def verify_sender(self, raw_payload: Dict[str, Any]) -> bool:
        return "from_email" in raw_payload or "subject" in raw_payload or "body" in raw_payload

    async def receive(self, raw_payload: Dict[str, Any]) -> ChannelMessage:
        from_addr = raw_payload.get("from_email", raw_payload.get("from", "email-unknown"))
        body = raw_payload.get("body", raw_payload.get("text", ""))
        subject = raw_payload.get("subject", "No Subject")
        return ChannelMessage(
            message_id=str(raw_payload.get("message_id", f"email-{int(time.time())}")),
            channel_name="email_smtp",
            sender_id=str(from_addr),
            content=f"Subject: {subject}\n\n{body}",
            metadata={"subject": subject, "from_email": from_addr},
        )

    async def send(self, recipient_id: str, content: str) -> Dict[str, Any]:
        return {
            "platform": "email_smtp",
            "to": recipient_id,
            "status": "sent",
            "content": content,
        }
