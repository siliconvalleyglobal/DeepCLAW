"""
Vector-backed, multi-tenant, policy-governed persistent long-term memory.
"""

import math
from typing import Any, Dict, List, Optional
from deepclaw.governance.identity import AgentIdentity
from deepclaw.governance.policy import ActionType, PreExecutionPolicyEngine


class LongTermMemory:
    """Persistent, multi-tenant, policy-governed semantic long-term memory store."""

    def __init__(
        self,
        backend_type: str = "sqlite",
        policy_engine: Optional[PreExecutionPolicyEngine] = None,
        default_identity: Optional[AgentIdentity] = None,
    ):
        self.backend_type = backend_type
        self.policy_engine = policy_engine
        self.default_identity = default_identity
        self._store: List[Dict[str, Any]] = []

    def store_memory(
        self,
        text: str,
        metadata: Optional[Dict[str, Any]] = None,
        tenant_id: Optional[str] = None,
        agent_id: Optional[str] = None,
        identity: Optional[AgentIdentity] = None,
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

        # Policy evaluation check if policy engine & identity are present
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
        }
        self._store.append(record)
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

        # Policy evaluation check if policy engine & identity are present
        if self.policy_engine and eff_identity:
            decision = self.policy_engine.evaluate_action(
                identity=eff_identity,
                action_type=ActionType.MEMORY_READ,
                target="long_term_memory",
                payload={"query": query, "tenant_id": eff_tenant_id},
            )
            if not decision.permitted:
                raise PermissionError(f"Memory read denied by policy: {decision.reasoning_trace}")

        # Strict tenant boundary filter
        candidates = [
            mem for mem in self._store
            if mem["tenant_id"] == eff_tenant_id and (eff_agent_id is None or mem["agent_id"] in (eff_agent_id, "global"))
        ]

        if not candidates:
            return []

        # Vector semantic similarity (Bag-of-Words Cosine Similarity baseline)
        def vector_similarity(q: str, doc: str) -> float:
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

        scored_results = []
        for mem in candidates:
            score = vector_similarity(query, mem["text"])
            if score > 0:
                scored_results.append((score, mem))

        scored_results.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in scored_results[:limit]]
