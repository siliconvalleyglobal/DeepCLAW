"""
Stateful, cyclic directed graph execution engine.
"""

import asyncio
from typing import Any, Callable, Dict, List, Optional, Union
from deepclaw.core.state import State, Checkpoint

END = "__END__"


class Node:
    """Executable node in the workflow graph."""

    def __init__(self, id: str, action: Callable[[State], Any]):
        self.id = id
        self.action = action

    async def execute(self, state: State) -> Any:
        if asyncio.iscoroutinefunction(self.action):
            return await self.action(state)
        return self.action(state)


class Edge:
    """Transition edge between graph nodes."""

    def __init__(
        self,
        source: str,
        target: str,
        condition: Optional[Callable[[State], bool]] = None,
    ):
        self.source = source
        self.target = target
        self.condition = condition

    def should_traverse(self, state: State) -> bool:
        if self.condition is None:
            return True
        return self.condition(state)


class Graph:
    """Stateful cyclic workflow graph engine."""

    def __init__(self):
        self.nodes: Dict[str, Node] = {}
        self.edges: List[Edge] = []
        self.entry_point: Optional[str] = None

    def add_node(self, id: str, action: Callable[[State], Any]) -> "Graph":
        self.nodes[id] = Node(id, action)
        return self

    def set_entry_point(self, node_id: str) -> "Graph":
        if node_id not in self.nodes:
            raise ValueError(f"Entry point node '{node_id}' not found in graph")
        self.entry_point = node_id
        return self

    def add_edge(
        self,
        source: str,
        target: str,
        condition: Optional[Callable[[State], bool]] = None,
    ) -> "Graph":
        if source not in self.nodes:
            raise ValueError(f"Source node '{source}' not defined")
        if target != END and target not in self.nodes:
            raise ValueError(f"Target node '{target}' not defined")
        self.edges.append(Edge(source, target, condition))
        return self

    async def run(
        self,
        initial_state: Optional[State] = None,
        max_steps: int = 100,
        checkpoint_id: Optional[str] = None,
    ) -> State:
        state = initial_state or State()
        current_node_id = self.entry_point
        if not current_node_id:
            raise ValueError("Graph has no entry point configured")

        steps = 0
        while current_node_id and current_node_id != END:
            if steps >= max_steps:
                raise RuntimeError(f"Max graph steps ({max_steps}) exceeded — probable infinite cycle")

            node = self.nodes[current_node_id]
            res = await node.execute(state)
            if isinstance(res, dict):
                state.update(res)

            state.create_checkpoint(node_id=current_node_id)
            steps += 1

            if state.get("__paused__"):
                break

            # Resolve next node
            next_node = None
            for edge in self.edges:
                if edge.source == current_node_id and edge.should_traverse(state):
                    next_node = edge.target
                    break

            if next_node is None:
                break
            current_node_id = next_node

        return state
