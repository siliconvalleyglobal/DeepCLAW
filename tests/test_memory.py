"""
Unit tests for memory abstractions and backend registry.
"""

from deepclaw.memory.short_term import ShortTermMemory
from deepclaw.memory.long_term import LongTermMemory
from deepclaw.memory.backend_registry import MemoryBackendRegistry


def test_short_term_memory_buffer():
    mem = ShortTermMemory(max_messages=2)
    mem.add_message("user", "msg 1")
    mem.add_message("assistant", "msg 2")
    mem.add_message("user", "msg 3")

    ctx = mem.get_context()
    assert len(ctx) == 2
    assert ctx[0]["content"] == "msg 2"
    assert ctx[1]["content"] == "msg 3"


def test_long_term_memory_search():
    ltm = LongTermMemory()
    ltm.store_memory("DeepClaw is an enterprise governance AI agent framework")
    ltm.store_memory("LangGraph is a graph execution engine")

    results = ltm.search_memories("DeepClaw governance")
    assert len(results) >= 1
    assert "DeepClaw" in results[0]["text"]


def test_memory_backend_registry():
    backend = MemoryBackendRegistry.get("postgres")
    assert isinstance(backend, LongTermMemory)
