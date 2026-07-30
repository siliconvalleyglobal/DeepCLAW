"""
Telegram Channel Adapter with Real HTTP Bot API Payload Dispatch
"""

import json
import urllib.request
import urllib.parse
from typing import Dict, Any
from deepclaw.channels.base_channel import BaseChannel, BaseChannelAdapter, ChannelMessage

class TelegramAdapter(BaseChannel):

    def __init__(self, bot_token: str = None):
        super().__init__(channel_name="telegram")
        self.bot_token = bot_token

    def verify_sender(self, raw_payload: Dict[str, Any]) -> bool:
        return True

    async def receive(self, raw_payload: Dict[str, Any]) -> ChannelMessage:
        msg_data = raw_payload.get("message", {})
        return ChannelMessage(
            message_id=str(msg_data.get("message_id", "")),
            sender_id=str(msg_data.get("from", {}).get("id", "")),
            recipient_id=str(msg_data.get("chat", {}).get("id", "")),
            content=msg_data.get("text", ""),
            channel_name="telegram",
            timestamp=float(msg_data.get("date", 0)),
            metadata=raw_payload
        )

    async def send(self, recipient_id: str, content: str) -> Dict[str, Any]:
        token = self.bot_token or self.config.get("bot_token")
        if not token:
            return {"status": "sent_local_mode", "channel": "telegram", "recipient_id": recipient_id}

        url = f"https://api.telegram.org/bot{token}/sendMessage"
        payload = {
            "chat_id": recipient_id,
            "text": content
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})

        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                return {"status": "success", "channel": "telegram", "response": result}
        except Exception as e:
            return {"status": "failed", "channel": "telegram", "error": str(e)}

    # Synchronous helper
    def send_message(self, message: ChannelMessage) -> Dict[str, Any]:
        import asyncio
        return asyncio.run(self.send(message.recipient_id or message.sender_id, message.content))

TelegramChannel = TelegramAdapter
