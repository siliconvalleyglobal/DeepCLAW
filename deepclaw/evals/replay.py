"""
Turns any production trace into a permanent eval scenario with one command.
"""

from typing import Any, Dict
from deepclaw.evals.harness import EvalScenario


class TraceReplayEngine:
    """Converts recorded execution traces into replayable eval test cases."""

    @staticmethod
    def trace_to_eval_scenario(trace: Dict[str, Any]) -> EvalScenario:
        trace_id = trace.get("trace_id", "trace-unknown")
        events = trace.get("events", [])
        
        prompt = "Unknown prompt"
        expected = "Unknown output"

        for evt in events:
            if evt.get("event_type") == "USER_INPUT" and evt.get("input_data"):
                prompt = evt["input_data"].get("prompt", prompt)
            elif evt.get("event_type") == "AGENT_RESPONSE" and evt.get("output_data"):
                expected = evt["output_data"].get("response", expected)

        return EvalScenario(
            id=f"eval-{trace_id}",
            name=f"Replay case for {trace_id}",
            prompt=prompt,
            expected_output=expected,
            scorer="contains",
        )
