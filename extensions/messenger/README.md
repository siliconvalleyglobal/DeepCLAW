# DeepCLAW Meta Messenger Extension

Meta Messenger channel adapter for DeepCLAW.

## Features

- Meta Messenger integration
- Message and quick reply handling
- RBAC permission enforcement
- Audit logging

## Installation

```bash
pip install deepclaw[messenger]
```

## Configuration

```python
from deepclaw.channels.adapters import MessengerChannel

channel = MessengerChannel(
  page_access_token="YOUR_PAGE_ACCESS_TOKEN",
  app_secret="YOUR_APP_SECRET",
  verify_token="YOUR_VERIFY_TOKEN"
)
```

## License

MIT - [SILICON VALLEY GLOBAL PH INC](https://svg.ph)
