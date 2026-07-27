"""
CrewAI-inspired multi-agent coordinator for role-based task delegation.
"""

import asyncio
from typing import Any, Dict, List
from deepclaw.core.agent import BaseAgent
from deepclaw.governance.identity import AgentIdentity
from deepclaw.governance.policy import PreExecutionPolicyEngine


class CoordinatorAgent(BaseAgent):
    """Coordinator agent managing subagent task delegation and response aggregation."""

    def __init__(self, name: str = "ChiefCoordinator"):
        super().__init__(name=name, role="coordinator", depth=1)
        self.workers: Dict[str, BaseAgent] = {}
        self.policy_engine = PreExecutionPolicyEngine()
        self.identity = AgentIdentity(name=self.name, roles=["admin"])

    def add_worker(self, agent: BaseAgent) -> None:
        """Register a specialized worker agent."""
        self.workers[agent.name] = agent
        self.subagents.append(agent)

    async def delegate_task(self, worker_name: str, task_prompt: str) -> Dict[str, Any]:
        """Delegate subtask to a specific registered worker with governance checks."""
        if worker_name not in self.workers:
            raise ValueError(f"Worker agent '{worker_name}' not registered under coordinator")

        # Evaluate delegation policy
        decision = self.policy_engine.evaluate_tool_call(
            identity=self.identity,
            tool_name="delegate_subtask",
            arguments={"worker": worker_name, "prompt": task_prompt},
        )

        if not decision.permitted:
            raise PermissionError(f"Delegation to '{worker_name}' denied: {decision.reasoning_trace}")

        worker = self.workers[worker_name]
        result = await worker.run_task(task_prompt)
        return {
            "coordinator": self.name,
            "worker": worker_name,
            "delegation_permitted": True,
            "result": result,
        }

    async def parallel_delegate(self, tasks: List[Dict[str, str]]) -> Dict[str, Any]:
        """Delegate multiple subtasks in parallel across specialized workers."""
        futures = [
            self.delegate_task(task["worker"], task["prompt"])
            for task in tasks
        ]
        results = await asyncio.gather(*futures, return_exceptions=True)

        aggregated = []
        for task, res in zip(tasks, results):
            if isinstance(res, Exception):
                aggregated.append({"task": task, "status": "error", "error": str(res)})
            else:
                aggregated.append({"task": task, "status": "success", "response": res})

        return {
            "coordinator": self.name,
            "task_count": len(tasks),
            "delegations": aggregated,
        }
