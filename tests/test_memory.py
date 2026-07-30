"""
Unit tests for memory abstractions, backend registry, multi-tenant isolation, and governance policy integration.
"""

import pytest
from deepclaw.governance.identity import AgentIdentity
from deepclaw.governance.policy import PreExecutionPolicyEngine
from deepclaw.governance.rbac import Role
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


def test_multi_tenant_memory_isolation():
    ltm = LongTermMemory()

    # Store memory for Tenant Alpha
    ltm.store_memory("Alpha confidential strategy info", tenant_id="tenant-alpha", agent_id="agent-1")
    # Store memory for Tenant Beta
    ltm.store_memory("Beta internal roadmap plans", tenant_id="tenant-beta", agent_id="agent-2")

    # Tenant Alpha search for Beta's content should return 0 results due to tenant boundary isolation
    alpha_results = ltm.search_memories("roadmap", tenant_id="tenant-alpha")
    assert len(alpha_results) == 0

    # Tenant Beta search should find Beta's memory
    beta_results = ltm.search_memories("roadmap data", tenant_id="tenant-beta")
    assert len(beta_results) == 1
    assert beta_results[0]["tenant_id"] == "tenant-beta"


def test_governed_memory_write_denial():
    policy_engine = PreExecutionPolicyEngine()
    restricted_identity = AgentIdentity(
        name="RestrictedAgent",
        roles=[Role.RESTRICTED_AGENT.value],
        tenant_id="tenant-alpha",
    )

    ltm = LongTermMemory(policy_engine=policy_engine, default_identity=restricted_identity)

    # Restricted agent attempting store_memory should fail due to lack of memory_write role permission
    with pytest.raises(PermissionError) as exc_info:
        ltm.store_memory("Attempting un-authorized write")
    
    assert "Memory write denied by policy" in str(exc_info.value)


def test_governed_memory_write_permitted():
    policy_engine = PreExecutionPolicyEngine()
    operator_identity = AgentIdentity(
        name="OperatorAgent",
        roles=[Role.WORKFLOW_OPERATOR.value],
        tenant_id="tenant-alpha",
    )

    ltm = LongTermMemory(policy_engine=policy_engine, default_identity=operator_identity)

    mem_id = ltm.store_memory("Operator allowed memory write")
    assert mem_id.startswith("mem-")

    results = ltm.search_memories("Operator allowed")
    assert len(results) == 1


def test_memory_backend_registry():
    backend = MemoryBackendRegistry.get("postgres")
    assert isinstance(backend, LongTermMemory)
