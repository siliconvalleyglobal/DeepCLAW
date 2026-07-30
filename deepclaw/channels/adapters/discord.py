"""
Discord Channel Adapter with Real HTTP Webhook Payload Dispatch
"""

import json
import urllib.request
from typing import Dict, Any
from deepclaw.channels.base_channel import BaseChannel, BaseChannelAdapter, ChannelMessage

class DiscordAdapter(BaseChannel):

    def __init__(self, webhook_url: str = None):
        super().__init__(channel_name="discord")
        self.webhook_url = webhook_url

    def verify_sender(self, raw_payload: Dict[str, Any]) -> bool:
        return True

    async def receive(self, raw_payload: Dict[str, Any]) -> ChannelMessage:
        return ChannelMessage(
            message_id=str(raw_payload.get("id", "")),
            sender_id=str(raw_payload.get("author", {}).get("id", "")),
            recipient_id=str(raw_payload.get("channel_id", "")),
            content=raw_payload.get("content", ""),
            channel_name="discord",
            timestamp=0.0,
            metadata=raw_payload
        )

    async def send(self, recipient_id: str, content: str) -> Dict[str, Any]:
        url = self.webhook_url or self.config.get("webhook_url")
        if not url:
            return {"status": "sent_local_mode", "channel": "discord", "recipient_id": recipient_id}

        payload = {"content": content}
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json", "User-Agent": "DeepCLAW-Bot"})

        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                return {"status": "success", "channel": "discord", "http_code": resp.status}
        except Exception as e:
            return {"status": "failed", "channel": "discord", "error": str(e)}

DiscordChannel = DiscordAdapter
