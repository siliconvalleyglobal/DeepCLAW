"""
Example 04: Governed Multi-Channel Messaging Gateway (Telegram + WhatsApp + Webhook).
"""

import asyncio
from deepclaw.channels.channel_router import ChannelRouter
from deepclaw.channels.adapters.telegram import TelegramChannel
from deepclaw.channels.adapters.whatsapp import WhatsAppChannel
from deepclaw.channels.adapters.custom_webhook import CustomWebhookChannel
from deepclaw.channels.base_channel import ChannelMessage
from deepclaw.governance.identity import AgentIdentity


async def agent_handler(msg: ChannelMessage, identity: AgentIdentity):
    return f"Governed Response ({identity.channel_origin}) for '{msg.content}'"


async def main():
    print("=== DeepClaw Example 04: Governed Multi-Channel Gateway ===")
    router = ChannelRouter()

    router.register_channel(TelegramChannel())
    router.register_channel(WhatsAppChannel())
    router.register_channel(CustomWebhookChannel())

    # Simulate inbound Telegram message
    tg_payload = {
        "update_id": 1,
        "message": {"message_id": 10, "from": {"id": 123}, "text": "What is our Q3 headcount?"},
    }

    res = await router.route_inbound("telegram", tg_payload, agent_handler)
    print("\n[Telegram Route Result]:")
    print("Permitted:", res["decision"]["permitted"])
    print("Response:", res["handler_result"])


if __name__ == "__main__":
    asyncio.run(main())
