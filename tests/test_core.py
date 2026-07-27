"""
Unit tests for core directed graph engine, state, checkpointing, and agent hierarchy.
"""

import pytest
from deepclaw.core.state import State
from deepclaw.core.graph import Graph, END
from deepclaw.core.agent import BaseAgent, ToolCallAgent


@pytest.mark.asyncio
async def test_graph_execution_flow():
    graph = Graph()

    def step_one(state: State):
        state.set("count", state.get("count", 0) + 1)
        return {"step1_done": True}

    def step_two(state: State):
        state.set("count", state.get("count", 0) + 10)
        return {"step2_done": True}

    graph.add_node("step1", step_one)
    graph.add_node("step2", step_two)
    graph.set_entry_point("step1")
    graph.add_edge("step1", "step2")
    graph.add_edge("step2", END)

    final_state = await graph.run()
    assert final_state.get("count") == 11
    assert final_state.get("step1_done") is True
    assert final_state.get("step2_done") is True


def test_agent_hierarchy_spawning():
    root = BaseAgent(name="RootAgent", role="orchestrator")
    child = root.spawn_subagent(name="ChildAgent", role="worker")
    grandchild = child.spawn_subagent(name="GrandchildAgent", role="specialist")

    assert root.depth == 1
    assert child.depth == 2
    assert grandchild.depth == 3

    with pytest.raises(ValueError, match="Maximum subagent hierarchy depth"):
        grandchild.spawn_subagent(name="OverLimit", role="blocked")


@pytest.mark.asyncio
async def test_coordinator_agent_delegation():
    from deepclaw.agents.coordinator import CoordinatorAgent

    coordinator = CoordinatorAgent(name="ChiefCoordinator")
    worker = BaseAgent(name="WorkerAgent", role="developer")
    coordinator.add_worker(worker)

    res = await coordinator.delegate_task("WorkerAgent", "Write unit test")
    assert res["delegation_permitted"] is True
    assert res["worker"] == "WorkerAgent"
    assert res["result"]["agent_name"] == "WorkerAgent"
