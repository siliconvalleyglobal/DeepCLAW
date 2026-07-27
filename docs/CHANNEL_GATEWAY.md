# Governed Channel Gateway Guide 💬

DeepClaw routes inbound messaging traffic from 14+ chat and enterprise platforms through a central `ChannelRouter` enforcing per-channel RBAC permission ceilings.

---

## 🌐 Supported Channel Adapters (`deepclaw/channels/adapters/`)

| Adapter | Channel Name | Default Permission Ceiling | Description |
|:---|:---|:---:|:---|
| `telegram.py` | `telegram` | `external_channel` | Telegram Bot API |
| `whatsapp.py` | `whatsapp` | `external_channel` | WhatsApp Cloud API |
| `slack.py` | `slack` | `external_channel` | Slack Web API |
| `discord.py` | `discord` | `external_channel` | Discord Bot API |
| `imessage.py` | `imessage` | `external_channel` | iMessage / Apple Gateway |
| `wechat.py` | `wechat` | `external_channel` | WeChat Official & Work |
| `feishu.py` | `feishu` | `external_channel` | Feishu / Lark Open Platform |
| `matrix.py` | `matrix` | `external_channel` | Matrix Open Protocol |
| `microsoft_teams.py` | `microsoft_teams` | `external_channel` | Microsoft Teams Bot Framework |
| `google_chat.py` | `google_chat` | `external_channel` | Google Chat Space API |
| `sms_twilio.py` | `sms_twilio` | `external_channel` | Twilio SMS Gateway |
| `email_smtp.py` | `email_smtp` | `external_channel` | Email (SMTP / IMAP) |
| `webchat_widget.py` | `webchat_widget` | `external_channel` | Embeddable Web Chat Widget |
| `custom_webhook.py` | `custom_webhook` | `external_channel` | Generic HTTP Inbound Webhook |

---

## 🛠️ Registering Channel Adapters

```python
from deepclaw.channels import ChannelRouter
from deepclaw.channels.adapters import TelegramChannel, SlackChannel

router = ChannelRouter()
router.register_channel(TelegramChannel(bot_token="TG_TOKEN"))
router.register_channel(SlackChannel(bot_token="SLACK_TOKEN"))

# Route inbound payload
res = await router.route_inbound("telegram", raw_payload, agent_handler)
```
