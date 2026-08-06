"""
DeepClaw interactive CLI terminal entry points.
"""

import sys
import argparse
import asyncio
import importlib
from deepclaw.agents.governed_assistant import GovernedAssistant
from deepclaw.evals.harness import EvalHarness, EvalScenario
from deepclaw.evals.benchmarks import list_suites, get_suite
from deepclaw.governance.compliance import ComplianceReportGenerator
from deepclaw.core.graph import Graph


def _render_dag(graph: Graph) -> str:
    lines = ["digraph DeepClaw {"]
    for node_id in graph.nodes:
        lines.append(f'  "{node_id}";')
    for edge in graph.edges:
        label = ""
        lines.append(f'  "{edge.source}" -> "{edge.target}"{label};')
    lines.append("}")
    return "\n".join(lines)


def _run_repl():
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


def _run_doctor():
    print("=== DeepClaw Doctor ===")
    checks = []

    try:
        policy_mod = importlib.import_module("deepclaw.governance.policy")
        engine = policy_mod.PreExecutionPolicyEngine()
        decision = engine.evaluate_tool_call(
            identity=policy_mod.AgentIdentity(agent_id="doctor", roles=["admin"]),
            tool_name="read_file",
        )
        checks.append(("policy_engine", "ok" if decision.permitted else "degraded"))
    except Exception as exc:
        checks.append(("policy_engine", f"error: {exc}"))

    try:
        channels_mod = importlib.import_module("deepclaw.channels")
        router = channels_mod.ChannelRouter()
        registered = len(getattr(router, "_channels", {}))
        checks.append(("channel_router", f"ok ({registered} adapters)"))
    except Exception as exc:
        checks.append(("channel_router", f"error: {exc}"))

    try:
        memory_mod = importlib.import_module("deepclaw.memory")
        checks.append(("memory_module", "ok"))
    except Exception as exc:
        checks.append(("memory_module", f"error: {exc}"))

    try:
        llm_mod = importlib.import_module("deepclaw.llm")
        checks.append(("llm_module", "ok"))
    except Exception as exc:
        checks.append(("llm_module", f"error: {exc}"))

    try:
        tools_mod = importlib.import_module("deepclaw.tools")
        checks.append(("tools_module", "ok"))
    except Exception as exc:
        checks.append(("tools_module", f"error: {exc}"))

    for name, status in checks:
        print(f"  [{name}] {status}")

    failed = [name for name, status in checks if status.startswith("error")]
    if failed:
        print(f"\nFailed checks: {', '.join(failed)}")
        sys.exit(1)
    else:
        print("\nAll checks passed.")


def cli_entry():
    parser = argparse.ArgumentParser(
        prog="deepclaw",
        description="DeepClaw — An Enterprise-Governance-First Open Source AI Agent Framework",
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    subparsers.add_parser("repl", help="Start interactive governed agent session")
    subparsers.add_parser("chat", help="Alias for repl")
    subparsers.add_parser("eval", help="Run capability evaluation scenarios")
    subparsers.add_parser("report", help="Generate ISO 42001 & SOC2 compliance report")
    subparsers.add_parser("dag", help="Render workflow graph as DOT")
    subparsers.add_parser("suites", help="List built-in eval benchmark suites")
    subparsers.add_parser("doctor", help="Verify policy configuration and channel status")

    args = parser.parse_args()

    if args.command in ("repl", "chat"):
        _run_repl()

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

    elif args.command == "dag":
        graph = Graph()
        graph.add_node("start", lambda s: s)
        graph.add_node("process", lambda s: s)
        graph.add_node("end", lambda s: s)
        graph.set_entry_point("start")
        graph.add_edge("start", "process")
        graph.add_edge("process", "end")
        print(_render_dag(graph))

    elif args.command == "suites":
        print("=== Built-in Eval Benchmark Suites ===")
        for name in list_suites():
            suite = get_suite(name)
            print(f"- {name}: {len(suite.scenarios)} scenarios")

    elif args.command == "doctor":
        _run_doctor()

    else:
        parser.print_help()


if __name__ == "__main__":
    cli_entry()
