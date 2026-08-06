# DeepCLAW Google Chat Extension

Google Chat channel adapter for DeepCLAW.

## Features

- Google Chat integration
- Space and direct message handling
- RBAC permission enforcement
- Audit logging

## Installation

```bash
pip install deepclaw[google_chat]
```

## Configuration

```python
from deepclaw.channels.adapters import GoogleChatChannel

channel = GoogleChatChannel(
  service_account_file="path/to/service_account.json"
)
```

## License

MIT - [SILICON VALLEY GLOBAL PH INC](https://svg.ph)
