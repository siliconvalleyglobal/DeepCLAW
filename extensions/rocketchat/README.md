# DeepCLAW Rocket.Chat Extension

Rocket.Chat channel adapter for DeepCLAW.

## Features

- Rocket.Chat integration
- Message and livechat handling
- RBAC permission enforcement
- Audit logging

## Installation

```bash
pip install deepclaw[rocketchat]
```

## Configuration

```python
from deepclaw.channels.adapters import RocketChatChannel

channel = RocketChatChannel(
  host="https://chat.example.com",
  user_id="YOUR_USER_ID",
  token="YOUR_TOKEN"
)
```

## License

MIT - [SILICON VALLEY GLOBAL PH INC](https://svg.ph)
