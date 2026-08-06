# DeepCLAW Feishu Extension

Feishu (Lark) channel adapter for DeepCLAW.

## Features

- Feishu messaging integration
- Event subscription handling
- RBAC permission enforcement
- Audit logging

## Installation

```bash
pip install deepclaw[feishu]
```

## Configuration

```python
from deepclaw.channels.adapters import FeishuChannel

channel = FeishuChannel(
  app_id="YOUR_APP_ID",
  app_secret="YOUR_APP_SECRET"
)
```

## License

MIT - [SILICON VALLEY GLOBAL PH INC](https://svg.ph)
