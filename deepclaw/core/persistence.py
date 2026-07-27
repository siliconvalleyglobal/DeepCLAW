"""
Durable distributed checkpoint persistence store.
"""

import json
import sqlite3
from typing import Any, Dict, List, Optional
from deepclaw.core.state import Checkpoint


class DurableCheckpointStore:
    """Persistent storage engine for graph execution checkpoints."""

    def __init__(self, db_path: str = ":memory:"):
        self.db_path = db_path
        self._conn = sqlite3.connect(self.db_path) if db_path == ":memory:" else None
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        if self.db_path == ":memory:":
            return self._conn
        return sqlite3.connect(self.db_path)

    def _init_db(self) -> None:
        conn = self._get_connection()
        with conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS checkpoints (
                    id TEXT PRIMARY KEY,
                    timestamp REAL,
                    node_id TEXT,
                    paused INTEGER,
                    pending_human_approval INTEGER,
                    data_json TEXT
                )
                """
            )
        if self.db_path != ":memory:":
            conn.close()

    def save_checkpoint(self, checkpoint: Checkpoint) -> None:
        conn = self._get_connection()
        with conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO checkpoints (id, timestamp, node_id, paused, pending_human_approval, data_json)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    checkpoint.id,
                    checkpoint.timestamp,
                    checkpoint.node_id,
                    1 if checkpoint.paused else 0,
                    1 if checkpoint.pending_human_approval else 0,
                    json.dumps(checkpoint.data),
                ),
            )
        if self.db_path != ":memory:":
            conn.close()

    def load_checkpoint(self, checkpoint_id: str) -> Optional[Checkpoint]:
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, timestamp, node_id, paused, pending_human_approval, data_json FROM checkpoints WHERE id = ?", (checkpoint_id,))
        row = cursor.fetchone()
        if self.db_path != ":memory:":
            conn.close()

        if not row:
            return None

        return Checkpoint(
            id=row[0],
            timestamp=row[1],
            node_id=row[2],
            paused=bool(row[3]),
            pending_human_approval=bool(row[4]),
            data=json.loads(row[5]),
        )
