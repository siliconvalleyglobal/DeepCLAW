"""
Structured SIEM-exportable audit log renderer.
"""

import json
import time
from typing import Any, Dict, List
from deepclaw.governance.policy import PolicyDecision


class AuditLogger:
    """SIEM audit logger for governance compliance."""

    def __init__(self):
        self._records: List[Dict[str, Any]] = []

    def log_policy_decision(self, decision: PolicyDecision, metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        record = {
            "event_type": "GOVERNANCE_POLICY_EVALUATION",
            "timestamp": decision.timestamp,
            "iso_time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(decision.timestamp)),
            "decision_id": decision.decision_id,
            "agent_id": decision.agent_id,
            "action": decision.action,
            "permitted": decision.permitted,
            "reasoning_trace": decision.reasoning_trace,
            "violations": decision.violations,
            "metadata": metadata or {},
        }
        self._records.append(record)
        return record

    def export_siem_json(self) -> str:
        return json.dumps(self._records, indent=2)

    def get_records(self) -> List[Dict[str, Any]]:
        return list(self._records)
