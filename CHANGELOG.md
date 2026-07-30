# Changelog

All notable changes to the **DeepClaw** enterprise-governance-first AI agent framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
