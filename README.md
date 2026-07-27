# DeepClaw — An Enterprise-Governance-First Open Source AI Agent Framework

**DeepClaw** is a lean, model-agnostic AI agent framework engineered from day one with **enterprise governance, evaluation harnesses, and security as core primitives**, not enterprise upsells bolted on later.

---

## 🌟 Key Features

- **🛡️ Agent Zero Trust & Pre-Execution Policy Engine**: Permits or denies every tool call *before* execution with a complete reasoning trace.
- **🔄 Stateful Cyclic Graph Execution**: LangGraph-inspired directed graph engine with durable state checkpointing, human-in-the-loop pause/resume, and subagent delegation up to 3 levels.
- **🔌 Industry Protocols**: Native Model Context Protocol (MCP) stateless tool/context connection + Agent2Agent (A2A) interop protocol.
- **📊 Harness-First Evaluation & Production Replay**: Convert any production trace into a permanent test case and catch prompt/model regressions before deployment.
- **🧠 Pluggable Memory**: Seamlessly swap short-term context buffers and long-term vector stores without altering agent code.
- **💬 Governed Messaging Channels**: Built-in channel router supporting 25+ messaging platforms (WhatsApp, Telegram, Slack, Discord, iMessage, Webhooks) enforcing per-channel RBAC permission ceilings.

---

## 🏛️ Architectural Lineage & Reference Mapping

DeepClaw synthesizes the best proven patterns from existing agent frameworks into a single, leaner system with Zero-Trust governance built in from day one:

| Reference Framework | Pattern Borrowed | Why It Was Chosen | DeepClaw Implementation |
|:---|:---|:---|:---|
| **LangGraph** | Graph-based execution model (nodes/edges, cycles, checkpoints) | Best solved pattern for stateful multi-step agent loops without abstraction bloat | [`deepclaw/core/graph.py`](deepclaw/core/graph.py) · [`state.py`](deepclaw/core/state.py) |
| **OpenManus** | Agent hierarchy (`BaseAgent` → specialized agents) & modular tool interface | Small, clean architectural skeleton that is transparent and easy to inspect | [`deepclaw/core/agent.py`](deepclaw/core/agent.py) · [`tools/schema.py`](deepclaw/tools/schema.py) |
| **Mem0** | Memory abstraction layer (short-term buffer vs. long-term vector persistence) | Purpose-built memory separation avoiding fragile custom state persistence | [`deepclaw/memory/short_term.py`](deepclaw/memory/short_term.py) · [`long_term.py`](deepclaw/memory/long_term.py) |
| **OpenAI & Claude Agent SDKs** | Tool-calling schema & guardrails pattern | Provider-agnostic tool definitions ensuring no vendor lock-in | [`deepclaw/tools/guardrails.py`](deepclaw/tools/guardrails.py) · [`llm/litellm_adapter.py`](deepclaw/llm/litellm_adapter.py) |
| **CrewAI** | Role-based multi-agent delegation pattern | Structured delegation & parallel aggregation across specialized subagent teams | [`deepclaw/agents/coordinator.py`](deepclaw/agents/coordinator.py) |

---

## 📁 Repository Structure

```
deepclaw/
├── core/            # Execution graph engine, checkpoints, agent hierarchy
├── llm/             # Model-agnostic LiteLLM adapter & fallback chains
├── protocols/       # Native MCP & A2A protocol clients
├── tools/           # Typed tool schema & pre-execution guardrails
├── memory/          # Short-term conversation buffers & long-term vector store abstractions
├── evals/           # Capability harness, regression runner, and trace replay engine
├── governance/      # Agent Zero Trust identity, pre-execution RBAC/policy, SIEM audit logging, sandbox, & human checkpoints
├── channels/        # Base channel interface, channel router with permission ceilings, & platform adapters
└── observability/   # Structured trace logging feeding evals/replay automatically
```

---

## 🚀 Quick Start

```bash
# Clone and install dependencies
cd DeepCLAW
pip install -e .[dev]

# Run tests & eval harness
pytest
```

---

## 🛡️ License & Security Policy

- **License**: MIT
- **Security Policy**: See [SECURITY.md](SECURITY.md) for Zero Trust defaults and vulnerability disclosure policies.
