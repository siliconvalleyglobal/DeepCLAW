# DeepCLAW Twitter/X DM Extension

Twitter/X DM channel adapter for DeepCLAW.

## Features

- Twitter/X messaging integration
- Direct message handling
- RBAC permission enforcement
- Audit logging

## Installation

```bash
pip install deepclaw[twitter]
```

## Configuration

```python
from deepclaw.channels.adapters import TwitterDMChannel

channel = TwitterDMChannel(
  api_key="YOUR_API_KEY",
  api_secret="YOUR_API_SECRET",
  access_token="YOUR_ACCESS_TOKEN",
  access_token_secret="YOUR_ACCESS_TOKEN_SECRET"
)
```

## License

MIT - [SILICON VALLEY GLOBAL PH INC](https://svg.ph)
