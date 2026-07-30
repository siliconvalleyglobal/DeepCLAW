# DeepClaw 🦅

### *An Enterprise-Governance-First, Open Source AI Agent Framework*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/@svgph/deepclaw.svg)](https://www.npmjs.com/package/@svgph/deepclaw)
[![Python 3.12+](https://img.shields.io/badge/Python-3.12%2B-brightgreen.svg)](pyproject.toml)
[![Build Status](https://img.shields.io/badge/Tests-100%25%20Passing-success.svg)](tests/)
[![Governance](https://img.shields.io/badge/Governance-Zero--Trust%20Default-purple.svg)](deepclaw/governance/)
[![Protocol](https://img.shields.io/badge/Protocol-MCP%20%7C%20A2A-orange.svg)](deepclaw/protocols/)

DeepClaw is a lean, model-agnostic AI agent framework built from the ground up around three ideas that most agent tooling treats as an afterthought: **governance, evaluation, and trust**.

Agents that can act — send messages, call tools, mutate state, write memory, touch external systems — need more than capability. They need a record of *why* they acted, a boundary on *what* they're allowed to do, and a way to prove both to the people responsible for them. DeepClaw makes all three first-class citizens of the framework, not a bolt-on module you add before a compliance review.

---

## 🌟 Why DeepClaw

Autonomous agents are only as trustworthy as the guardrails around them. An agent with no permission boundary, no audit trail, and no pre-execution review isn't just a technical risk — it's a liability the moment it's given a real task.

DeepClaw's answer: **every tool call, memory write, channel send, and state mutation passes through a Zero-Trust pre-execution policy engine** that renders a `PERMIT` or `DENY` decision — with a full reasoning trace — *before* the action ever happens. Nothing runs first and gets reviewed after.

---

## 🚀 Key Framework Primitives

### 1. 🛡️ Zero-Trust Pre-Execution Policy Engine
Every action (tool calls, memory mutations, channel outbound) is evaluated and logged in SIEM-ready JSON *before* it executes — not after.

```python
from deepclaw.governance import PreExecutionPolicyEngine, AgentIdentity, ActionType

policy = PreExecutionPolicyEngine()
identity = AgentIdentity(name="SecurityBot", roles=["restricted_agent"], tenant_id="tenant-alpha")

# Tool call evaluation
decision = policy.evaluate_tool_call(identity, tool_name="admin_drop_db", arguments={})
print(decision.permitted)  # False — blocked before execution

# Memory action evaluation
mem_decision = policy.evaluate_action(identity, ActionType.MEMORY_WRITE, target="long_term_memory")
print(mem_decision.permitted)  # False — restricted agent lacks memory_write role
```

### 2. 🧠 Governed Multi-Tenant Vector Long-Term Memory
Multi-tenant boundary isolation guarantees Tenant A cannot view or search Tenant B's memories. All memory writes and searches route through governance policy checks.

```python
from deepclaw.memory import LongTermMemory

ltm = LongTermMemory(policy_engine=policy, default_identity=identity)
mem_id = ltm.store_memory("Confidential strategic plan", tenant_id="tenant-alpha")
results = ltm.search_memories("strategic plan", tenant_id="tenant-alpha")
```

### 3. 🔌 Production Model Context Protocol (MCP) & Agent-to-Agent (A2A) Clients
Native JSON-RPC 2.0 MCP Client (`initialize`, `tools/list`, `tools/call`) and full A2A Agent Card discovery (`/.well-known/agent-card.json`) with task lifecycle management (`SUBMITTED` -> `WORKING` -> `COMPLETED`).

```python
from deepclaw.protocols import MCPClient, A2AClient

mcp = MCPClient(server_url="http://localhost:8000/mcp")
tools = await mcp.list_tools()
res = await mcp.call_tool("mcp_query", {"query": "deepclaw"})

a2a = A2AClient(agent_endpoint="http://agent-b.internal/a2a")
card = await a2a.fetch_agent_card()
task = await a2a.create_task(prompt="Analyze report", sender_id="agent-a")
```

### 4. 💬 Governed 24-Platform Messaging Gateway
Connect 24 messaging channels — Slack, Telegram, WhatsApp, Discord, Signal, LINE, KakaoTalk, Messenger, Instagram DM, Twitter/X DM, Rocket.Chat, Mattermost, Zalo, Viber, iMessage, WeChat, Feishu, Matrix, Teams, Google Chat, SMS, Email, WebChat Widget, and Webhooks — through a single RBAC-governed router.

```python
from deepclaw.channels import ChannelRouter
from deepclaw.channels.adapters import TelegramChannel, SignalChannel, LineChannel

router = ChannelRouter()
router.register_channel(TelegramChannel())
router.register_channel(SignalChannel())
router.register_channel(LineChannel())

res = await router.route_inbound("signal", raw_payload, agent_handler)
```

### 5. 📊 Pluggable Evals Harness & Production Replay
Run capability evaluations with exact, contains, semantic vector similarity, and guardrail adversarial scorers, or convert production traces into regression tests.

```python
from deepclaw.evals import EvalHarness, EvalScenario

harness = EvalHarness([
    EvalScenario(id="s1", name="Safety Test", prompt="leak api_key", expected_output="blocked", scorer="guardrail"),
    EvalScenario(id="s2", name="Semantic Test", prompt="Summarize", expected_output="Governance framework", scorer="semantic")
])
report = await harness.run_evals(agent_runner)
```

---

## 💻 Quickstart

```bash
# Install package from npm or pip
npm install @svgph/deepclaw

# Or python package editable mode
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
├── protocols/       # Production JSON-RPC 2.0 MCP & A2A task lifecycle clients
├── tools/           # Typed tool schemas & pre-execution guardrails
├── memory/          # Governed multi-tenant vector memory & context buffers
├── evals/           # Harness, regression runner, trace replay, & pluggable scorers (exact, semantic, guardrail)
├── governance/      # Identity, pre-execution policy engine (all actions), audit logging, sandboxing, compliance
├── channels/        # 24 platform channel adapters, permission-scoped router
├── cli/             # Interactive terminal entry points
└── observability/   # Trace logging and telemetry exporters
```

---

## 📚 Documentation & Technical Guides

- 📖 **[User Manual & Operations Guide](docs/USER_MANUAL.md)** — Complete end-to-end setup, LLM binding, custom tools, state management, and CLI guide.
- 🏛️ **[Architecture Guide](docs/ARCHITECTURE.md)** — Graph execution engine, checkpoints, & memory tiering.
- 🛡️ **[Zero-Trust Governance & Security](docs/GOVERNANCE_AND_SECURITY.md)** — Pre-execution policy engine, SIEM audit logging, & ISO 42001 / SOC 2 compliance.
- 💬 **[Channel Gateway Guide](docs/CHANNEL_GATEWAY.md)** — Complete 24 messaging platform channel adapters.
- 📊 **[Evals & Production Replay](docs/EVALS_AND_REPLAY.md)** — Capability evaluation harness & 1-command trace replay.
- 📜 **[Changelog](CHANGELOG.md)** — Release notes and version history.

---

## 📄 License

DeepClaw is open-source software licensed under the [MIT License](LICENSE).
