# DeepClaw User Manual & Operations Guide 📖

Welcome to the **DeepClaw User Manual**. This guide provides complete end-to-end instructions for installing, configuring, operating, and extending governed AI agent workflows with DeepClaw.

---

## 📑 Table of Contents

1. [Installation & Setup](#1-installation--setup)
2. [Quickstart: Creating Your First Governed Agent](#2-quickstart-creating-your-first-governed-agent)
3. [Configuring LLM Providers](#3-configuring-llm-providers)
4. [Defining Custom Tools & Guardrails](#4-defining-custom-tools--guardrails)
5. [Setting Up Channel Gateways](#5-setting-up-channel-gateways)
6. [Managing State & Checkpoint Persistence](#6-managing-state--checkpoint-persistence)
7. [Running Evaluations & Production Replays](#7-running-evaluations--production-replays)
8. [SIEM Logging & Compliance Reporting](#8-siem-logging--compliance-reporting)
9. [CLI Command Reference](#9-cli-command-reference)

---

## 1. Installation & Setup

### Python Package (Primary Engine)

```bash
# Clone the repository
git clone https://github.com/siliconvalleyglobal/DeepCLAW.git
cd DeepCLAW

# Initialize Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install DeepClaw in editable mode
pip install -e .
```

### Node.js / TypeScript SDK

```bash
npm install @svgph/deepclaw
# or
bun add @svgph/deepclaw
```

---

## 2. Quickstart: Creating Your First Governed Agent

```python
import asyncio
from deepclaw.agents import GovernedAssistant

async def main():
    # 1. Initialize agent with Zero-Trust pre-execution policy engine
    agent = GovernedAssistant(name="OperationsAgent")

    # 2. Execute a governed tool action
    result = await agent.execute_tool_safely(
        tool_name="read",
        arguments={"path": "/workspace/reports/Q3.pdf"}
    )
    print("Execution Result:", result)

    # 3. Export SIEM Audit Log
    print("\nSIEM Audit Log:")
    print(agent.audit_logger.export_siem_json())

if __name__ == "__main__":
    asyncio.run(main())
```

---

## 3. Configuring LLM Providers

DeepClaw uses LiteLLM bindings to support provider-agnostic model calls. Set environment variables for your preferred provider:

```bash
# OpenAI
export OPENAI_API_KEY="sk-..."

# Anthropic Claude
export ANTHROPIC_API_KEY="sk-ant-..."

# Google Gemini
export GEMINI_API_KEY="AIza..."

# Local Ollama / vLLM
export OPENAI_API_BASE="http://localhost:11434/v1"
```

In Python:
```python
from deepclaw.llm import LiteLLMAdapter, ModelFallbackChain

# Direct model call
llm = LiteLLMAdapter(model_name="gpt-4o")

# Fallback chain: Primary model -> Backup model
chain = ModelFallbackChain(models=["gpt-4o", "claude-3-5-sonnet-20241022"])
response = await chain.complete(prompt="Summarize incident report")
```

---

## 4. Defining Custom Tools & Guardrails

```python
from deepclaw.tools import ToolSchema, PreExecutionGuardrails

# 1. Define typed tool schema
search_tool = ToolSchema(
    name="db_search",
    description="Search internal database",
    parameters={
        "type": "object",
        "properties": {
            "query": {"type": "string"}
        },
        "required": ["query"]
    }
)

# 2. Pre-execution guardrails validation
guard = PreExecutionGuardrails()
valid, error = guard.validate_input(search_tool, {"query": "SELECT * FROM users"})
assert valid is True
```

---

## 5. Setting Up Channel Gateways

Route inbound messages from chat platforms (Telegram, WhatsApp, Slack, Discord, Feishu, Teams, Webhooks) through defined RBAC permission ceilings:

```python
from deepclaw.channels import ChannelRouter
from deepclaw.channels.adapters import TelegramChannel, WhatsAppChannel, CustomWebhookChannel

router = ChannelRouter()

# Register adapters
router.register_channel(TelegramChannel(bot_token="TG_BOT_TOKEN"))
router.register_channel(WhatsAppChannel(api_key="WA_API_KEY"))
router.register_channel(CustomWebhookChannel())

# Inbound message handler
async def handle_message(msg, identity):
    print(f"Message from {identity.channel_origin}: {msg.content}")
    return f"Processed: {msg.content}"

# Route inbound webhook payload
res = await router.route_inbound("telegram", raw_telegram_payload, handle_message)
```

---

## 6. Managing State & Checkpoint Persistence

Save and restore execution graph states across process restarts or long human approval pauses:

```python
from deepclaw.core import DurableCheckpointStore, Checkpoint

# Store checkpoints in SQLite/Postgres
store = DurableCheckpointStore(db_path="deepclaw_checkpoints.db")

# Save state checkpoint
cp = Checkpoint(node_id="approval_wait_node", data={"task_id": 101}, paused=True)
store.save_checkpoint(cp)

# Restore state checkpoint
restored_cp = store.load_checkpoint(cp.id)
print("Restored Node:", restored_cp.node_id)
```

---

## 7. Running Evaluations & Production Replays

Convert live production trace logs into permanent evaluation scenarios with 1 command:

```python
from deepclaw.evals import TraceReplayEngine, EvalHarness

# Convert production trace
prod_trace = {"trace_id": "t-1", "prompt": "Check status", "output": "Status OK"}
scenario = TraceReplayEngine.trace_to_eval_scenario(prod_trace)

# Run capability evaluation
harness = EvalHarness([scenario])
report = await harness.run_evals(agent_runner_function)
print("Eval Pass Rate:", report["average_score"])
```

---

## 8. SIEM Logging & Compliance Reporting

Generate audit readiness evidence reports mapped directly to ISO/IEC 42001 & SOC 2 Trust Criteria:

```python
from deepclaw.governance import ComplianceReportGenerator

report_gen = ComplianceReportGenerator(agent.audit_logger)
markdown_report = report_gen.export_markdown_report()
print(markdown_report)
```

---

## 9. CLI Command Reference

DeepClaw provides interactive command-line entry points:

| Command | Action | Description |
|:---|:---|:---|
| `deepclaw chat` | Governed Terminal | Start an interactive terminal chat session with a governed agent |
| `deepclaw eval` | Run Scenarios | Execute capability evaluation & regression scenarios |
| `deepclaw report` | Compliance Audit | Generate ISO 42001 & SOC 2 audit readiness evidence reports |

```bash
# Example CLI invocations
deepclaw chat
deepclaw eval
deepclaw report
```
