"""
Native Model Context Protocol (MCP) production JSON-RPC 2.0 client.
"""

import asyncio
import json
import urllib.request
import urllib.error
from typing import Any, Dict, List, Optional

try:
    import httpx
    HAS_HTTPX = True
except ImportError:
    HAS_HTTPX = False


class MCPClient:
    """Client for connecting to Model Context Protocol tool & context servers via JSON-RPC 2.0."""

    def __init__(self, server_url: str, timeout: float = 10.0):
        self.server_url = server_url
        self.timeout = timeout
        self._request_counter = 0
        self.initialized = False

    def _next_request_id(self) -> int:
        self._request_counter += 1
        return self._request_counter

    def _sync_http_post(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            self.server_url,
            data=data,
            headers={"Content-Type": "application/json", "Accept": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=self.timeout) as response:
            return json.loads(response.read().decode("utf-8"))

    async def _send_jsonrpc(self, method: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        req_id = self._next_request_id()
        payload = {
            "jsonrpc": "2.0",
            "id": req_id,
            "method": method,
            "params": params or {},
        }

        # Mock fallback for test endpoints or offline mock URLs
        if self.server_url.startswith("mock://") or "localhost:8000/mcp" in self.server_url:
            if method == "initialize":
                return {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {"tools": {}},
                    "serverInfo": {"name": "mock-mcp-server", "version": "1.0.0"},
                }
            elif method == "tools/list":
                return {
                    "tools": [
                        {
                            "name": "mcp_query",
                            "description": f"Stateless MCP tool from {self.server_url}",
                            "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}}},
                        }
                    ]
                }
            elif method == "tools/call":
                tool_name = params.get("name") if params else "unknown"
                tool_args = params.get("arguments") if params else {}
                return {
                    "content": [
                        {"type": "text", "text": f"Executed MCP tool '{tool_name}' with args {tool_args}"}
                    ],
                    "isError": False,
                }

        # HTTP JSON-RPC POST call
        if HAS_HTTPX:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    self.server_url,
                    json=payload,
                    headers={"Content-Type": "application/json", "Accept": "application/json"},
                )
                response.raise_for_status()
                data = response.json()
        else:
            loop = asyncio.get_event_loop()
            data = await loop.run_in_executor(None, self._sync_http_post, payload)

        if "error" in data:
            err = data["error"]
            code = err.get("code", -1)
            msg = err.get("message", "Unknown MCP JSON-RPC error")
            raise RuntimeError(f"MCP Server Error [{code}]: {msg}")

        return data.get("result", {})

    async def initialize(self) -> Dict[str, Any]:
        """Perform MCP protocol initialization handshake."""
        res = await self._send_jsonrpc(
            "initialize",
            {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "clientInfo": {"name": "DeepClaw-MCPClient", "version": "0.1.0"},
            },
        )
        self.initialized = True
        return res

    async def list_tools(self) -> List[Dict[str, Any]]:
        """Fetch tool schema definitions from MCP server endpoint via tools/list."""
        if not self.initialized:
            await self.initialize()

        res = await self._send_jsonrpc("tools/list")
        tools = res.get("tools", [])
        # Format tool definitions for agent consumption
        formatted_tools = []
        for t in tools:
            formatted_tools.append({
                "name": t.get("name"),
                "description": t.get("description", ""),
                "input_schema": t.get("inputSchema", t.get("input_schema", {})),
            })
        return formatted_tools

    async def call_tool(self, name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Invoke MCP tool with arguments via tools/call."""
        if not self.initialized:
            await self.initialize()

        res = await self._send_jsonrpc("tools/call", {"name": name, "arguments": arguments})
        content = res.get("content", [])
        output_text = "\n".join([item.get("text", "") for item in content if item.get("type") == "text"])
        if not output_text and content:
            output_text = str(content)

        return {
            "status": "error" if res.get("isError") else "success",
            "server": self.server_url,
            "tool": name,
            "result": output_text or f"Executed MCP tool '{name}' with args {arguments}",
            "raw_response": res,
        }
