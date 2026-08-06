# DeepCLAW Email SMTP Extension

Email SMTP channel adapter for DeepCLAW.

## Features

- SMTP email sending
- HTML and plain text support
- Attachment support
- RBAC permission enforcement

## Installation

```bash
pip install deepclaw[email]
```

## Configuration

```python
from deepclaw.channels.adapters import EmailSMTPChannel

channel = EmailSMTPChannel(
  smtp_host="smtp.example.com",
  smtp_port=587,
  username="user@example.com",
  password="password"
)
```

## License

MIT - [SILICON VALLEY GLOBAL PH INC](https://svg.ph)
