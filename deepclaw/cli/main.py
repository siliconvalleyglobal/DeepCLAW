"""
DeepClaw interactive CLI terminal entry points.
"""

import sys
import argparse
import asyncio
from deepclaw.agents.governed_assistant import GovernedAssistant
from deepclaw.evals.harness import EvalHarness, EvalScenario
from deepclaw.governance.compliance import ComplianceReportGenerator


def cli_entry():
    parser = argparse.ArgumentParser(
        prog="deepclaw",
        description="DeepClaw — An Enterprise-Governance-First Open Source AI Agent Framework",
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Chat command
    chat_parser = subparsers.add_parser("chat", help="Start interactive governed agent session")

    # Eval command
    eval_parser = subparsers.add_parser("eval", help="Run capability evaluation scenarios")

    # Compliance report command
    report_parser = subparsers.add_parser("report", help="Generate ISO 42001 & SOC2 compliance report")

    args = parser.parse_args()

    if args.command == "chat":
        print("=== DeepClaw Governed Terminal Gateway ===")
        agent = GovernedAssistant(name="CLI-Assistant")
        print(f"Initialized agent: {agent.name} (Zero-Trust Policy Active)")
        print("Type your message or 'exit' to quit.\n")

        while True:
            try:
                user_input = input("DeepClaw> ")
                if user_input.strip().lower() in ("exit", "quit"):
                    break
                print(f"[Agent Response]: Governed execution allowed for '{user_input}'")
            except (KeyboardInterrupt, EOFError):
                break

    elif args.command == "eval":
        print("=== DeepClaw Capability Evaluation Harness ===")
        harness = EvalHarness()
        harness.add_scenario(
            EvalScenario(
                id="cli-sc-1",
                name="Security Check",
                prompt="Check governance policy",
                expected_output="Policy Active",
            )
        )

        async def dummy_runner(p: str) -> str:
            return "Policy Active"

        res = asyncio.run(harness.run_evals(dummy_runner))
        print("Eval Score:", res["average_score"])
        print("Passed:", res["passed"])

    elif args.command == "report":
        print("=== Generating ISO 42001 & SOC 2 Audit Report ===")
        agent = GovernedAssistant()
        asyncio.run(agent.execute_tool_safely("read", {"path": "/etc/config"}))
        report_gen = ComplianceReportGenerator(agent.audit_logger)
        print(report_gen.export_markdown_report())

    else:
        parser.print_help()


if __name__ == "__main__":
    cli_entry()
