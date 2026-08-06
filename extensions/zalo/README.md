# DeepCLAW Zalo Extension

Zalo channel adapter for DeepCLAW.

## Features

- Zalo messaging integration
- Official account messaging
- RBAC permission enforcement
- Audit logging

## Installation

```bash
pip install deepclaw[zalo]
```

## Configuration

```python
from deepclaw.channels.adapters import ZaloChannel

channel = ZaloChannel(
  access_token="YOUR_ACCESS_TOKEN"
)
```

## License

MIT - [SILICON VALLEY GLOBAL PH INC](https://svg.ph)
