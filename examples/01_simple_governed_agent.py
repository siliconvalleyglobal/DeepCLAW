"""
Example 01: Simple Governed AI Agent demonstrating Zero-Trust pre-execution policy enforcement.
"""

import asyncio
from deepclaw.agents.governed_assistant import GovernedAssistant


async def main():
    print("=== DeepClaw Example 01: Simple Governed Agent ===")
    agent = GovernedAssistant(name="SecurityAssistant")

    # 1. Execute allowed action
    print("\n[1] Executing permitted tool action...")
    res = await agent.execute_tool_safely("read", {"path": "/docs/readme.txt"})
    print("Result:", res)

    # 2. Inspect SIEM audit logs
    print("\n[2] Exporting SIEM audit log:")
    print(agent.audit_logger.export_siem_json())


if __name__ == "__main__":
    asyncio.run(main())
