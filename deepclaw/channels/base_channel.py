"""
Abstract base channel interface all messaging adapters implement.
"""

from abc import ABC, abstractmethod
import time
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class ChannelMessage(BaseModel):
    """Normalized message representation across platforms."""

    message_id: str
    channel_name: str
    sender_id: str
    content: str
    timestamp: float = Field(default_factory=time.time)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class BaseChannel(ABC):
    """Universal interface for messaging adapters."""

    def __init__(self, channel_name: str, permission_ceiling: str = "external_channel"):
        self.channel_name = channel_name
        self.permission_ceiling = permission_ceiling

    @abstractmethod
    async def receive(self, raw_payload: Dict[str, Any]) -> ChannelMessage:
        """Parse raw platform payload into normalized ChannelMessage."""
        pass

    @abstractmethod
    async def send(self, recipient_id: str, content: str) -> Dict[str, Any]:
        """Dispatch outbound message to platform."""
        pass

    @abstractmethod
    def verify_sender(self, raw_payload: Dict[str, Any]) -> bool:
        """Verify request signature or sender authentication."""
        pass
