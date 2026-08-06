"""
OpenTelemetry (OTel) Execution Trace Exporter for DeepCLAW Observability.
Formats and exports agent execution spans, token usage, tool calls, policy decisions, and latency.
"""

import time
import uuid
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class OpenTelemetrySpan(BaseModel):
    trace_id: str = Field(default_factory=lambda: uuid.uuid4().hex)
    span_id: str = Field(default_factory=lambda: uuid.uuid4().hex[:16])
    parent_span_id: Optional[str] = None
    name: str
    kind: str = "INTERNAL"
    start_time_unix_nano: int
    end_time_unix_nano: Optional[int] = None
    attributes: Dict[str, Any] = Field(default_factory=dict)
    status_code: str = "OK"
    status_message: Optional[str] = None


class OpenTelemetryExporter:
    def __init__(self, service_name: str = "deepclaw-agent-service"):
        self.service_name = service_name
        self.spans: List[OpenTelemetrySpan] = []

    def start_span(
        self,
        name: str,
        parent_span_id: Optional[str] = None,
        attributes: Optional[Dict[str, Any]] = None,
        kind: str = "INTERNAL",
    ) -> OpenTelemetrySpan:
        attrs = {
            "service.name": self.service_name,
            "gen_ai.system": "deepclaw",
            **(attributes or {})
        }
        span = OpenTelemetrySpan(
            name=name,
            parent_span_id=parent_span_id,
            start_time_unix_nano=int(time.time() * 1e9),
            attributes=attrs,
            kind=kind,
        )
        self.spans.append(span)
        return span

    def end_span(
        self,
        span: OpenTelemetrySpan,
        status_code: str = "OK",
        status_message: Optional[str] = None,
        extra_attributes: Optional[Dict[str, Any]] = None,
    ) -> OpenTelemetrySpan:
        span.end_time_unix_nano = int(time.time() * 1e9)
        span.status_code = status_code
        span.status_message = status_message
        if extra_attributes:
            span.attributes.update(extra_attributes)
        return span

    def record_llm_call(
        self,
        span: OpenTelemetrySpan,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        duration_ms: float,
    ):
        span.attributes.update({
            "gen_ai.request.model": model,
            "gen_ai.usage.prompt_tokens": prompt_tokens,
            "gen_ai.usage.completion_tokens": completion_tokens,
            "gen_ai.usage.total_tokens": prompt_tokens + completion_tokens,
            "gen_ai.latency_ms": duration_ms,
        })

    def record_policy_decision(
        self,
        span: OpenTelemetrySpan,
        action: str,
        permitted: bool,
        reasoning_trace: str,
        agent_id: Optional[str] = None,
        tenant_id: Optional[str] = None,
    ):
        span.attributes.update({
            "deepclaw.policy.action": action,
            "deepclaw.policy.decision": "PERMIT" if permitted else "DENY",
            "deepclaw.policy.reasoning": reasoning_trace,
            "deepclaw.agent.id": agent_id or "",
            "deepclaw.tenant.id": tenant_id or "",
        })

    def record_node_execution(
        self,
        span: OpenTelemetrySpan,
        node_id: str,
        node_type: str = "action",
        success: bool = True,
        error: Optional[str] = None,
    ):
        span.attributes.update({
            "deepclaw.graph.node_id": node_id,
            "deepclaw.graph.node_type": node_type,
            "deepclaw.graph.success": success,
        })
        if error:
            span.status_code = "ERROR"
            span.status_message = error
            span.attributes["deepclaw.graph.error"] = error

    def record_edge_traversal(
        self,
        span: OpenTelemetrySpan,
        source: str,
        target: str,
        condition_matched: bool = True,
    ):
        span.attributes.update({
            "deepclaw.graph.edge.source": source,
            "deepclaw.graph.edge.target": target,
            "deepclaw.graph.edge.condition_matched": condition_matched,
        })

    def export_otlp_json(self) -> Dict[str, Any]:
        formatted_spans = []
        for span in self.spans:
            formatted_spans.append({
                "traceId": span.trace_id,
                "spanId": span.span_id,
                "parentSpanId": span.parent_span_id or "",
                "name": span.name,
                "kind": span.kind,
                "startTimeUnixNano": str(span.start_time_unix_nano),
                "endTimeUnixNano": str(span.end_time_unix_nano or span.start_time_unix_nano),
                "attributes": [
                    {"key": k, "value": {"stringValue": str(v)}}
                    for k, v in span.attributes.items()
                ],
                "status": {
                    "code": span.status_code,
                    "message": span.status_message or ""
                }
            })

        return {
            "resourceSpans": [
                {
                    "resource": {
                        "attributes": [
                            {"key": "service.name", "value": {"stringValue": self.service_name}}
                        ]
                    },
                    "scopeSpans": [
                        {
                            "scope": {"name": "deepclaw.observability"},
                            "spans": formatted_spans
                        }
                    ]
                }
            ]
        }
