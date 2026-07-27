"""
Example 03: Multi-Agent Task Delegation across specialized subagents.
"""

import asyncio
from deepclaw.core.agent import BaseAgent
from deepclaw.agents.coordinator import CoordinatorAgent


async def main():
    print("=== DeepClaw Example 03: Multi-Agent Delegation ===")
    coordinator = CoordinatorAgent(name="TechLead")

    researcher = BaseAgent(name="ResearchAgent", role="researcher")
    coder = BaseAgent(name="CoderAgent", role="developer")

    coordinator.add_worker(researcher)
    coordinator.add_worker(coder)

    print("\n[1] Executing parallel delegation...")
    res = await coordinator.parallel_delegate(
        [
            {"worker": "ResearchAgent", "prompt": "Analyze MCP protocol specs"},
            {"worker": "CoderAgent", "prompt": "Implement Python adapter"},
        ]
    )

    print("\nDelegation Results:")
    for task in res["delegations"]:
        print(f"- Task for {task['task']['worker']}: {task['status']}")


if __name__ == "__main__":
    asyncio.run(main())
