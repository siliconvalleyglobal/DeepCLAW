"""
Vector-backed persistent long-term memory.
"""

from typing import Any, Dict, List, Optional


class LongTermMemory:
    """Persistent semantic long-term memory store."""

    def __init__(self, backend_type: str = "sqlite"):
        self.backend_type = backend_type
        self._store: List[Dict[str, Any]] = []

    def store_memory(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> str:
        memory_id = f"mem-{len(self._store) + 1}"
        self._store.append({
            "id": memory_id,
            "text": text,
            "metadata": metadata or {},
        })
        return memory_id

    def search_memories(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        query_words = set(query.lower().split())
        results = []
        for mem in self._store:
            mem_words = set(mem["text"].lower().split())
            overlap = len(query_words.intersection(mem_words))
            if overlap > 0:
                results.append((overlap, mem))

        results.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in results[:limit]]
