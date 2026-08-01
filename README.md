# DeepCLAW 🦅

### *An Enterprise Agentic AI Security, Governance & Multi-Platform Orchestration Framework*
***A Project by [SILICON VALLEY GLOBAL PH INC](https://svg.ph)***

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/@svgph/deepclaw.svg)](https://www.npmjs.com/package/@svgph/deepclaw)
[![PyPI version](https://img.shields.io/pypi/v/deepclaw.svg)](https://pypi.org/project/deepclaw/)
[![Company Website](https://img.shields.io/badge/Website-svg.ph-brightgreen.svg)](https://svg.ph)
[![Python Version](https://img.shields.io/badge/Python-3.12%2B-blue.svg)](pyproject.toml)
[![Build Status](https://img.shields.io/badge/Pytest-37%20Passing-success.svg)](deepclaw/tests/)

**DeepCLAW** is a production-grade security, policy-governance, multi-tenant memory, and orchestration platform built for agentic AI applications. Created and maintained by **[SILICON VALLEY GLOBAL PH INC](https://svg.ph)**.

---

## 🌟 Key Architecture Pillars

### 1. 🛡️ Pre-Execution Policy Engine (`deepclaw/governance/policy.py`)
Zero-Trust action evaluation (`TOOL_CALL`, `MEMORY_WRITE`, `MEMORY_READ`, `CHANNEL_SEND`, `STATE_MUTATION`) with role-based access control (RBAC), parameter validation, and SIEM audit logging.

```python
from deepclaw.governance import PolicyEngine, PolicyRule, ActionType, Identity

policy = PolicyEngine(rules=[
    PolicyRule(id="rule-01", action_type=ActionType.TOOL_CALL, allowed_roles=["admin"], target_resource="exec_bash")
])

identity = Identity(user_id="user-101", roles=["developer"])
decision = policy.evaluate(ActionType.TOOL_CALL, target_resource="exec_bash", identity=identity)
# decision.allowed == False (blocked by policy engine)
```

### 2. 🧠 Multi-Tenant Memory Isolation (`deepclaw/memory/long_term.py`)
Governed multi-tenant vector storage with cosine similarity and strict `tenant_id` and `agent_id` isolation boundaries.

```python
from deepclaw.memory import LongTermMemory

ltm = LongTermMemory(policy_engine=policy, default_identity=identity)
mem_id = ltm.store_memory("Confidential strategic plan", tenant_id="tenant-alpha")
results = ltm.search_memories("strategic plan", tenant_id="tenant-alpha")
```

### 3. 🔌 Production Model Context Protocol (MCP) & Agent-to-Agent (A2A) Clients
Native JSON-RPC 2.0 MCP Client (`initialize`, `tools/list`, `tools/call`) and full A2A Agent Card discovery (`/.well-known/agent-card.json`) with task lifecycle management (`SUBMITTED` $\rightarrow$ `WORKING` $\rightarrow$ `COMPLETED`).

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
Run capability evaluations with exact match, contains, semantic vector similarity, and guardrail adversarial scorers, or convert production traces into regression tests.

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

### Installation

```bash
# Install Python package
pip install deepclaw

# Or install TypeScript / Node.js bindings via npm
npm install @svgph/deepclaw
```

### CLI Commands

```bash
# Start an interactive, governed session
deepclaw repl

# Verify policy configuration and channel status
deepclaw doctor

# Generate an ISO 42001 & SOC 2 compliance report
deepclaw report
```

---

## 📂 Repository Structure

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
- 💬 **[Channel Gateway Guide](docs/CHANNEL_GATEWAY.md)** — Complete 24 messaging platform channel adapters guide.
- 📊 **[Evals & Production Replay](docs/EVALS_AND_REPLAY.md)** — Capability evaluation harness & 1-command trace replay.
- 🔒 **[Zero-Open-Port Security Deployment](docs/ZERO_OPEN_PORT_DEPLOYMENT.md)** — Cloudflare Tunnel reverse proxy setup.
- 📜 **[Changelog](CHANGELOG.md)** — Release notes and version history.

---

## 🔒 Security Posture & Zero-Open-Port Model

DeepCLAW defaults to a **zero-open-port deployment model** — agents are reachable through secure tunneling rather than exposed public ports, closing off accidental instance exposure. See [`docs/ZERO_OPEN_PORT_DEPLOYMENT.md`](docs/ZERO_OPEN_PORT_DEPLOYMENT.md) for setup guides.

Found a vulnerability? See [SECURITY.md](SECURITY.md) for our private disclosure process.

---

## 📄 License & Attribution

DeepCLAW is open-source software developed and maintained by **[SILICON VALLEY GLOBAL PH INC](https://svg.ph)** and licensed under the [MIT License](LICENSE).
