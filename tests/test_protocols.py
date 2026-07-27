"""
Unit tests for MCP tool protocol and A2A interop client.
"""

import pytest
from deepclaw.protocols.mcp_client import MCPClient
from deepclaw.protocols.a2a_client import A2AClient


@pytest.mark.asyncio
async def test_mcp_client():
    client = MCPClient(server_url="http://localhost:8000/mcp")
    tools = await client.list_tools()
    assert len(tools) == 1
    assert tools[0]["name"] == "mcp_query"

    res = await client.call_tool("mcp_query", {"query": "test"})
    assert res["status"] == "success"
    assert "mcp_query" in res["result"]


@pytest.mark.asyncio
async def test_a2a_client():
    client = A2AClient(agent_endpoint="http://agent-b.internal/a2a")
    res = await client.send_message(message="Ping", sender_id="agent-a")
    assert res["ack"] is True
    assert res["protocol"] == "A2A/1.0"
