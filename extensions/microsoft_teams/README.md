# DeepCLAW Microsoft Teams Extension

Microsoft Teams channel adapter for DeepCLAW.

## Features

- Teams messaging integration
- Adaptive card support
- RBAC permission enforcement
- Audit logging

## Installation

```bash
pip install deepclaw[teams]
```

## Configuration

```python
from deepclaw.channels.adapters import MicrosoftTeamsChannel

channel = MicrosoftTeamsChannel(
  app_id="YOUR_APP_ID",
  app_password="YOUR_APP_PASSWORD",
  tenant_id="YOUR_TENANT_ID"
)
```

## License

MIT - [SILICON VALLEY GLOBAL PH INC](https://svg.ph)
