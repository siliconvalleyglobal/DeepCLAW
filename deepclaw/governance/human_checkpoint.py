"""
Interrupt/approval points wired directly into graph execution.
"""

from typing import Any, Dict
from deepclaw.core.state import State


class HumanCheckpointNode:
    """Approval checkpoint node requiring human intervention before proceeding."""

    def __init__(self, action_name: str, description: str):
        self.action_name = action_name
        self.description = description

    def __call__(self, state: State) -> Dict[str, Any]:
        approved = state.get(f"__approval_{self.action_name}__")
        if approved is True:
            return {f"__approval_{self.action_name}__": True, "__paused__": False}
        elif approved is False:
            raise PermissionError(f"Human approval explicitly denied for action '{self.action_name}'")
        
        # Pause execution pending approval
        state.set("__paused__", True)
        return {
            "__paused__": True,
            "__pending_approval__": {
                "action": self.action_name,
                "description": self.description,
            },
        }
