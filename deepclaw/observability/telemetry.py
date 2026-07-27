"""
OpenTelemetry (OTel) and Langfuse telemetry export adapter.
"""

import json
from typing import Any, Dict, List
from deepclaw.observability.logger import ExecutionTraceLogger


class OpenTelemetryExporter:
    """Exports trace logger events to OpenTelemetry / Langfuse compatible JSON format."""

    @staticmethod
    def export_otel_spans(trace_logger: ExecutionTraceLogger) -> List[Dict[str, Any]]:
        spans = []
        for evt in trace_logger.events:
            spans.append({
                "trace_id": trace_logger.trace_id,
                "span_id": evt.event_id,
                "name": f"deepclaw.{evt.event_type}",
                "timestamp": evt.timestamp,
                "attributes": {
                    "node_id": evt.node_id or "",
                    "has_error": evt.error is not None,
                    "error_message": evt.error or "",
                },
                "input": evt.input_data or {},
                "output": evt.output_data or {},
            })
        return spans

    @staticmethod
    def export_langfuse_trace(trace_logger: ExecutionTraceLogger) -> Dict[str, Any]:
        return {
            "id": trace_logger.trace_id,
            "name": "DeepClaw Agent Execution",
            "metadata": {"framework": "DeepClaw", "version": "0.1.0"},
            "observations": [
                {
                    "id": evt.event_id,
                    "name": evt.event_type,
                    "type": "SPAN" if "graph" in evt.event_type.lower() else "GENERATION",
                    "startTime": evt.timestamp,
                    "input": evt.input_data,
                    "output": evt.output_data,
                    "statusMessage": evt.error,
                }
                for evt in trace_logger.events
            ],
        }
