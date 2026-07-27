"""
Example 02: Native Model Context Protocol (MCP) Tool Connection.
"""

import asyncio
from deepclaw.protocols.mcp_client import MCPClient


async def main():
    print("=== DeepClaw Example 02: MCP Tool Protocol Integration ===")
    client = MCPClient(server_url="http://localhost:8000/mcp")

    print("\n[1] Discovering stateless MCP tools...")
    tools = await client.list_tools()
    print("Discovered tools:", tools)

    print("\n[2] Executing MCP tool call...")
    res = await client.call_tool("mcp_query", {"query": "SELECT * FROM workspace_headcount"})
    print("MCP Response:", res)


if __name__ == "__main__":
    asyncio.run(main())
