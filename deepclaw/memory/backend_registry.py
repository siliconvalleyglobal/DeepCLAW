"""
Pluggable backend registry allowing vector store swapping.
"""

from typing import Any, Dict, Type
from deepclaw.memory.long_term import LongTermMemory
from deepclaw.memory.vector_backends import (
    InMemoryVectorBackend,
    QdrantBackend,
    WeaviateBackend,
    PgVectorBackend,
)


class MemoryBackendRegistry:
    _backends: Dict[str, Type[LongTermMemory]] = {}

    @classmethod
    def register(cls, name: str, backend_cls: Type[LongTermMemory]) -> None:
        cls._backends[name] = backend_cls

    @classmethod
    def get(cls, name: str, **kwargs: Any) -> LongTermMemory:
        if name not in cls._backends:
            return LongTermMemory(backend_type=name)
        return cls._backends[name](**kwargs)


MemoryBackendRegistry.register("sqlite", LongTermMemory)
MemoryBackendRegistry.register("postgres", LongTermMemory)
MemoryBackendRegistry.register("inmemory", LongTermMemory)
MemoryBackendRegistry.register("qdrant", LongTermMemory)
MemoryBackendRegistry.register("weaviate", LongTermMemory)
MemoryBackendRegistry.register("pgvector", LongTermMemory)
