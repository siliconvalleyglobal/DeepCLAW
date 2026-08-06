# DeepCLAW A2A Extension

Agent-to-Agent (A2A) protocol extension for DeepCLAW.

## Features

- A2A Agent Card discovery
- Task lifecycle management
- Cross-agent communication
- Secure message passing

## Installation

```bash
pip install deepclaw[a2a]
```

## Usage

```python
from deepclaw.protocols import A2AClient

a2a = A2AClient(agent_endpoint="http://agent-b.internal/a2a")
card = await a2a.fetch_agent_card()
task = await a2a.create_task(prompt="Analyze report", sender_id="agent-a")
```

## License

MIT - [SILICON VALLEY GLOBAL PH INC](https://svg.ph)
