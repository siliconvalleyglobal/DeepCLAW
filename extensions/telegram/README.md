# DeepCLAW Telegram Extension

Telegram channel adapter for DeepCLAW.

## Features

- Telegram Bot API integration
- Message and callback query handling
- RBAC permission enforcement
- Audit logging

## Installation

```bash
pip install deepclaw[telegram]
```

## Configuration

```python
from deepclaw.channels.adapters import TelegramChannel

channel = TelegramChannel(bot_token="YOUR_BOT_TOKEN")
```

## License

MIT - [SILICON VALLEY GLOBAL PH INC](https://svg.ph)
