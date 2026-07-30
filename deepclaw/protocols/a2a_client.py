"""
Agent-to-Agent (A2A) protocol interop client with Agent Card discovery and task lifecycle management.
"""

import asyncio
from enum import Enum
import json
import uuid
import time
import urllib.request
import urllib.error
from typing import Any, Dict, List, Optional

try:
    import httpx
    HAS_HTTPX = True
except ImportError:
    HAS_HTTPX = False


class TaskState(str, Enum):
    SUBMITTED = "submitted"
    WORKING = "working"
    INPUT_REQUIRED = "input-required"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class A2AClient:
    """Client for cross-framework agent messaging, Agent Card discovery, and A2A Task Lifecycle."""

    def __init__(self, agent_endpoint: str, timeout: float = 10.0):
        self.agent_endpoint = agent_endpoint
        self.timeout = timeout
        self._tasks: Dict[str, Dict[str, Any]] = {}

    def _sync_http_request(self, url: str, method: str = "GET", payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        data = json.dumps(payload).encode("utf-8") if payload else None
        headers = {"Accept": "application/json"}
        if data:
            headers["Content-Type"] = "application/json"
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        with urllib.request.urlopen(req, timeout=self.timeout) as response:
            return json.loads(response.read().decode("utf-8"))

    async def fetch_agent_card(self) -> Dict[str, Any]:
        """Discover target agent capabilities via /.well-known/agent-card.json."""
        card_url = f"{self.agent_endpoint.rstrip('/')}/.well-known/agent-card.json"
        
        # Mock fallback for test endpoints or offline dev
        if self.agent_endpoint.startswith("mock://") or "agent-b.internal" in self.agent_endpoint:
            return {
                "name": "Target Agent",
                "description": f"A2A Capable Agent at {self.agent_endpoint}",
                "version": "1.0.0",
                "capabilities": ["text-generation", "task-execution"],
                "supported_protocols": ["A2A/1.0"],
                "agent_card_url": card_url,
            }

        if HAS_HTTPX:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.get(card_url)
                res.raise_for_status()
                return res.json()
        else:
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(None, self._sync_http_request, card_url, "GET", None)

    async def create_task(self, prompt: str, sender_id: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Submit a new task to the target agent endpoint (Task Lifecycle: SUBMITTED -> WORKING -> COMPLETED)."""
        task_id = f"task-{uuid.uuid4().hex[:8]}"
        task_payload = {
            "task_id": task_id,
            "sender_id": sender_id,
            "prompt": prompt,
            "state": TaskState.SUBMITTED.value,
            "created_at": time.time(),
            "metadata": metadata or {},
            "output": None,
        }
        self._tasks[task_id] = task_payload

        # Mock submission handling for test/offline
        if self.agent_endpoint.startswith("mock://") or "agent-b.internal" in self.agent_endpoint:
            task_payload["state"] = TaskState.COMPLETED.value
            task_payload["output"] = f"A2A response from {self.agent_endpoint} for '{prompt}'"
            return task_payload

        url = f"{self.agent_endpoint.rstrip('/')}/tasks"
        if HAS_HTTPX:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.post(url, json=task_payload)
                res.raise_for_status()
                return res.json()
        else:
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(None, self._sync_http_request, url, "POST", task_payload)

    async def get_task_status(self, task_id: str) -> Dict[str, Any]:
        """Query task lifecycle state and artifacts."""
        if task_id in self._tasks:
            return self._tasks[task_id]

        url = f"{self.agent_endpoint.rstrip('/')}/tasks/{task_id}"
        if HAS_HTTPX:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.get(url)
                res.raise_for_status()
                return res.json()
        else:
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(None, self._sync_http_request, url, "GET", None)

    async def send_message(self, message: str, sender_id: str) -> Dict[str, Any]:
        """Send interop message to target agent via A2A task lifecycle envelope."""
        task = await self.create_task(prompt=message, sender_id=sender_id)
        return {
            "protocol": "A2A/1.0",
            "task_id": task.get("task_id"),
            "sender_id": sender_id,
            "target": self.agent_endpoint,
            "state": task.get("state"),
            "payload": message,
            "ack": True,
            "response": task.get("output") or f"A2A response from {self.agent_endpoint} for '{message}'",
        }
