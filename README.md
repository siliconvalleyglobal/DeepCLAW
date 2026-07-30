# DeepCLAW 🦅

### *An Enterprise Agentic AI Security, Governance & Multi-Platform Orchestration Framework*
***A Project by [SILICON VALLEY GLOBAL PH INC](https://svg.ph)***

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/@svgph/deepclaw.svg)](https://www.npmjs.com/package/@svgph/deepclaw)
[![Company Website](https://img.shields.io/badge/Website-svg.ph-brightgreen.svg)](https://svg.ph)
[![Python Version](https://img.shields.io/badge/Python-3.12%2B-blue.svg)](pyproject.toml)
[![Build Status](https://img.shields.io/badge/Pytest-27%20Passing-success.svg)](deepclaw/tests/)

DeepCLAW is a production-grade security, policy-governance, multi-tenant memory, and orchestration platform built for agentic AI applications. Created and maintained by **[SILICON VALLEY GLOBAL PH INC](https://svg.ph)**.

---

## 🌟 Key Architecture Pillars

1. **Pre-Execution Policy Engine (`deepclaw/governance/policy.py`)**:
   - Zero-Trust action evaluation (`TOOL_CALL`, `MEMORY_WRITE`, `MEMORY_READ`, `CHANNEL_SEND`, `STATE_MUTATION`) with RBAC & SIEM Audit logging.
2. **Multi-Tenant Memory Isolation (`deepclaw/memory/long_term.py`)**:
   - Governed multi-tenant vector storage with cosine similarity and strict `tenant_id` / `agent_id` boundaries.
3. **Protocol Clients (`deepclaw/protocols/`)**:
   - Production JSON-RPC 2.0 MCP Client (`mcp_client.py`) & A2A Task Lifecycle State Machine (`a2a_client.py`).
4. **24 Messaging Channel Matrix (`deepclaw/channels/adapters/`)**:
   - Direct integration matrix supporting Telegram, WhatsApp, Slack, Discord, Signal, LINE, KakaoTalk, Meta Messenger, Instagram DM, Twitter/X DM, Rocket.Chat, Mattermost, Zalo, Viber, iMessage, WeChat, Feishu, Matrix, Teams, Google Chat, SMS, Email, WebChat, Webhooks.
5. **Pluggable Evals Harness (`deepclaw/evals/`)**:
   - Production Scorer Registry (`ExactMatchScorer`, `ContainsMatchScorer`, `SemanticSimilarityScorer`, `GuardrailAdversarialScorer`).

---

## 💻 Quickstart

```bash
# Install Python package
pip install deepclaw

# Or install TypeScript bindings via npm
npm install @svgph/deepclaw
```

---

## 📄 License

DeepCLAW is open-source software developed by **[SILICON VALLEY GLOBAL PH INC](https://svg.ph)** and licensed under the [MIT License](LICENSE).
