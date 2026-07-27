# DeepClaw 🦅

### *An Enterprise-Governance-First, Open Source AI Agent Framework*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/@svgph/deepclaw.svg)](https://www.npmjs.com/package/@svgph/deepclaw)
[![Python 3.12+](https://img.shields.io/badge/Python-3.12%2B-brightgreen.svg)](pyproject.toml)
[![Build Status](https://img.shields.io/badge/Tests-100%25%20Passing-success.svg)](tests/)
[![Governance](https://img.shields.io/badge/Governance-Zero--Trust%20Default-purple.svg)](deepclaw/governance/)
[![Protocol](https://img.shields.io/badge/Protocol-MCP%20%7C%20A2A-orange.svg)](deepclaw/protocols/)

DeepClaw is a lean, model-agnostic AI agent framework built from the ground up around three ideas that most agent tooling treats as an afterthought: **governance, evaluation, and trust**.

Agents that can act — send messages, call tools, touch external systems — need more than capability. They need a record of *why* they acted, a boundary on *what* they're allowed to do, and a way to prove both to the people responsible for them. DeepClaw makes all three first-class citizens of the framework, not a bolt-on module you add before a compliance review.

---

## 🌟 Why DeepClaw

Autonomous agents are only as trustworthy as the guardrails around them. An agent with no permission boundary, no audit trail, and no pre-execution review isn't just a technical risk — it's a liability the moment it's given a real task.

DeepClaw's answer: **every tool call passes through a Zero-Trust pre-execution policy engine** that renders a `PERMIT` or `DENY` decision — with a full reasoning trace — *before* the action ever happens. Nothing runs first and gets reviewed after.

---

## 🚀 Key Framework Primitives

### 1. 🛡️ Zero-Trust Pre-Execution Policy Engine
Every tool call is evaluated and logged in SIEM-ready JSON *before* it executes — not after.

```python
from deepclaw.governance import PreExecutionPolicyEngine, AgentIdentity

policy = PreExecutionPolicyEngine()
identity = AgentIdentity(name="SecurityBot", roles=["restricted_agent"])

decision = policy.evaluate_tool_call(identity, tool_name="admin_drop_db", arguments={})
print(decision.permitted)  # False — blocked before execution
```

### 2. 🔄 Autonomous Self-Correction & Reflection Loop
Tool failures are retried with structured reflection and exponential backoff, rather than surfacing raw errors to the caller.

```python
from deepclaw.core import SelfCorrectionLoop

loop = SelfCorrectionLoop(max_retries=3)
success, result, error = await loop.execute_with_reflection(flaky_tool_fn, args)
```

### 3. 💬 Governed Multi-Platform Messaging Router
Inbound messages from any connected channel — chat apps, webhooks, or custom integrations — route through the same RBAC permission ceiling and audit trail, regardless of source.

```python
from deepclaw.channels import ChannelRouter
from deepclaw.channels.adapters import TelegramChannel, WhatsAppChannel

router = ChannelRouter()
router.register_channel(TelegramChannel())
router.register_channel(WhatsAppChannel())

res = await router.route_inbound("telegram", raw_payload, agent_handler)
```

### 4. 📊 Harness-First Evaluations & Production Replay
Turn any real production trace into a permanent regression test with a single call — your eval suite grows from real usage, not hand-written scenarios alone.

```python
from deepclaw.evals import TraceReplayEngine, EvalHarness

scenario = TraceReplayEngine.trace_to_eval_scenario(production_trace)
harness = EvalHarness([scenario])
report = await harness.run_evals(agent_runner)
```

### 5. 📜 Automated Compliance Reporting
Generates audit-ready evidence reports mapped to recognized AI governance and security standards.

```python
from deepclaw.governance import ComplianceReportGenerator

gen = ComplianceReportGenerator(audit_logger)
print(gen.export_markdown_report())
```

---

## 💻 Quickstart

```bash
# Install in editable mode
pip install -e .

# Start an interactive, governed session
deepclaw chat

# Run capability evaluation scenarios
deepclaw eval

# Generate a compliance readiness report
deepclaw report
```

---

## 📁 Repository Structure

```
deepclaw/
├── core/            # Stateful cyclic graph engine, checkpoints, agent hierarchy, self-correction
├── llm/             # Model-agnostic adapter layer & fallback chains
├── protocols/       # Standardized tool-context and agent-to-agent interop clients
├── tools/           # Typed tool schemas & pre-execution guardrails
├── memory/          # Short-term context buffers & long-term vector store abstractions
├── evals/           # Capability harness, regression runner, and trace replay engine
├── governance/      # Identity, pre-execution policy, audit logging, sandboxing, and compliance reporting
├── channels/        # Universal channel interface, permission-scoped router, and platform adapters
├── cli/             # Interactive terminal entry points
└── observability/   # Trace logging and telemetry exporters
```

---

## 🔒 Security Posture

DeepClaw defaults to a **zero-open-port deployment model** — agents are reachable through secure tunneling rather than exposed public ports, closing off the most common source of accidental instance exposure. See `docs/ZERO_OPEN_PORT_DEPLOYMENT.md` for setup guides.

Found a vulnerability? See [SECURITY.md](SECURITY.md) for our private disclosure process.

---

## 🤝 Contributing

DeepClaw is built in the open. Issues, discussions, and pull requests are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on development setup, code style, and how governance/eval changes are reviewed.

---

## 📄 License

DeepClaw is open-source software licensed under the [MIT License](LICENSE).
