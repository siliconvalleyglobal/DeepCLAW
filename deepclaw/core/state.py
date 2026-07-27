"""
Durable state management and checkpointing for DeepClaw workflows.
"""

import time
import uuid
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class Checkpoint(BaseModel):
    """Snapshot of graph execution state at a specific step."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: float = Field(default_factory=time.time)
    node_id: str
    data: Dict[str, Any]
    paused: bool = False
    pending_human_approval: bool = False
    approval_metadata: Optional[Dict[str, Any]] = None


class State:
    """State object representing workflow state across graph executions."""

    def __init__(self, initial_data: Optional[Dict[str, Any]] = None):
        self._data: Dict[str, Any] = initial_data or {}
        self._checkpoints: List[Checkpoint] = []

    def get(self, key: str, default: Any = None) -> Any:
        return self._data.get(key, default)

    def set(self, key: str, value: Any) -> None:
        self._data[key] = value

    def update(self, new_data: Dict[str, Any]) -> None:
        self._data.update(new_data)

    def to_dict(self) -> Dict[str, Any]:
        return dict(self._data)

    def create_checkpoint(
        self,
        node_id: str,
        paused: bool = False,
        pending_human_approval: bool = False,
        approval_metadata: Optional[Dict[str, Any]] = None,
    ) -> Checkpoint:
        cp = Checkpoint(
            node_id=node_id,
            data=dict(self._data),
            paused=paused,
            pending_human_approval=pending_human_approval,
            approval_metadata=approval_metadata,
        )
        self._checkpoints.append(cp)
        return cp

    def latest_checkpoint(self) -> Optional[Checkpoint]:
        return self._checkpoints[-1] if self._checkpoints else None
