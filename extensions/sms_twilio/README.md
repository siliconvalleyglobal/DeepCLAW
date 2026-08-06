# DeepCLAW SMS Twilio Extension

SMS channel adapter for DeepCLAW via Twilio.

## Features

- Twilio SMS integration
- Message delivery tracking
- RBAC permission enforcement
- Audit logging

## Installation

```bash
pip install deepclaw[sms]
```

## Configuration

```python
from deepclaw.channels.adapters import SMSTwilioChannel

channel = SMSTwilioChannel(
  account_sid="YOUR_ACCOUNT_SID",
  auth_token="YOUR_AUTH_TOKEN",
  from_number="YOUR_TWILIO_NUMBER"
)
```

## License

MIT - [SILICON VALLEY GLOBAL PH INC](https://svg.ph)
