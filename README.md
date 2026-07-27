# DeepClaw 🦅

### *An Enterprise-Governance-First Open Source AI Agent Framework*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/@svgph/deepclaw.svg)](https://www.npmjs.com/package/@svgph/deepclaw)
[![Python 3.12+](https://img.shields.io/badge/Python-3.12%2B-brightgreen.svg)](pyproject.toml)
[![Build Status](https://img.shields.io/badge/Tests-100%25%20Passing-success.svg)](tests/)
[![Governance](https://img.shields.io/badge/Governance-Zero--Trust%20Default-purple.svg)](deepclaw/governance/)
[![Protocol](https://img.shields.io/badge/Protocol-MCP%20%7C%20A2A-orange.svg)](deepclaw/protocols/)

DeepClaw is a lean, model-agnostic AI agent framework engineered from day one with **enterprise governance, evaluation harnesses, and security as core primitives**, not enterprise upsells bolted on later.

---

## 🌟 Why DeepClaw? (Closing the OpenClaw Gap)

Most agent frameworks are developer-experience-first and treat governance, security, and evaluations as an after-thought:
- **The Security Risk**: Public instances of un-governed frameworks are often exposed directly to the internet without identity verification or policy controls.
- **The DeepClaw Edge**: Every tool call in DeepClaw passes through a **Zero-Trust pre-execution policy engine** rendering `PERMIT` or `DENY` decisions with full reasoning traces *before* the action takes place.

---

## 🏛️ Architectural Lineage & Reference Mapping

DeepClaw synthesizes the best proven patterns from industry reference frameworks into a single composable architecture:

| Reference Framework | Pattern Synthesized | Why It Was Chosen | DeepClaw Implementation |
|:---|:---|:---|:---|
| **LangGraph** | Graph-based execution model (nodes/edges, cycles, checkpoints) | Best solved pattern for stateful multi-step agent loops without abstraction bloat | [`deepclaw/core/graph.py`](deepclaw/core/graph.py) · [`state.py`](deepclaw/core/state.py) |
| **OpenManus** | Agent hierarchy (`BaseAgent` → specialized agents) & modular tool interface | Small, clean architectural skeleton that is transparent and easy to inspect | [`deepclaw/core/agent.py`](deepclaw/core/agent.py) · [`tools/schema.py`](deepclaw/tools/schema.py) |
| **Mem0** | Memory abstraction layer (short-term buffer vs. long-term vector persistence) | Purpose-built memory separation avoiding fragile custom state persistence | [`deepclaw/memory/short_term.py`](deepclaw/memory/short_term.py) · [`long_term.py`](deepclaw/memory/long_term.py) |
| **OpenAI & Claude Agent SDKs** | Tool-calling schema & guardrails pattern | Provider-agnostic tool definitions ensuring no vendor lock-in | [`deepclaw/tools/guardrails.py`](deepclaw/tools/guardrails.py) · [`llm/litellm_adapter.py`](deepclaw/llm/litellm_adapter.py) |
| **CrewAI** | Role-based multi-agent delegation pattern | Structured delegation & parallel aggregation across specialized subagent teams | [`deepclaw/agents/coordinator.py`](deepclaw/agents/coordinator.py) |

---

## 🚀 Key Framework Primitives

### 1. 🛡️ Agent Zero-Trust Pre-Execution Policy Engine
Permits or denies every tool call *before* execution with a complete reasoning trace logged to SIEM JSON format.
```python
from deepclaw.governance import PreExecutionPolicyEngine, AgentIdentity

policy = PreExecutionPolicyEngine()
identity = AgentIdentity(name="SecurityBot", roles=["restricted_agent"])

decision = policy.evaluate_tool_call(identity, tool_name="admin_drop_db", arguments={})
print(decision.permitted)  # False (Blocked before execution)
```

### 2. 🔄 Autonomous Self-Correction & Reflection Loop
Retries tool execution failures automatically with step reflection and exponential backoff:
```python
from deepclaw.core import SelfCorrectionLoop

loop = SelfCorrectionLoop(max_retries=3)
success, result, error = await loop.execute_with_reflection(flaky_tool_fn, args)
```

### 3. 💬 Governed 14+ Platform Messaging Channel Router
Inbound traffic from WhatsApp, Telegram, Slack, Discord, iMessage, WeChat, Teams, and Webhooks routes through defined RBAC permission ceilings:
```python
from deepclaw.channels import ChannelRouter
from deepclaw.channels.adapters import TelegramChannel, WhatsAppChannel

router = ChannelRouter()
router.register_channel(TelegramChannel())
router.register_channel(WhatsAppChannel())

res = await router.route_inbound("telegram", raw_payload, agent_handler)
```

### 4. 📊 Harness-First Evals & Production Replay
Convert any production trace into a permanent evaluation scenario with one command:
```python
from deepclaw.evals import TraceReplayEngine, EvalHarness

scenario = TraceReplayEngine.trace_to_eval_scenario(production_trace)
harness = EvalHarness([scenario])
report = await harness.run_evals(agent_runner)
```

### 5. 📜 ISO 42001 & SOC 2 Compliance Report Engine
Generates automated compliance evidence reports mapped directly to ISO/IEC 42001 AI Management System and SOC 2 Trust Criteria:
```python
from deepclaw.governance import ComplianceReportGenerator

gen = ComplianceReportGenerator(audit_logger)
print(gen.export_markdown_report())
```

---

## 💻 CLI Quickstart

```bash
# Install DeepClaw in editable mode
pip install -e .

# 1. Start interactive governed terminal session
deepclaw chat

# 2. Run capability evaluation scenarios
deepclaw eval

# 3. Generate ISO 42001 & SOC 2 audit readiness report
deepclaw report
```

---

## 📁 Repository Structure

```
deepclaw/
├── core/            # Stateful cyclic graph engine, checkpoints, agent hierarchy, self-correction
├── llm/             # Model-agnostic LiteLLM adapter & fallback chains
├── protocols/       # Native MCP (Model Context Protocol) & A2A interop clients
├── tools/           # Typed tool schema & pre-execution guardrails
├── memory/          # Short-term context buffers & long-term vector store abstractions
├── evals/           # Capability harness, regression runner, and trace replay engine
├── governance/      # Agent Zero Trust identity, pre-execution RBAC/policy, SIEM audit logging, sandbox, & ISO 42001 compliance
├── channels/        # Universal channel interface, router with permission ceilings, & 14+ platform adapters
├── cli/             # Interactive terminal CLI entry points
└── observability/   # Trace logging & OpenTelemetry (OTel) / Langfuse exporters
```

---

## 🔒 Security & Zero-Open-Port Architecture

DeepClaw mandates a **Zero-Open-Port default posture** to protect against public instance exposure. See [docs/ZERO_OPEN_PORT_DEPLOYMENT.md](docs/ZERO_OPEN_PORT_DEPLOYMENT.md) for Cloudflare Tunnel deployment guides.

- **Vulnerability Disclosure**: See [SECURITY.md](SECURITY.md).

---

## 📄 License

DeepClaw is open-source software licensed under the [MIT License](LICENSE).
