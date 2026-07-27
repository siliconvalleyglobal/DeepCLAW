"""
Reference governed assistant demonstrating Zero-Trust agent execution.
"""

from typing import Any, Dict
from deepclaw.core.agent import BaseAgent
from deepclaw.governance.identity import AgentIdentity
from deepclaw.governance.policy import PreExecutionPolicyEngine, PolicyDecision
from deepclaw.governance.audit_log import AuditLogger


class GovernedAssistant(BaseAgent):
    """Reference AI agent wired with Zero-Trust pre-execution policy checks."""

    def __init__(self, name: str = "EnterpriseGovernedAssistant"):
        super().__init__(name=name, role="enterprise_assistant")
        self.identity = AgentIdentity(
            agent_id=self.agent_id,
            name=self.name,
            roles=["workflow_operator"],
        )
        self.policy_engine = PreExecutionPolicyEngine()
        self.audit_logger = AuditLogger()

    async def execute_tool_safely(self, tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        decision: PolicyDecision = self.policy_engine.evaluate_tool_call(
            identity=self.identity,
            tool_name=tool_name,
            arguments=args,
        )

        self.audit_logger.log_policy_decision(decision, metadata={"args": args})

        if not decision.permitted:
            raise PermissionError(
                f"Action '{tool_name}' blocked by pre-execution policy: {decision.reasoning_trace}"
            )

        return {
            "status": "executed",
            "tool": tool_name,
            "decision_id": decision.decision_id,
            "result": f"Successfully executed governed action '{tool_name}'",
        }
