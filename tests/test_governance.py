"""
Unit tests for Zero-Trust policy engine, pre-execution permit/deny enforcement, SIEM audit logging, and guardrails.
"""

import pytest
from deepclaw.governance.identity import AgentIdentity
from deepclaw.governance.policy import PreExecutionPolicyEngine
from deepclaw.governance.audit_log import AuditLogger
from deepclaw.governance.rbac import Role
from deepclaw.tools.guardrails import ToolGuardrails


def test_guardrails_destructive_payload():
    safe, violations = ToolGuardrails.validate_arguments(
        "exec_cmd", {"command": "rm -rf /"}
    )
    assert safe is False
    assert len(violations) > 0


def test_pre_execution_policy_engine():
    engine = PreExecutionPolicyEngine()

    # Restricted agent attempting admin action
    restricted_id = AgentIdentity(
        name="RestrictedBot",
        roles=[Role.RESTRICTED_AGENT.value],
    )
    decision = engine.evaluate_tool_call(
        identity=restricted_id,
        tool_name="admin_purge_database",
        arguments={},
    )
    assert decision.permitted is False
    assert "lack permission" in decision.reasoning_trace

    # Admin agent attempting valid tool call
    admin_id = AgentIdentity(
        name="AdminBot",
        roles=[Role.ADMIN.value],
    )
    admin_decision = engine.evaluate_tool_call(
        identity=admin_id,
        tool_name="read_logs",
        arguments={},
    )
    assert admin_decision.permitted is True


def test_siem_audit_log_export():
    engine = PreExecutionPolicyEngine()
    logger = AuditLogger()

    identity = AgentIdentity(name="AuditBot", roles=[Role.ADMIN.value])
    decision = engine.evaluate_tool_call(identity, "read", {})
    logger.log_policy_decision(decision)

    siem_json = logger.export_siem_json()
    assert "GOVERNANCE_POLICY_EVALUATION" in siem_json
    assert decision.decision_id in siem_json
