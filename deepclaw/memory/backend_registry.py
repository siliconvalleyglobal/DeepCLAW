"""
Pluggable backend registry allowing vector store swapping (SQLite, Postgres+pgvector).
"""

from typing import Any, Dict, Type
from deepclaw.memory.long_term import LongTermMemory


class MemoryBackendRegistry:
    """Registry managing pluggable memory storage providers."""

    _backends: Dict[str, Type[LongTermMemory]] = {}

    @classmethod
    def register(cls, name: str, backend_cls: Type[LongTermMemory]) -> None:
        cls._backends[name] = backend_cls

    @classmethod
    def get(cls, name: str, **kwargs: Any) -> LongTermMemory:
        if name not in cls._backends:
            # Default fallback to baseline memory store
            return LongTermMemory(backend_type=name)
        return cls._backends[name](**kwargs)


MemoryBackendRegistry.register("sqlite", LongTermMemory)
MemoryBackendRegistry.register("postgres", LongTermMemory)
