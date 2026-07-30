"""
Unit tests for messaging channels and channel router governance across all 24 platform adapters.
"""

import pytest
from deepclaw.channels.channel_router import ChannelRouter
from deepclaw.channels.adapters import (
    TelegramChannel,
    WhatsAppChannel,
    SlackChannel,
    DiscordChannel,
    CustomWebhookChannel,
    IMessageChannel,
    WeChatChannel,
    FeishuChannel,
    MatrixChannel,
    MicrosoftTeamsChannel,
    GoogleChatChannel,
    TwilioSMSChannel,
    EmailChannel,
    WebChatWidgetChannel,
    SignalChannel,
    LineChannel,
    KakaoTalkChannel,
    MessengerChannel,
    InstagramDMChannel,
    TwitterDMChannel,
    RocketChatChannel,
    MattermostChannel,
    ZaloChannel,
    ViberChannel,
)
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
async def test_signal_channel_routing():
    router = ChannelRouter()
    router.register_channel(SignalChannel())

    raw_payload = {
        "envelope": {"source": "+1234567890", "dataMessage": {"message": "Secret Signal message"}}
    }

    async def handler(msg: ChannelMessage, identity: AgentIdentity):
        assert identity.channel_origin == "signal"
        return f"Echo: {msg.content}"

    res = await router.route_inbound("signal", raw_payload, handler)
    assert res["status"] == "routed_and_executed"
    assert res["handler_result"] == "Echo: Secret Signal message"


@pytest.mark.asyncio
async def test_all_24_adapters_registration():
    adapters = [
        TelegramChannel(),
        WhatsAppChannel(),
        SlackChannel(),
        DiscordChannel(),
        CustomWebhookChannel(),
        IMessageChannel(),
        WeChatChannel(),
        FeishuChannel(),
        MatrixChannel(),
        MicrosoftTeamsChannel(),
        GoogleChatChannel(),
        TwilioSMSChannel(),
        EmailChannel(),
        WebChatWidgetChannel(),
        SignalChannel(),
        LineChannel(),
        KakaoTalkChannel(),
        MessengerChannel(),
        InstagramDMChannel(),
        TwitterDMChannel(),
        RocketChatChannel(),
        MattermostChannel(),
        ZaloChannel(),
        ViberChannel(),
    ]

    router = ChannelRouter()
    for adapter in adapters:
        router.register_channel(adapter)

    assert len(router.channels) == 24
    assert len(adapters) == 24
