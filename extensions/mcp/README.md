# DeepCLAW MCP Extension

Model Context Protocol (MCP) extension for DeepCLAW.

## Features

- JSON-RPC 2.0 MCP client
- Tool discovery and invocation
- Agent Card integration
- A2A task lifecycle management

## Installation

```bash
pip install deepclaw[mcp]
```

## Usage

```python
from deepclaw.protocols import MCPClient

mcp = MCPClient(server_url="http://localhost:8000/mcp")
tools = await mcp.list_tools()
res = await mcp.call_tool("mcp_query", {"query": "deepclaw"})
```

## License

MIT - [SILICON VALLEY GLOBAL PH INC](https://svg.ph)
