"""
Unit tests for new enterprise features:
1. Token Budget & Rate Limiting Guard (deepclaw.governance.token_budget)
2. DLP & PII Redaction Engine (deepclaw.governance.dlp)
3. OpenTelemetry Exporter (deepclaw.observability.otel_exporter)
"""

import pytest
from deepclaw.governance.token_budget import TokenBudgetGuard, TokenBudgetConfig
from deepclaw.governance.dlp import DLPEngine, DLPRule
from deepclaw.observability.otel_exporter import OpenTelemetryExporter, OpenTelemetrySpan


def test_token_budget_guard():
    config = TokenBudgetConfig(
        max_tokens_per_minute=1000,
        max_tokens_per_day=5000,
        max_usd_per_day=0.10,
        cost_per_1k_input_tokens=0.01,
        cost_per_1k_output_tokens=0.02
    )
    guard = TokenBudgetGuard(default_config=config)

    # 1. Allowed request
    allowed, cost, msg = guard.check_and_record("tenant-1", prompt_tokens=200, completion_tokens=100)
    assert allowed is True
    assert cost == 0.004  # (0.2 * 0.01) + (0.1 * 0.02)
    assert "approved" in msg

    # 2. Exceed 1-minute token limit
    allowed_2, cost_2, msg_2 = guard.check_and_record("tenant-1", prompt_tokens=500, completion_tokens=300)
    assert allowed_2 is False
    assert "Rate Limit Exceeded" in msg_2

    # 3. Check usage summary
    summary = guard.get_usage_summary("tenant-1")
    assert summary["total_tokens"] == 300
    assert summary["total_requests"] == 1


def test_dlp_pii_redactor():
    engine = DLPEngine()

    # 1. Redact SSN, Credit Card, Email, and API Key
    sample_prompt = (
        "User info: SSN is 123-45-6789, email is john.doe@example.com, "
        "card is 4111111111111111, key is sk-proj-abcdef1234567890123456"
    )

    res = engine.sanitize(sample_prompt)
    assert res.matches_found >= 4
    assert "[REDACTED_SSN]" in res.sanitized_text
    assert "[REDACTED_EMAIL]" in res.sanitized_text
    assert "[REDACTED_CREDIT_CARD]" in res.sanitized_text
    assert "[REDACTED_API_KEY]" in res.sanitized_text
    assert "123-45-6789" not in res.sanitized_text

    # 2. Reversible token masking
    masked_text, token_map = engine.mask_and_tokenize("Contact john.doe@example.com for support.")
    assert "VAR_EMAIL" in masked_text
    assert "john.doe@example.com" not in masked_text

    restored = engine.restore_tokens(masked_text, token_map)
    assert restored == "Contact john.doe@example.com for support."


def test_otel_exporter():
    exporter = OpenTelemetryExporter(service_name="deepclaw-test-service")

    span = exporter.start_span("agent_execute_step", attributes={"tenant_id": "tenant-001"})
    exporter.record_llm_call(span, model="gpt-4o", prompt_tokens=150, completion_tokens=50, duration_ms=230.5)
    exporter.end_span(span, status_code="OK")

    otlp_payload = exporter.export_otlp_json()

    assert "resourceSpans" in otlp_payload
    spans = otlp_payload["resourceSpans"][0]["scopeSpans"][0]["spans"]
    assert len(spans) == 1
    assert spans[0]["name"] == "agent_execute_step"
    assert spans[0]["status"]["code"] == "OK"
