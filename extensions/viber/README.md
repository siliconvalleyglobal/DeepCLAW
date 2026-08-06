# DeepCLAW Viber Extension

Viber channel adapter for DeepCLAW.

## Features

- Viber messaging integration
- Bot and PA messaging
- RBAC permission enforcement
- Audit logging

## Installation

```bash
pip install deepclaw[viber]
```

## Configuration

```python
from deepclaw.channels.adapters import ViberChannel

channel = ViberChannel(
  auth_token="YOUR_AUTH_TOKEN",
  bot_name="YOUR_BOT_NAME",
  avatar="YOUR_AVATAR_URL"
)
```

## License

MIT - [SILICON VALLEY GLOBAL PH INC](https://svg.ph)
