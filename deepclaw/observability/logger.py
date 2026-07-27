"""
Execution trace logger feeding evals and replay automatically.
"""

import time
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class TraceEvent(BaseModel):
    """Event in execution trace log."""

    event_id: str
    timestamp: float = Field(default_factory=time.time)
    event_type: str
    node_id: Optional[str] = None
    input_data: Optional[Dict[str, Any]] = None
    output_data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class ExecutionTraceLogger:
    """Traces graph execution, tool calls, and state transitions."""

    def __init__(self, trace_id: Optional[str] = None):
        self.trace_id = trace_id or f"trace-{int(time.time()*1000)}"
        self.events: List[TraceEvent] = []

    def log_event(
        self,
        event_type: str,
        node_id: Optional[str] = None,
        input_data: Optional[Dict[str, Any]] = None,
        output_data: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None,
    ) -> TraceEvent:
        event = TraceEvent(
            event_id=f"evt-{len(self.events) + 1}",
            event_type=event_type,
            node_id=node_id,
            input_data=input_data,
            output_data=output_data,
            error=error,
        )
        self.events.append(event)
        return event

    def export_trace(self) -> Dict[str, Any]:
        return {
            "trace_id": self.trace_id,
            "event_count": len(self.events),
            "events": [evt.model_dump() for evt in self.events],
        }
