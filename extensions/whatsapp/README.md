# DeepCLAW WhatsApp Extension

WhatsApp channel adapter for DeepCLAW.

## Features

- WhatsApp Business API integration
- Message and media handling
- RBAC permission enforcement
- Audit logging

## Installation

```bash
pip install deepclaw[whatsapp]
```

## Configuration

```python
from deepclaw.channels.adapters import WhatsAppChannel

channel = WhatsAppChannel(
  phone_number_id="YOUR_PHONE_NUMBER_ID",
  access_token="YOUR_ACCESS_TOKEN"
)
```

## License

MIT - [SILICON VALLEY GLOBAL PH INC](https://svg.ph)
