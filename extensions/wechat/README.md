# DeepCLAW WeChat Extension

WeChat channel adapter for DeepCLAW.

## Features

- WeChat messaging integration
- Message and event handling
- RBAC permission enforcement
- Audit logging

## Installation

```bash
pip install deepclaw[wechat]
```

## Configuration

```python
from deepclaw.channels.adapters import WeChatChannel

channel = WeChatChannel(
  app_id="YOUR_APP_ID",
  app_secret="YOUR_APP_SECRET"
)
```

## License

MIT - [SILICON VALLEY GLOBAL PH INC](https://svg.ph)
