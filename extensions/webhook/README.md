# DeepCLAW Webhook Extension

Webhook channel adapter for DeepCLAW.

## Features

- Incoming webhook handling
- Outgoing webhook delivery
- Signature verification
- RBAC permission enforcement

## Installation

```bash
pip install deepclaw[webhook]
```

## Configuration

```python
from deepclaw.channels.adapters import WebhookChannel

channel = WebhookChannel(
  secret="YOUR_WEBHOOK_SECRET"
)
```

## License

MIT - [SILICON VALLEY GLOBAL PH INC](https://svg.ph)
