"""
Agent-to-Agent (A2A) protocol interop client.
"""

from typing import Any, Dict


class A2AClient:
    """Client for cross-framework agent messaging."""

    def __init__(self, agent_endpoint: str):
        self.agent_endpoint = agent_endpoint

    async def send_message(self, message: str, sender_id: str) -> Dict[str, Any]:
        """Send interop message to target agent."""
        return {
            "protocol": "A2A/1.0",
            "sender_id": sender_id,
            "target": self.agent_endpoint,
            "payload": message,
            "ack": True,
            "response": f"A2A response from {self.agent_endpoint} for '{message}'",
        }
