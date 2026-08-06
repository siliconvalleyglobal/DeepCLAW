# DeepCLAW WebChat Widget Extension

WebChat Widget channel adapter for DeepCLAW.

## Features

- Embedded web chat widget
- Real-time messaging
- RBAC permission enforcement
- Audit logging

## Installation

```bash
pip install deepclaw[webchat]
```

## Configuration

```python
from deepclaw.channels.adapters import WebChatWidgetChannel

channel = WebChatWidgetChannel(
  widget_id="YOUR_WIDGET_ID"
)
```

## License

MIT - [SILICON VALLEY GLOBAL PH INC](https://svg.ph)
