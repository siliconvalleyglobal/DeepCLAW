"""
Unit tests for self-correction, persistent checkpoints, telemetry, compliance reports, and CLI commands.
"""

import pytest
from deepclaw.core.reflection import SelfCorrectionLoop
from deepclaw.core.persistence import DurableCheckpointStore
from deepclaw.core.state import Checkpoint
from deepclaw.observability.logger import ExecutionTraceLogger
from deepclaw.observability.telemetry import OpenTelemetryExporter
from deepclaw.governance.audit_log import AuditLogger
from deepclaw.governance.compliance import ComplianceReportGenerator
from deepclaw.governance.policy import PolicyDecision


@pytest.mark.asyncio
async def test_self_correction_loop_retry():
    loop = SelfCorrectionLoop(max_retries=2, backoff_seconds=0.01)
    attempts = 0

    def flaky_tool():
        nonlocal attempts
        attempts += 1
        if attempts < 2:
            raise ValueError("Temporary glitch")
        return "Success"

    success, res, error = await loop.execute_with_reflection(flaky_tool, {})
    assert success is True
    assert res == "Success"
    assert attempts == 2


def test_durable_checkpoint_store():
    store = DurableCheckpointStore(db_path=":memory:")
    cp = Checkpoint(node_id="test_node", data={"counter": 42}, paused=True)

    store.save_checkpoint(cp)
    loaded = store.load_checkpoint(cp.id)

    assert loaded is not None
    assert loaded.node_id == "test_node"
    assert loaded.data["counter"] == 42
    assert loaded.paused is True


def test_opentelemetry_exporter():
    logger = ExecutionTraceLogger()
    logger.log_event("GRAPH_NODE_RUN", node_id="node_1", input_data={"msg": "hi"})

    otel_spans = OpenTelemetryExporter.export_otel_spans(logger)
    assert len(otel_spans) == 1
    assert otel_spans[0]["name"] == "deepclaw.GRAPH_NODE_RUN"

    langfuse_trace = OpenTelemetryExporter.export_langfuse_trace(logger)
    assert langfuse_trace["metadata"]["framework"] == "DeepClaw"


def test_compliance_report_generator():
    logger = AuditLogger()
    decision = PolicyDecision(
        decision_id="dec-1",
        agent_id="agent-1",
        action="read",
        permitted=True,
        reasoning_trace="Permitted",
    )
    logger.log_policy_decision(decision)

    gen = ComplianceReportGenerator(logger)
    report = gen.generate_report()

    assert report["report_type"] == "ISO_42001_AND_SOC2_AI_GOVERNANCE_EVIDENCE"
    assert report["summary"]["permitted_actions"] == 1
    assert report["summary"]["compliance_score"] == 100.0

    markdown = gen.export_markdown_report()
    assert "DeepClaw ISO 42001 & SOC 2 Compliance Report" in markdown
