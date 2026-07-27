"""
In-process conversation context buffer.
"""

from typing import Any, Dict, List, Optional


class ShortTermMemory:
    """Bounded short-term conversation context buffer."""

    def __init__(self, max_messages: int = 50):
        self.max_messages = max_messages
        self.messages: List[Dict[str, Any]] = []

    def add_message(self, role: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        self.messages.append(
            {
                "role": role,
                "content": content,
                "metadata": metadata or {},
            }
        )
        if len(self.messages) > self.max_messages:
            self.messages = self.messages[-self.max_messages :]

    def get_context(self) -> List[Dict[str, Any]]:
        return list(self.messages)

    def clear(self) -> None:
        self.messages.clear()
