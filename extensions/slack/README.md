# DeepCLAW Slack Extension

Slack channel adapter for DeepCLAW.

## Features

- Slack event handling
- Message routing
- RBAC permission enforcement
- Audit logging

## Installation

```bash
pip install deepclaw[slack]
```

## Configuration

```python
from deepclaw.channels.adapters import SlackChannel

channel = SlackChannel(
    bot_token="xoxb-...",
    signing_secret="...",
)
```

## License

MIT - [SILICON VALLEY GLOBAL PH INC](https://svg.ph)
