"""
Unit tests for production MCP JSON-RPC protocol client and A2A Agent Card & Task Lifecycle client.
"""

import pytest
from deepclaw.protocols.mcp_client import MCPClient
from deepclaw.protocols.a2a_client import A2AClient, TaskState


@pytest.mark.asyncio
async def test_mcp_client_protocol():
    client = MCPClient(server_url="http://localhost:8000/mcp")
    
    # Initialization handshake
    init_res = await client.initialize()
    assert client.initialized is True
    assert "serverInfo" in init_res

    # List tools via tools/list
    tools = await client.list_tools()
    assert len(tools) == 1
    assert tools[0]["name"] == "mcp_query"
    assert "input_schema" in tools[0]

    # Call tool via tools/call
    res = await client.call_tool("mcp_query", {"query": "test query"})
    assert res["status"] == "success"
    assert "mcp_query" in res["result"]


@pytest.mark.asyncio
async def test_a2a_client_lifecycle():
    client = A2AClient(agent_endpoint="http://agent-b.internal/a2a")

    # Fetch Agent Card
    card = await client.fetch_agent_card()
    assert card["name"] == "Target Agent"
    assert "A2A/1.0" in card["supported_protocols"]

    # Create task (Task Lifecycle)
    task = await client.create_task(prompt="Analyze report", sender_id="agent-a")
    assert task["state"] == TaskState.COMPLETED.value
    assert "task_id" in task

    # Query task status
    status = await client.get_task_status(task["task_id"])
    assert status["task_id"] == task["task_id"]

    # Send message wrapper
    res = await client.send_message(message="Ping", sender_id="agent-a")
    assert res["ack"] is True
    assert res["protocol"] == "A2A/1.0"
    assert res["state"] == TaskState.COMPLETED.value
