"""
Unit tests for messaging channels and channel router governance across all platform adapters.
"""

import pytest
from deepclaw.channels.channel_router import ChannelRouter
from deepclaw.channels.adapters.telegram import TelegramChannel
from deepclaw.channels.adapters.whatsapp import WhatsAppChannel
from deepclaw.channels.adapters.slack import SlackChannel
from deepclaw.channels.adapters.discord import DiscordChannel
from deepclaw.channels.adapters.custom_webhook import CustomWebhookChannel
from deepclaw.channels.adapters.imessage import IMessageChannel
from deepclaw.channels.adapters.wechat import WeChatChannel
from deepclaw.channels.adapters.feishu import FeishuChannel
from deepclaw.channels.adapters.matrix import MatrixChannel
from deepclaw.channels.adapters.microsoft_teams import MicrosoftTeamsChannel
from deepclaw.channels.adapters.google_chat import GoogleChatChannel
from deepclaw.channels.adapters.sms_twilio import TwilioSMSChannel
from deepclaw.channels.adapters.email_smtp import EmailChannel
from deepclaw.channels.adapters.webchat_widget import WebChatWidgetChannel
from deepclaw.channels.base_channel import ChannelMessage
from deepclaw.governance.identity import AgentIdentity


@pytest.mark.asyncio
async def test_telegram_channel_routing():
    router = ChannelRouter()
    router.register_channel(TelegramChannel())

    raw_payload = {
        "update_id": 100,
        "message": {"message_id": 1, "from": {"id": 999}, "text": "Hello Telegram"},
    }

    async def handler(msg: ChannelMessage, identity: AgentIdentity):
        assert identity.channel_origin == "telegram"
        return f"Echo: {msg.content}"

    res = await router.route_inbound("telegram", raw_payload, handler)
    assert res["status"] == "routed_and_executed"
    assert res["handler_result"] == "Echo: Hello Telegram"


@pytest.mark.asyncio
async def test_imessage_channel_routing():
    router = ChannelRouter()
    router.register_channel(IMessageChannel())

    raw_payload = {"sender_handle": "user@apple.com", "body": "Hello iMessage"}

    async def handler(msg: ChannelMessage, identity: AgentIdentity):
        assert identity.channel_origin == "imessage"
        return f"Echo: {msg.content}"

    res = await router.route_inbound("imessage", raw_payload, handler)
    assert res["status"] == "routed_and_executed"
    assert res["handler_result"] == "Echo: Hello iMessage"


@pytest.mark.asyncio
async def test_all_adapters_registration():
    adapters = [
        WhatsAppChannel(),
        SlackChannel(),
        DiscordChannel(),
        CustomWebhookChannel(),
        WeChatChannel(),
        FeishuChannel(),
        MatrixChannel(),
        MicrosoftTeamsChannel(),
        GoogleChatChannel(),
        TwilioSMSChannel(),
        EmailChannel(),
        WebChatWidgetChannel(),
    ]

    router = ChannelRouter()
    for adapter in adapters:
        router.register_channel(adapter)

    assert len(router.channels) == len(adapters)
