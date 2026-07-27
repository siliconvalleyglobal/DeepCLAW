"""
Pre-execution policy engine enforcing Permit/Deny decisions before tool invocation.
"""

import time
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from deepclaw.governance.identity import AgentIdentity
from deepclaw.governance.rbac import RBACPolicy
from deepclaw.tools.guardrails import ToolGuardrails


class PolicyDecision(BaseModel):
    """Immutable audit record of a pre-execution policy evaluation."""

    decision_id: str
    timestamp: float = Field(default_factory=time.time)
    agent_id: str
    action: str
    permitted: bool
    reasoning_trace: str
    violations: List[str] = Field(default_factory=list)


class PreExecutionPolicyEngine:
    """Zero-Trust pre-execution policy enforcement engine."""

    def __init__(self, rbac: Optional[RBACPolicy] = None):
        self.rbac = rbac or RBACPolicy()

    def evaluate_tool_call(
        self,
        identity: AgentIdentity,
        tool_name: str,
        arguments: Dict[str, Any],
    ) -> PolicyDecision:
        violations = []

        # 1. Guardrail inspection
        safe, g_violations = ToolGuardrails.validate_arguments(tool_name, arguments)
        if not safe:
            violations.extend(g_violations)

        # 2. RBAC permission check
        permitted = self.rbac.is_permitted(identity.roles, tool_name)
        if not permitted and not violations:
            violations.append(f"Agent role(s) {identity.roles} lack permission for '{tool_name}'")

        is_allowed = len(violations) == 0 and permitted

        reason = (
            f"PERMITTED: Action '{tool_name}' authorized for agent {identity.agent_id}."
            if is_allowed
            else f"DENIED: Pre-execution policy check failed for '{tool_name}'. Violations: {violations}"
        )

        return PolicyDecision(
            decision_id=f"dec-{int(time.time()*1000)}",
            agent_id=identity.agent_id,
            action=tool_name,
            permitted=is_allowed,
            reasoning_trace=reason,
            violations=violations,
        )
