"""
Agent base classes and hierarchical subagent spawner.
"""

from typing import Any, Dict, List, Optional
import uuid


class BaseAgent:
    """Base AI Agent hierarchy representation."""

    def __init__(
        self,
        name: str,
        role: str = "assistant",
        depth: int = 1,
        max_depth: int = 3,
        agent_id: Optional[str] = None,
    ):
        self.agent_id = agent_id or str(uuid.uuid4())
        self.name = name
        self.role = role
        self.depth = depth
        self.max_depth = max_depth
        self.subagents: List["BaseAgent"] = []

    def spawn_subagent(self, name: str, role: str) -> "BaseAgent":
        if self.depth >= self.max_depth:
            raise ValueError(
                f"Maximum subagent hierarchy depth ({self.max_depth}) reached for agent '{self.name}'"
            )
        child = BaseAgent(
            name=name,
            role=role,
            depth=self.depth + 1,
            max_depth=self.max_depth,
        )
        self.subagents.append(child)
        return child

    async def run_task(self, prompt: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute task for this agent level."""
        return {
            "agent_id": self.agent_id,
            "agent_name": self.name,
            "role": self.role,
            "depth": self.depth,
            "response": f"Processed '{prompt}' at depth {self.depth}",
            "context": context or {},
        }


class ToolCallAgent(BaseAgent):
    """Agent capable of invoking registered MCP / python tools."""

    def __init__(
        self,
        name: str,
        role: str = "tool_assistant",
        tools: Optional[List[Any]] = None,
        depth: int = 1,
    ):
        super().__init__(name=name, role=role, depth=depth)
        self.tools = tools or []

    def register_tool(self, tool: Any) -> None:
        self.tools.append(tool)
