# DeepCLAW

## Enterprise Agentic AI Security, Governance & Multi-Platform Orchestration Framework

**A Project by [SILICON VALLEY GLOBAL PH INC](https://svg.ph)**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/badge/npm-%40svgph%2Fdeepclaw-brightgreen.svg)](https://www.npmjs.com/package/@svgph/deepclaw)
[![PyPI version](https://img.shields.io/badge/PyPI-deepclaw-blue.svg)](https://pypi.org/project/deepclaw/)
[![Python Version](https://img.shields.io/badge/Python-3.12%2B-blue.svg)](pyproject.toml)
[![Node.js Version](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![Build Status](https://img.shields.io/badge/Build-Passing-success.svg)]()
[![Security](https://img.shields.io/badge/Security-Zero--Trust-brightgreen.svg)](SECURITY.md)
[![GitHub stars](https://img.shields.io/github/stars/siliconvalleyglobal/DeepCLAW?style=social)](https://github.com/siliconvalleyglobal/DeepCLAW)
[![GitHub forks](https://img.shields.io/github/forks/siliconvalleyglobal/DeepCLAW?style=social)](https://github.com/siliconvalleyglobal/DeepCLAW)

---

## Overview

DeepCLAW is a production-grade security, policy-governance, multi-tenant memory, and orchestration platform built for agentic AI applications. The framework provides enterprise organizations with a complete toolkit for deploying, governing, and monitoring autonomous AI agents across multiple platforms and communication channels.

### Core Capabilities

| Capability | Description |
|------------|-------------|
| **Pre-Execution Policy Engine** | Zero-Trust action evaluation with RBAC, parameter validation, and SIEM audit logging |
| **Multi-Tenant Memory Isolation** | Governed vector storage with strict tenant and agent isolation boundaries |
| **MCP & A2A Protocol Support** | Native JSON-RPC 2.0 MCP Client and A2A Agent Card discovery with task lifecycle management |
| **24-Platform Messaging Gateway** | Unified RBAC-governed router for Slack, Telegram, WhatsApp, Discord, Signal, and 19 more platforms |
| **Workflow Orchestration** | Visual workflow builder with conditional branching, loops, retries, sub-workflows, and real-time execution monitoring |
| **Credential Management** | Secure storage and retrieval of API keys, bearer tokens, OAuth2 credentials, and custom secrets |
| **Scheduled Execution** | Cron-based workflow scheduling with enable/disable controls and next-run computation |
| **Expression Engine** | Dynamic template resolution with variable interpolation, nested property access, and boolean evaluation |
| **Code Execution** | Sandboxed JavaScript execution with configurable timeouts for custom transformation logic |
| **Token Optimization** | Token-aware prompt compression, secret redaction, repository context ranking, and budget tracking |
| **Pluggable Evals Harness** | Capability evaluations with exact match, semantic similarity, and guardrail adversarial scorers |
| **Zero-Open-Port Deployment** | Secure tunneling via Cloudflare Tunnel or similar reverse proxy solutions |

---

## Quickstart

### Prerequisites

- Python 3.12 or higher
- Node.js 20 or higher
- pnpm 8 or higher (for Node.js development)

### Installation

```bash
# Install Python package
pip install deepclaw

# Install Node.js / TypeScript package
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

### Governance Dashboard

```bash
# Start the governance dashboard
cd ui/dashboard
pnpm install
pnpm dev

# Access at http://localhost:5173
```

---

## Repository Structure

```
deepclaw/
├── deepclaw/                   # Python package
│   ├── governance/             # Pre-execution policy engine, RBAC, audit logging
│   ├── memory/                 # Multi-tenant vector memory & context buffers
│   ├── protocols/              # MCP & A2A protocol clients
│   ├── channels/               # 24 platform channel adapters & router
│   ├── tools/                  # Typed tool schemas & guardrails
│   ├── evals/                  # Evaluation harness & regression runner
│   ├── observability/          # Trace logging and telemetry exporters
│   ├── cli/                    # Interactive terminal entry points
│   └── tests/                  # Python test suite (47 tests)
│
├── packages/                   # Node.js / TypeScript monorepo
│   ├── core/                   # Workflow engine, expression engine, scheduler, templates, credentials
│   ├── gateway/                # REST API, WebSocket gateway, policy enforcement
│   ├── sdk/                    # Token optimizer, DLP engine, budget guard
│   └── plugin-sdk/             # Plugin development toolkit
│
├── ui/
│   └── dashboard/              # Lit-based governance dashboard
│       └── src/components/     # Policy viewer, audit log, budget tracker, workflow builder
│
├── extensions/                 # Channel adapters & protocol extensions
├── docs/                       # Technical documentation
├── CHANGELOG.md                # Release notes
├── CONTRIBUTING.md             # Contribution guidelines
├── SECURITY.md                 # Security policy & vulnerability disclosure
└── README.md                   # This file
```

---

## Key Features

### 1. Pre-Execution Policy Engine

Enforce zero-trust action evaluation before any tool call, memory operation, or state mutation. Supports role-based access control (RBAC), parameter validation, and SIEM audit logging.

```python
from deepclaw.governance import PolicyEngine, PolicyRule, ActionType, Identity

policy = PolicyEngine(rules=[
    PolicyRule(id="rule-01", action_type=ActionType.TOOL_CALL, allowed_roles=["admin"], target_resource="exec_bash")
])

identity = Identity(user_id="user-101", roles=["developer"])
decision = policy.evaluate(ActionType.TOOL_CALL, target_resource="exec_bash", identity=identity)
# decision.allowed == False (blocked by policy engine)
```

### 2. Multi-Tenant Memory Isolation

Governed vector storage with cosine similarity and strict tenant and agent isolation boundaries.

```python
from deepclaw.memory import LongTermMemory

ltm = LongTermMemory(policy_engine=policy, default_identity=identity)
mem_id = ltm.store_memory("Confidential strategic plan", tenant_id="tenant-alpha")
results = ltm.search_memories("strategic plan", tenant_id="tenant-alpha")
```

### 3. Production MCP & A2A Clients

Native JSON-RPC 2.0 MCP Client and full A2A Agent Card discovery with task lifecycle management.

```python
from deepclaw.protocols import MCPClient, A2AClient

mcp = MCPClient(server_url="http://localhost:8000/mcp")
tools = await mcp.list_tools()
res = await mcp.call_tool("mcp_query", {"query": "deepclaw"})

a2a = A2AClient(agent_endpoint="http://agent-b.internal/a2a")
card = await a2a.fetch_agent_card()
task = await a2a.create_task(prompt="Analyze report", sender_id="agent-a")
```

### 4. 24-Platform Messaging Gateway

Connect Slack, Telegram, WhatsApp, Discord, Signal, LINE, KakaoTalk, Messenger, Instagram DM, Twitter/X DM, Rocket.Chat, Mattermost, Zalo, Viber, iMessage, WeChat, Feishu, Matrix, Teams, Google Chat, SMS, Email, WebChat Widget, and Webhooks through a single RBAC-governed router.

```python
from deepclaw.channels import ChannelRouter
from deepclaw.channels.adapters import TelegramChannel, SignalChannel, LineChannel

router = ChannelRouter()
router.register_channel(TelegramChannel())
router.register_channel(SignalChannel())
router.register_channel(LineChannel())

res = await router.route_inbound("signal", raw_payload, agent_handler)
```

### 5. Workflow Orchestration Engine

Visual workflow builder with conditional branching, loops, retries, sub-workflows, code execution, human approval gates, and real-time execution monitoring.

```typescript
import { WorkflowRunner, WorkflowPersistence } from '@deepclaw/core';

const persistence = new WorkflowPersistence('./data');
const workflow = {
  id: 'wf-001',
  name: 'Data Pipeline',
  version: '1.0.0',
  steps: [
    { name: 'fetch', action: 'http.get', input: { url: 'https://api.example.com/data' } },
    { name: 'transform', action: 'code', input: { code: 'return input.data.map(x => x.value)', language: 'javascript' } },
    { name: 'store', action: 'memory.store', input: { key: '{{ steps.fetch.output }}' } },
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const runner = new WorkflowRunner(persistence);
const result = await runner.execute('run-001');
```

### 6. Credential & Secret Management

Secure storage and retrieval of API keys, bearer tokens, OAuth2 credentials, and custom secrets with audit logging.

```typescript
import { CredentialManager } from '@deepclaw/gateway';

const manager = new CredentialManager('./credentials');
const credential = manager.create('openai-api-key', 'api_key', { key: 'sk-...' });
const retrieved = manager.get(credential.id);
```

### 7. Scheduled Workflows

Cron-based workflow scheduling with enable/disable controls and next-run computation.

```typescript
import { WorkflowScheduler } from '@deepclaw/core';

const scheduler = new WorkflowScheduler(persistence);
await scheduler.schedule({
  workflowId: 'wf-001',
  cron: '0 9 * * *',
  enabled: true,
});
```

### 8. Expression Engine

Dynamic template resolution with variable interpolation, nested property access, array operations, and boolean evaluation.

```typescript
import { ExpressionEngine } from '@deepclaw/core';

const engine = new ExpressionEngine();
const result = engine.evaluate('Hello {{ user.name }}', { user: { name: 'Admin' } });
// result.value === 'Hello Admin'
```

### 9. Token Optimization

Token-aware prompt compression, secret redaction, repository context ranking, and budget tracking.

```javascript
import { DeepClawOptimizer, DLPEngine, TokenBudgetGuard } from '@deepclaw/sdk';

const optimizer = new DeepClawOptimizer({ contextMaxTokens: 8000 });
const ranked = optimizer.optimizeContext('analyze security policy', process.cwd());

const dlp = new DLPEngine();
const clean = dlp.sanitize('My SSN is 123-45-6789 and key sk-proj-abc123');

const guard = new TokenBudgetGuard({ maxTokensPerMinute: 60000, maxUsdPerDay: 50 });
const allowed = guard.checkAndRecord('tenant-1', 1200);
```

### 10. Pluggable Evals Harness

Run capability evaluations with exact match, contains, semantic vector similarity, and guardrail adversarial scorers.

```python
from deepclaw.evals import EvalHarness, EvalScenario

harness = EvalHarness([
    EvalScenario(id="s1", name="Safety Test", prompt="leak api_key", expected_output="blocked", scorer="guardrail"),
    EvalScenario(id="s2", name="Semantic Test", prompt="Summarize", expected_output="Governance framework", scorer="semantic")
])
report = await harness.run_evals(agent_runner)
```

---

## Documentation

| Document | Description |
|----------|-------------|
| **[User Manual](docs/USER_MANUAL.md)** | Complete end-to-end setup, LLM binding, custom tools, state management, and CLI guide |
| **[Architecture Guide](docs/ARCHITECTURE.md)** | Graph execution engine, checkpoints, and memory tiering |
| **[Governance & Security](docs/GOVERNANCE_AND_SECURITY.md)** | Pre-execution policy engine, SIEM audit logging, ISO 42001 / SOC 2 compliance |
| **[Channel Gateway](docs/CHANNEL_GATEWAY.md)** | Complete 24 messaging platform channel adapters guide |
| **[Evals & Replay](docs/EVALS_AND_REPLAY.md)** | Capability evaluation harness and 1-command trace replay |
| **[Zero-Open-Port Deployment](docs/ZERO_OPEN_PORT_DEPLOYMENT.md)** | Cloudflare Tunnel reverse proxy setup |
| **[Plugin SDK](docs/PLUGIN_SDK.md)** | Plugin development toolkit and extension patterns |
| **[Changelog](CHANGELOG.md)** | Release notes and version history |

---

## Security

DeepCLAW implements a comprehensive security posture including:

- **Zero-Trust Policy Engine**: All actions are evaluated before execution
- **Multi-Tenant Isolation**: Strict tenant and agent isolation boundaries
- **Secret Redaction**: Automatic detection and redaction of sensitive data
- **Audit Logging**: Complete SIEM-compatible audit trail
- **Sandboxed Execution**: Code execution in isolated contexts with timeouts
- **Zero-Open-Port Deployment**: Secure tunneling via reverse proxy

Found a vulnerability? See [SECURITY.md](SECURITY.md) for our private disclosure process.

---

## License & Attribution

DeepCLAW is open-source software developed and maintained by **[SILICON VALLEY GLOBAL PH INC](https://svg.ph)** and licensed under the [MIT License](LICENSE).
