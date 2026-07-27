"""
Role-Based Access Control (RBAC) permission ceilings for agents and channels.
"""

from enum import Enum
from typing import Dict, List, Set


class Role(str, Enum):
    ADMIN = "admin"
    WORKFLOW_OPERATOR = "workflow_operator"
    RESTRICTED_AGENT = "restricted_agent"
    EXTERNAL_CHANNEL = "external_channel"


class RBACPolicy:
    """RBAC matrix managing tool and action permissions."""

    def __init__(self):
        self._role_permissions: Dict[str, Set[str]] = {
            Role.ADMIN.value: {"*"},
            Role.WORKFLOW_OPERATOR.value: {"read", "write", "mcp_*", "db_query"},
            Role.RESTRICTED_AGENT.value: {"read", "mcp_query"},
            Role.EXTERNAL_CHANNEL.value: {"read_public", "send_reply"},
        }

    def is_permitted(self, roles: List[str], action: str) -> bool:
        for r in roles:
            perms = self._role_permissions.get(r, set())
            if "*" in perms or action in perms:
                return True
            for p in perms:
                if p.endswith("*") and action.startswith(p[:-1]):
                    return True
        return False
