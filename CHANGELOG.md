# Changelog

All notable changes to the **DeepCLAW** enterprise-governance-first AI agent framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.2.0] - 2026-08-14

### 🧑‍💼 Human-in-the-Loop (HITL) Interactive Approval Engine

- **Workflow Approval Checkpoints**: Native support for `waiting_approval` status in workflow steps and runs with approval configurations (timeout policies, custom messages, required RBAC roles).
- **Interactive Approval Resumption**: Programmatic and API-driven resolution of pending approvals (`resolveApproval`) allowing seamless unpausing or structured failure upon rejection.
- **REST Approval Endpoints**:
  - `GET /api/v1/approvals/pending` - List all active execution approval checkpoints across workflows.
  - `POST /api/v1/approvals/:runId/:stepId/resolve` - Submit human approval decisions with approver identity and audit comments.
- **WebSocket Real-Time Broadcasts**: Instant event propagation of approval requests and resolution events to connected monitoring clients and dashboards.
- **Python Governance HumanCheckpointNode Upgrade**: Integrated timeout limits, automated timeout policies (`approve`/`reject`), and structured audit metadata into the Python execution graph.

---

## [2.0.0] - 2026-08-07

### 🎯 Workflow Orchestration Engine

- **Visual Workflow Builder**: New Lit-based UI component for drag-and-drop workflow creation with conditional branching, loops, retries, and sub-workflow support
- **Expression Engine**: Dynamic template resolution with variable interpolation, nested property access, array operations, and boolean evaluation
- **Sandboxed Code Execution**: Secure JavaScript execution in isolated VM contexts with configurable timeouts and resource limits
- **Workflow Templates**: Built-in workflow templates for common patterns (data pipeline, approval flow, notification chain)
- **Import/Export**: Full workflow portability with JSON-based import and export capabilities

### 🔐 Credential Management

- **Secure Credential Storage**: Encrypted storage for API keys, bearer tokens, OAuth2 credentials, and custom secrets
- **Credential API**: RESTful endpoints for CRUD operations on credentials with audit logging
- **Type-Safe Access**: Programmatic credential retrieval with type validation

### ⏰ Scheduled Execution

- **Cron-Based Scheduling**: Native cron expression support for workflow scheduling
- **Schedule Management**: RESTful API and UI for managing scheduled workflows
- **Next-Run Computation**: Automatic calculation of next execution times from cron expressions
- **Enable/Disable Controls**: Toggle schedules on and off without deletion

### 🔄 Real-Time Execution Monitoring

- **WebSocket Gateway**: Production-grade WebSocket server for real-time event streaming
- **Run Subscriptions**: Subscribe to specific workflow runs for live step-by-step updates
- **Governance Dashboard Integration**: Real-time execution viewer component in the UI dashboard
- **Event Broadcasting**: Automatic broadcast of run status changes, step completions, and errors

### 🏗️ Unified Node.js/TypeScript Package

- **Single Package (`@svgph/deepclaw`)**: Consolidated `@deepclaw/core`, `@deepclaw/gateway`, `@deepclaw/sdk`, and `@deepclaw/plugin-sdk` into a single publishable npm package
- **Monorepo Deprecated**: Removed workspace-based publishing in favor of a unified distribution model
- **Vitest Test Suite**: 62+ passing tests across core, gateway, and plugin-sdk packages

### 🎨 Governance Dashboard UI

- **Lit-Based Components**: Modern web components for policy viewer, audit log, budget tracker, and workflow builder
- **Template Gallery**: Browse and instantiate pre-built workflow templates
- **Schedule Manager**: Create, view, and delete workflow schedules
- **Credential Manager**: Manage secrets and API keys through a web interface
- **Import/Export Panel**: Visual workflow portability with JSON editor
- **Real-Time Execution Viewer**: Live workflow execution monitoring via WebSocket

### 🧪 Test Coverage

