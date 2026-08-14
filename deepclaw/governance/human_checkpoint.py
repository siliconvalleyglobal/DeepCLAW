"""
Interrupt/approval points wired directly into graph execution.
"""

from typing import Any, Dict, List, Optional
import time
from deepclaw.core.state import State


class HumanCheckpointNode:
    """Approval checkpoint node requiring human intervention before proceeding."""

    def __init__(
        self,
        action_name: str,
        description: str,
        required_roles: Optional[List[str]] = None,
        timeout_seconds: Optional[float] = None,
        auto_action_on_timeout: str = "reject",
    ):
        self.action_name = action_name
        self.description = description
        self.required_roles = required_roles or []
        self.timeout_seconds = timeout_seconds
        self.auto_action_on_timeout = auto_action_on_timeout.lower()

    def __call__(self, state: State) -> Dict[str, Any]:
        approval_key = f"__approval_{self.action_name}__"
        approved = state.get(approval_key)
        
        # Check if already approved
        if approved is True:
            approver = state.get(f"__approver_{self.action_name}__", "system_admin")
            return {
                approval_key: True,
                "__paused__": False,
                "__approval_metadata__": {
                    "action": self.action_name,
                    "approved": True,
                    "approver": approver,
                    "timestamp": time.time(),
                },
            }
        elif approved is False:
            reason = state.get(f"__approval_reason_{self.action_name}__", "Denied by reviewer")
            raise PermissionError(f"Human approval explicitly denied for action '{self.action_name}': {reason}")

        # Check for timeout if checkpoint was already requested earlier
        requested_at = state.get(f"__approval_requested_at_{self.action_name}__")
        now = time.time()
        
        if requested_at and self.timeout_seconds:
            elapsed = now - float(requested_at)
            if elapsed >= self.timeout_seconds:
                if self.auto_action_on_timeout == "approve":
                    return {
                        approval_key: True,
                        "__paused__": False,
                        "__approval_metadata__": {
                            "action": self.action_name,
                            "approved": True,
                            "approver": "auto_timeout_policy",
                            "timestamp": now,
                        },
                    }
                else:
                    raise TimeoutError(f"Human approval for '{self.action_name}' timed out after {self.timeout_seconds}s")

        if not requested_at:
            state.set(f"__approval_requested_at_{self.action_name}__", now)

        # Pause execution pending human approval
        state.set("__paused__", True)
        return {
            "__paused__": True,
            "__pending_approval__": {
                "action": self.action_name,
                "description": self.description,
                "required_roles": self.required_roles,
                "requested_at": state.get(f"__approval_requested_at_{self.action_name}__"),
                "timeout_seconds": self.timeout_seconds,
            },
        }
