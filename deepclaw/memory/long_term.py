"""
Vector-backed, multi-tenant, policy-governed persistent long-term memory.
"""

import math
import time
from typing import Any, Dict, List, Optional
from deepclaw.governance.identity import AgentIdentity
from deepclaw.governance.policy import ActionType, PreExecutionPolicyEngine
from deepclaw.memory.vector_backends import VectorMemoryBackend, InMemoryVectorBackend


class LongTermMemory:
    """Persistent, multi-tenant, policy-governed semantic long-term memory store."""

    def __init__(
        self,
        backend_type: str = "inmemory",
        policy_engine: Optional[PreExecutionPolicyEngine] = None,
        default_identity: Optional[AgentIdentity] = None,
        vector_backend: Optional[VectorMemoryBackend] = None,
        decay_half_life_days: Optional[float] = None,
        min_importance: float = 0.05,
    ):
        self.backend_type = backend_type
        self.policy_engine = policy_engine
        self.default_identity = default_identity
        self.vector_backend = vector_backend or InMemoryVectorBackend()
        self.decay_half_life_days = decay_half_life_days
        self.min_importance = min_importance
        self._store: List[Dict[str, Any]] = []

    def store_memory(
        self,
        text: str,
        metadata: Optional[Dict[str, Any]] = None,
        tenant_id: Optional[str] = None,
        agent_id: Optional[str] = None,
        identity: Optional[AgentIdentity] = None,
        importance: float = 1.0,
    ) -> str:
        eff_identity = identity or self.default_identity
        eff_tenant_id = (
            tenant_id
            or (eff_identity.tenant_id if eff_identity else None)
            or "default-tenant"
        )
        eff_agent_id = (
            agent_id
            or (eff_identity.agent_id if eff_identity else None)
            or "global"
        )

        if self.policy_engine and eff_identity:
            decision = self.policy_engine.evaluate_action(
                identity=eff_identity,
                action_type=ActionType.MEMORY_WRITE,
                target="long_term_memory",
                payload={"text": text, "metadata": metadata or {}, "tenant_id": eff_tenant_id},
            )
            if not decision.permitted:
                raise PermissionError(f"Memory write denied by policy: {decision.reasoning_trace}")

        memory_id = f"mem-{len(self._store) + 1}"
        record = {
            "id": memory_id,
            "text": text,
            "metadata": metadata or {},
            "tenant_id": eff_tenant_id,
            "agent_id": eff_agent_id,
            "importance": max(0.0, min(1.0, importance)),
            "created_at": time.time(),
            "last_accessed_at": time.time(),
            "access_count": 0,
        }
        self._store.append(record)
        try:
            self.vector_backend.upsert(memory_id, self._embed(text), self._public_metadata(record))
        except Exception:
            pass
        return memory_id

    def search_memories(
        self,
        query: str,
        limit: int = 5,
        tenant_id: Optional[str] = None,
        agent_id: Optional[str] = None,
        identity: Optional[AgentIdentity] = None,
    ) -> List[Dict[str, Any]]:
        eff_identity = identity or self.default_identity
        eff_tenant_id = (
            tenant_id
            or (eff_identity.tenant_id if eff_identity else None)
            or "default-tenant"
        )
        eff_agent_id = (
            agent_id
            or (eff_identity.agent_id if eff_identity else None)
        )

        if self.policy_engine and eff_identity:
            decision = self.policy_engine.evaluate_action(
                identity=eff_identity,
                action_type=ActionType.MEMORY_READ,
                target="long_term_memory",
                payload={"query": query, "tenant_id": eff_tenant_id},
            )
            if not decision.permitted:
                raise PermissionError(f"Memory read denied by policy: {decision.reasoning_trace}")

        candidates = [
            mem for mem in self._store
            if mem["tenant_id"] == eff_tenant_id and (eff_agent_id is None or mem["agent_id"] in (eff_agent_id, "global"))
        ]

        if not candidates:
            return []

        scored_results = []
        for mem in candidates:
            semantic = self._cosine_similarity(query, mem.get("text", ""))
            if semantic > 0:
                importance = mem.get("importance", 1.0)
                recency = self._recency_score(mem.get("last_accessed_at", mem.get("created_at", time.time())))
                score = (semantic * 0.7) + (importance * 0.2) + (recency * 0.1)
                scored_results.append((score, mem))

        scored_results.sort(key=lambda x: x[0], reverse=True)
        results = [item[1] for item in scored_results[:limit]]
        for mem in results:
            mem["access_count"] = mem.get("access_count", 0) + 1
            mem["last_accessed_at"] = time.time()
        return results

    def decay(self) -> int:
        if not self.decay_half_life_days:
            return 0
        now = time.time()
        half_life_seconds = self.decay_half_life_days * 86400.0
        pruned = 0
        kept = []
        for mem in self._store:
            age_seconds = now - mem.get("created_at", now)
            decay_factor = 0.5 ** (age_seconds / half_life_seconds) if half_life_seconds > 0 else 1.0
            mem["importance"] = max(0.0, mem.get("importance", 1.0) * decay_factor)
            if mem["importance"] >= self.min_importance:
                kept.append(mem)
            else:
                pruned += 1
        self._store = kept
        return pruned

    def _score_memory(self, query: str, mem: Dict[str, Any]) -> float:
        semantic = self._cosine_similarity(query, mem.get("text", ""))
        importance = mem.get("importance", 1.0)
        recency = self._recency_score(mem.get("last_accessed_at", mem.get("created_at", time.time())))
        return (semantic * 0.7) + (importance * 0.2) + (recency * 0.1)

    def _cosine_similarity(self, q: str, doc: str) -> float:
        q_words = q.lower().split()
        doc_words = doc.lower().split()
        vocab = set(q_words + doc_words)
        if not vocab:
            return 0.0
        q_vec = [q_words.count(w) for w in vocab]
        doc_vec = [doc_words.count(w) for w in vocab]
        dot = sum(a * b for a, b in zip(q_vec, doc_vec))
        norm_q = math.sqrt(sum(a * a for a in q_vec))
        norm_doc = math.sqrt(sum(b * b for b in doc_vec))
        if norm_q == 0 or norm_doc == 0:
            return 0.0
        return dot / (norm_q * norm_doc)

    @staticmethod
    def _recency_score(last_accessed: float) -> float:
        age_hours = (time.time() - last_accessed) / 3600.0
        return 1.0 / (1.0 + age_hours)

    @staticmethod
    def _embed(text: str) -> List[float]:
        words = text.lower().split()
        vocab = sorted(set(words))
        return [words.count(w) for w in vocab]

    @staticmethod
    def _public_metadata(record: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "tenant_id": record.get("tenant_id"),
            "agent_id": record.get("agent_id"),
            "importance": record.get("importance", 1.0),
            "created_at": record.get("created_at"),
        }
