"""
Pre-execution policy engine enforcing Permit/Deny decisions before action execution.
"""

import time
from enum import Enum
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field
from deepclaw.governance.identity import AgentIdentity
from deepclaw.governance.rbac import RBACPolicy
from deepclaw.tools.guardrails import ToolGuardrails


class ActionType(str, Enum):
    TOOL_CALL = "TOOL_CALL"
    MEMORY_WRITE = "MEMORY_WRITE"
    MEMORY_READ = "MEMORY_READ"
    CHANNEL_SEND = "CHANNEL_SEND"
    STATE_MUTATION = "STATE_MUTATION"


class PolicyDecision(BaseModel):
    """Immutable audit record of a pre-execution policy evaluation."""

    decision_id: str
    timestamp: float = Field(default_factory=time.time)
    agent_id: str
    action: str
    action_type: str = ActionType.TOOL_CALL.value
    target: Optional[str] = None
    tenant_id: Optional[str] = None
    permitted: bool
    reasoning_trace: str
    violations: List[str] = Field(default_factory=list)


class PreExecutionPolicyEngine:
    """Zero-Trust pre-execution policy enforcement engine."""

    def __init__(self, rbac: Optional[RBACPolicy] = None):
        self.rbac = rbac or RBACPolicy()

    def evaluate_action(
        self,
        identity: AgentIdentity,
        action_type: Union[ActionType, str],
        target: str,
        payload: Optional[Dict[str, Any]] = None,
    ) -> PolicyDecision:
        violations = []
        payload = payload or {}
        act_type_str = action_type.value if isinstance(action_type, ActionType) else str(action_type)

        # 1. Guardrail inspection (applicable to TOOL_CALL)
        if act_type_str == ActionType.TOOL_CALL.value:
            safe, g_violations = ToolGuardrails.validate_arguments(target, payload)
            if not safe:
                violations.extend(g_violations)

        # Map action type to permission check string
        action_perm_map = {
            ActionType.TOOL_CALL.value: target,
            ActionType.MEMORY_WRITE.value: "memory_write",
            ActionType.MEMORY_READ.value: "memory_read",
            ActionType.CHANNEL_SEND.value: "channel_send",
            ActionType.STATE_MUTATION.value: "state_mutation",
        }
        required_perm = action_perm_map.get(act_type_str, target)

        # 2. RBAC permission check
        permitted = self.rbac.is_permitted(identity.roles, required_perm)
        if not permitted and not violations:
            violations.append(
                f"Agent '{identity.agent_id}' with role(s) {identity.roles} lacks permission '{required_perm}' for action '{act_type_str}' on target '{target}'"
            )

        is_allowed = len(violations) == 0 and permitted

        reason = (
            f"PERMITTED: Action '{act_type_str}' on target '{target}' authorized for agent {identity.agent_id} (tenant: {identity.tenant_id})."
            if is_allowed
            else f"DENIED: Pre-execution policy check failed for action '{act_type_str}' on target '{target}'. Violations: {violations}"
        )

        return PolicyDecision(
            decision_id=f"dec-{int(time.time()*1000)}",
            agent_id=identity.agent_id,
            action=target,
            action_type=act_type_str,
            target=target,
            tenant_id=identity.tenant_id,
            permitted=is_allowed,
            reasoning_trace=reason,
            violations=violations,
        )

    def evaluate_tool_call(
        self,
        identity: AgentIdentity,
        tool_name: str,
        arguments: Dict[str, Any],
    ) -> PolicyDecision:
        return self.evaluate_action(
            identity=identity,
            action_type=ActionType.TOOL_CALL,
            target=tool_name,
            payload=arguments,
        )
