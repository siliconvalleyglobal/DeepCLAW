"""
Durable SQLite Audit Logger & Reasoning Trace Vault (Pillar 4)
Persists immutable audit events and agent reasoning chains to ~/.deepclaw/audit.db.
"""

import sqlite3
import os
import json
import time
import hmac
import hashlib
from typing import Dict, Any, List, Optional

class AuditLogger:
    """
    Durable SQLite Audit Trail with Cryptographic Chain Hashing.
    """

    def __init__(self, db_path: Optional[str] = None):
        if not db_path:
            base_dir = os.path.expanduser("~/.deepclaw")
            os.makedirs(base_dir, exist_ok=True)
            db_path = os.path.join(base_dir, "audit.db")

        self.db_path = db_path
        self._init_db()
        self.in_memory_logs: List[Dict[str, Any]] = []

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS audit_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    event_type TEXT NOT NULL,
                    agent_id TEXT NOT NULL,
                    tenant_id TEXT NOT NULL,
                    action_target TEXT,
                    decision TEXT NOT NULL,
                    reasoning_chain TEXT,
                    metadata_json TEXT,
                    timestamp REAL NOT NULL,
                    signature TEXT NOT NULL
                )
            """)
            conn.commit()

    def _hash_event(self, event_type: str, agent_id: str, action_target: str, decision: str, ts: float) -> str:
        payload = f"{event_type}:{agent_id}:{action_target}:{decision}:{ts}"
        return hmac.new(b"deepclaw_audit_key", payload.encode(), hashlib.sha256).hexdigest()

    def log_policy_decision(self, decision: Any, metadata: Optional[Dict[str, Any]] = None):
        """Backward compatible helper for PolicyDecision objects."""
        permitted = getattr(decision, "permitted", True)
        decision_id = getattr(decision, "decision_id", "dec_unknown")
        action = getattr(decision, "action", "action_unknown")

        record = {
            "permitted": permitted,
            "decision_id": decision_id,
            "event_type": "GOVERNANCE_POLICY_EVALUATION",
            "agent_id": getattr(decision, "agent_id", "agent_unknown"),
            "action": action,
            "reasoning_trace": getattr(decision, "reasoning_trace", "")
        }
        self.in_memory_logs.append(record)

        return self.log_event(
            event_type="GOVERNANCE_POLICY_EVALUATION",
            agent_id=record["agent_id"],
            action_target=f"{action}:{decision_id}",
            decision="ALLOWED" if permitted else "DENIED",
            reasoning_chain=[record["reasoning_trace"]],
            metadata=metadata
        )

    def get_records(self) -> List[Dict[str, Any]]:
        """Returns in-memory logs for compliance report generator."""
        return self.in_memory_logs

    def export_siem_json(self) -> str:
        """Exports audit logs in JSON format for SIEM ingestion."""
        events = self.get_events(limit=100)
        return json.dumps(events, indent=2)

    def log_event(
        self,
        event_type: str,
        agent_id: str,
        action_target: str,
        decision: str,
        tenant_id: str = "default_tenant",
        reasoning_chain: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Persists an immutable audit log event with reasoning traces to SQLite.
        """
        ts = time.time()
        sig = self._hash_event(event_type, agent_id, action_target, decision, ts)
        reasoning_str = json.dumps(reasoning_chain or [])
        metadata_str = json.dumps(metadata or {})

        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO audit_events 
                (event_type, agent_id, tenant_id, action_target, decision, reasoning_chain, metadata_json, timestamp, signature)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (event_type, agent_id, tenant_id, action_target, decision, reasoning_str, metadata_str, ts, sig)
            )
            conn.commit()

        return {
            "logged": True,
            "signature": sig,
            "timestamp": ts
        }

    def get_events(self, agent_id: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Queries persistent audit events from SQLite.
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            if agent_id:
                cursor.execute(
                    "SELECT event_type, agent_id, tenant_id, action_target, decision, reasoning_chain, timestamp, signature FROM audit_events WHERE agent_id = ? ORDER BY id DESC LIMIT ?",
                    (agent_id, limit)
                )
            else:
                cursor.execute(
                    "SELECT event_type, agent_id, tenant_id, action_target, decision, reasoning_chain, timestamp, signature FROM audit_events ORDER BY id DESC LIMIT ?",
                    (limit,)
                )

            rows = cursor.fetchall()
            return [
                {
                    "event_type": row[0],
                    "agent_id": row[1],
                    "tenant_id": row[2],
                    "action_target": row[3],
                    "decision": row[4],
                    "reasoning_chain": json.loads(row[5]),
                    "timestamp": row[6],
                    "signature": row[7]
                }
                for row in rows
            ]