- **Python Tests**: 47 passing tests for governance, memory, protocols, channels, and CLI
- **TypeScript Tests**: 62+ passing tests for core, gateway, and plugin-sdk
- **Integration Tests**: End-to-end gateway route tests for credentials, templates, schedules, and import/export
- **WebSocket Tests**: Real-time subscription and broadcast tests

---

## [0.1.3] - 2026-07-30

### 🛡️ Pre-Execution Governance & Action Security
- **Generic Action Evaluation Engine**: Extended `PreExecutionPolicyEngine` beyond tool calls to provide zero-trust pre-execution evaluation (`evaluate_action()`) for all agent actions including `MEMORY_WRITE`, `MEMORY_READ`, `CHANNEL_SEND`, and `STATE_MUTATION`.
- **Policy Decision Auditing**: Updated `PolicyDecision` model to track `action_type`, target entity, and `tenant_id` for SIEM compliance logging.
- **RBAC Policy Matrix Expansion**: Added fine-grained `memory_write`, `memory_read`, and `channel_send` role permissions across default roles (`ADMIN`, `WORKFLOW_OPERATOR`, `RESTRICTED_AGENT`, `EXTERNAL_CHANNEL`).

### 🧠 Multi-Tenant & Governed Long-Term Memory
- **Multi-Tenant Data Boundary Isolation**: Enforced strict per-tenant (`tenant_id`) and per-agent (`agent_id`) memory isolation in `LongTermMemory`, preventing cross-tenant data leaks.
- **Policy-Governed Memory Store**: Integrated pre-execution policy checks into `store_memory()` and `search_memories()`, throwing `PermissionError` when memory actions violate governance policy.
- **Vector Cosine Similarity Scoring**: Implemented bag-of-words vector cosine similarity scoring for semantic search ranking and pluggable vector DB backends.

### 🔌 Production Protocol Clients (MCP & A2A)
- **JSON-RPC 2.0 MCP Client**: Upgraded `MCPClient` from mock stubs to full Model Context Protocol (MCP) spec compliance (`initialize` handshake, `tools/list`, `tools/call`).
- **A2A Agent Card & Task Lifecycle**: Added Agent Card discovery (`fetch_agent_card`) via `/.well-known/agent-card.json` and implemented the full A2A `TaskState` state machine (`SUBMITTED`, `WORKING`, `INPUT_REQUIRED`, `COMPLETED`, `FAILED`, `CANCELLED`).
- **Resilient Dual HTTP Transport**: Added `httpx` and standard library `urllib.request` fallback transport for zero-dependency execution.

### 💬 Complete 24-Channel Connector Matrix
- **Added 10 New Channel Connectors**: Signal (`SignalChannel`), LINE (`LineChannel`), KakaoTalk (`KakaoTalkChannel`), Meta Messenger (`MessengerChannel`), Instagram DM (`InstagramDMChannel`), Twitter/X DM (`TwitterDMChannel`), Rocket.Chat (`RocketChatChannel`), Mattermost (`MattermostChannel`), Zalo (`ZaloChannel`), and Viber (`ViberChannel`).
- **24 Platform Channel Matrix Complete**: All 24 messaging channel adapters now route through RBAC permission ceilings and SIEM audit loggers.

### 📊 Pluggable Evals Harness & Adversarial Guardrail Scorers
- **Semantic Similarity Scorer**: Added `SemanticSimilarityScorer` for n-gram vector cosine text similarity evaluation.
- **Guardrail Adversarial Scorer**: Added `GuardrailAdversarialScorer` for detecting prompt injection leaks, secret disclosures, and command execution hazards.
- **Pluggable Scorer Engine**: Updated `EvalHarness` with a `ScorerRegistry` supporting `"exact"`, `"contains"`, `"semantic"`, `"guardrail"`, and custom callable scorers.

---

## [0.1.2] - 2026-07-30
- Initial npm registry publication for `@svgph/deepclaw`.

---

## [0.1.0] - 2026-07-30
- Initial release of DeepClaw core framework, graph engine, CLI, and initial messaging adapters.
