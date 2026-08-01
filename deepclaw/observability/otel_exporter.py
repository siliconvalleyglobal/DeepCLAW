"""
OpenTelemetry (OTel) Execution Trace Exporter for DeepCLAW Observability.
Formats and exports agent execution spans, token usage, tool calls, and latency
to standard OpenTelemetry receivers (Datadog, Grafana Tempo, Honeycomb, Dynatrace).
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
    kind: str = "INTERNAL"  # SERVER, CLIENT, PRODUCER, CONSUMER, INTERNAL
    start_time_unix_nano: int
    end_time_unix_nano: Optional[int] = None
    attributes: Dict[str, Any] = Field(default_factory=dict)
    status_code: str = "OK"  # OK, ERROR, UNSET
    status_message: Optional[str] = None


class OpenTelemetryExporter:
    """
    OpenTelemetry span builder and batch exporter for Agentic AI executions.
    """

    def __init__(self, service_name: str = "deepclaw-agent-service"):
        self.service_name = service_name
        self.spans: List[OpenTelemetrySpan] = []

    def start_span(
        self,
        name: str,
        parent_span_id: Optional[str] = None,
        attributes: Optional[Dict[str, Any]] = None
    ) -> OpenTelemetrySpan:
        """Starts an OpenTelemetry span."""
        attrs = {
            "service.name": self.service_name,
            "gen_ai.system": "deepclaw",
            **(attributes or {})
        }
        span = OpenTelemetrySpan(
            name=name,
            parent_span_id=parent_span_id,
            start_time_unix_nano=int(time.time() * 1e9),
            attributes=attrs
        )
        self.spans.append(span)
        return span

    def end_span(
        self,
        span: OpenTelemetrySpan,
        status_code: str = "OK",
        status_message: Optional[str] = None,
        extra_attributes: Optional[Dict[str, Any]] = None
    ) -> OpenTelemetrySpan:
        """Ends an active OpenTelemetry span."""
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
        duration_ms: float
    ):
        """Attaches standard GenAI OpenTelemetry semantic conventions to span."""
        span.attributes.update({
            "gen_ai.request.model": model,
            "gen_ai.usage.prompt_tokens": prompt_tokens,
            "gen_ai.usage.completion_tokens": completion_tokens,
            "gen_ai.usage.total_tokens": prompt_tokens + completion_tokens,
            "gen_ai.latency_ms": duration_ms
        })

    def export_otlp_json(self) -> Dict[str, Any]:
        """
        Exports collected spans in standard OTLP JSON format (OpenTelemetry Protocol format).
        Ready to POST to any OTLP/HTTP collector endpoint.
        """
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
