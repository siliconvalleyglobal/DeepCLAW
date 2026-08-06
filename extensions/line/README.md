# DeepCLAW LINE Extension

LINE channel adapter for DeepCLAW.

## Features

- LINE Messaging API integration
- Rich message support
- RBAC permission enforcement
- Audit logging

## Installation

```bash
pip install deepclaw[line]
```

## Configuration

```python
from deepclaw.channels.adapters import LineChannel

channel = LineChannel(
  channel_access_token="YOUR_CHANNEL_ACCESS_TOKEN",
  channel_secret="YOUR_CHANNEL_SECRET"
)
```

## License

MIT - [SILICON VALLEY GLOBAL PH INC](https://svg.ph)
