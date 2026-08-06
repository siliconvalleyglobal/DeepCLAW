"""
Tests for new DeepCLAW features:
- Structured output enforcement
- Vector memory backends
- Human-in-the-loop approval
- OTLP span enrichment
- Memory decay
- Eval benchmarks
- LLM streaming/multi-modal adapters
- DAG viewer
"""

import pytest
from deepclaw.tools.structured_output import StructuredOutputEnforcer, StructuredOutputRule
from deepclaw.memory.vector_backends import InMemoryVectorBackend, QdrantBackend, WeaviateBackend, PgVectorBackend
from deepclaw.memory.long_term import LongTermMemory
from deepclaw.memory.backend_registry import MemoryBackendRegistry
from deepclaw.core.graph import Graph, ApprovalNode
from deepclaw.core.state import State
from deepclaw.observability.otel_exporter import OpenTelemetryExporter
from deepclaw.evals.benchmarks import BenchmarkSuite, get_suite, list_suites
from deepclaw.llm.litellm_adapter import LiteLLMAdapter
from deepclaw.cli.main import _render_dag


def test_structured_output_enforcer_register_and_validate():
    StructuredOutputEnforcer.register(StructuredOutputRule(schema_name="test_schema", json_schema={"type": "object", "required": ["name"]}))
    result = StructuredOutputEnforcer.validate("test_schema", {"name": "deepclaw"})
    assert result["valid"] is True
    assert result["errors"] == []


def test_structured_output_enforcer_invalid():
    result = StructuredOutputEnforcer.validate("test_schema", {})
    assert result["valid"] is False
    assert "Missing required field: name" in result["errors"]


def test_structured_output_enforcer_pydantic():
    from pydantic import BaseModel

    class Foo(BaseModel):
        name: str
        value: int

    StructuredOutputEnforcer.register(StructuredOutputRule(schema_name="foo_schema", pydantic_model=Foo))
    result = StructuredOutputEnforcer.validate("foo_schema", {"name": "x", "value": 1})
    assert result["valid"] is True

    result_bad = StructuredOutputEnforcer.validate("foo_schema", {"name": "x"})
    assert result_bad["valid"] is False


def test_inmemory_vector_backend():
    backend = InMemoryVectorBackend()
    backend.upsert("a", [1.0, 0.0], {"t": "1"})
    results = backend.query([1.0, 0.0], top_k=1)
    assert len(results) == 1
    assert results[0]["id"] == "a"
    assert results[0]["score"] == 1.0


def test_long_term_memory_with_backend():
    backend = InMemoryVectorBackend()
    ltm = LongTermMemory(backend_type="inmemory", vector_backend=backend)
    mem_id = ltm.store_memory("DeepClaw governance policy", tenant_id="t1", agent_id="a1", importance=0.9)
    assert mem_id.startswith("mem-")
    results = ltm.search_memories("governance", tenant_id="t1")
    assert len(results) >= 1
    assert results[0]["tenant_id"] == "t1"


def test_memory_decay_prunes_low_importance():
    ltm = LongTermMemory(decay_half_life_days=0.00001, min_importance=0.5)
    ltm.store_memory("old stale info", tenant_id="t1", importance=0.1)
    ltm.store_memory("fresh important info", tenant_id="t1", importance=1.0)
    pruned = ltm.decay()
    assert pruned == 1
    assert len(ltm._store) == 1


def test_backend_registry_has_new_backends():
    assert "qdrant" in MemoryBackendRegistry._backends
    assert "weaviate" in MemoryBackendRegistry._backends
    assert "pgvector" in MemoryBackendRegistry._backends


def test_approval_node_pauses_graph():
    graph = Graph()
    graph.add_node("start", lambda s: s)
    graph.add_approval_node("approve", prompt="Approve this action?")
    graph.add_node("end", lambda s: s)
    graph.set_entry_point("start")
    graph.add_edge("start", "approve")
    graph.add_edge("approve", "end")

    state = State()
    import asyncio
    result = asyncio.run(graph.run(state))
    assert result.get("__paused__") is True
    assert result.get("__approval_prompt__") == "Approve this action?"


def test_otlp_exporter_policy_and_node_spans():
    exporter = OpenTelemetryExporter()
    span = exporter.start_span("test_span")
    exporter.record_policy_decision(span, "exec_bash", False, "DENIED", agent_id="agent-1", tenant_id="t1")
    exporter.record_node_execution(span, "node-1", node_type="tool", success=True)
    exporter.record_edge_traversal(span, "node-1", "node-2")
    exporter.end_span(span)
    payload = exporter.export_otlp_json()
    assert len(payload["resourceSpans"][0]["scopeSpans"][0]["spans"]) == 1


def test_eval_benchmark_suites():
    names = list_suites()
    assert "governance_basics" in names
    suite = get_suite("governance_basics")
    assert len(suite.scenarios) >= 1
    assert suite.name == "deepclaw_governance_basics"


def test_llm_adapter_multimodal_messages():
    adapter = LiteLLMAdapter()
    msgs = adapter.build_multimodal_messages("describe image", image_urls=["http://example.com/img.png"])
    assert len(msgs) == 1
    assert msgs[0]["role"] == "user"
    assert len(msgs[0]["content"]) == 2
    assert msgs[0]["content"][0]["type"] == "text"
    assert msgs[0]["content"][1]["type"] == "image_url"


@pytest.mark.asyncio
async def test_llm_adapter_streaming():
    adapter = LiteLLMAdapter()
    chunks = []
    async for chunk in adapter.stream_completion([{"role": "user", "content": "hi"}]):
        chunks.append(chunk)
    assert len(chunks) >= 1
    assert chunks[-1].get("choices", [{}])[0].get("finish_reason") == "stop"


def test_dag_renderer():
    graph = Graph()
    graph.add_node("a", lambda s: s)
    graph.add_node("b", lambda s: s)
    graph.set_entry_point("a")
    graph.add_edge("a", "b")
    dot = _render_dag(graph)
    assert "digraph DeepClaw" in dot
    assert '"a" -> "b";' in dot
