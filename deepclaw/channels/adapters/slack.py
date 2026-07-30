"""
Slack Channel Adapter with Real HTTP Webhook Payload Dispatch
"""

import json
import urllib.request
from typing import Dict, Any
from deepclaw.channels.base_channel import BaseChannel, BaseChannelAdapter, ChannelMessage

class SlackAdapter(BaseChannel):

    def __init__(self, webhook_url: str = None):
        super().__init__(channel_name="slack")
        self.webhook_url = webhook_url

    def verify_sender(self, raw_payload: Dict[str, Any]) -> bool:
        return True

    async def receive(self, raw_payload: Dict[str, Any]) -> ChannelMessage:
        event = raw_payload.get("event", {})
        return ChannelMessage(
            message_id=str(event.get("ts", "")),
            sender_id=str(event.get("user", "")),
            recipient_id=str(event.get("channel", "")),
            content=event.get("text", ""),
            channel_name="slack",
            timestamp=float(event.get("event_ts", 0)),
            metadata=raw_payload
        )

    async def send(self, recipient_id: str, content: str) -> Dict[str, Any]:
        url = self.webhook_url or self.config.get("webhook_url")
        if not url:
            return {"status": "sent_local_mode", "channel": "slack", "recipient_id": recipient_id}

        payload = {"text": content, "channel": recipient_id}
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})

        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                body = resp.read().decode("utf-8")
                return {"status": "success", "channel": "slack", "response": body}
        except Exception as e:
            return {"status": "failed", "channel": "slack", "error": str(e)}

SlackChannel = SlackAdapter
