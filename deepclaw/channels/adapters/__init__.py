"""
Platform channel adapters for Telegram, WhatsApp, Slack, Discord, iMessage, WeChat, Feishu, Matrix, Teams, Google Chat, Twilio SMS, Email, WebChat, Custom Webhooks, Signal, LINE, KakaoTalk, Messenger, Instagram DM, Twitter/X DM, Rocket.Chat, Mattermost, Zalo, and Viber.
"""

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
from deepclaw.channels.adapters.signal import SignalChannel
from deepclaw.channels.adapters.line import LineChannel
from deepclaw.channels.adapters.kakaotalk import KakaoTalkChannel
from deepclaw.channels.adapters.messenger import MessengerChannel
from deepclaw.channels.adapters.instagram_dm import InstagramDMChannel
from deepclaw.channels.adapters.twitter_dm import TwitterDMChannel
from deepclaw.channels.adapters.rocketchat import RocketChatChannel
from deepclaw.channels.adapters.mattermost import MattermostChannel
from deepclaw.channels.adapters.zalo import ZaloChannel
from deepclaw.channels.adapters.viber import ViberChannel

__all__ = [
    "TelegramChannel",
    "WhatsAppChannel",
    "SlackChannel",
    "DiscordChannel",
    "CustomWebhookChannel",
    "IMessageChannel",
    "WeChatChannel",
    "FeishuChannel",
    "MatrixChannel",
    "MicrosoftTeamsChannel",
    "GoogleChatChannel",
    "TwilioSMSChannel",
    "EmailChannel",
    "WebChatWidgetChannel",
    "SignalChannel",
    "LineChannel",
    "KakaoTalkChannel",
    "MessengerChannel",
    "InstagramDMChannel",
    "TwitterDMChannel",
    "RocketChatChannel",
    "MattermostChannel",
    "ZaloChannel",
    "ViberChannel",
]
