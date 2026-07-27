# DeepClaw Architecture Guide 🏛️

DeepClaw is designed around stateful cyclic execution graphs, Zero-Trust governance, provider-agnostic LLM bindings, and pluggable memory tiering.

---

## 🏗️ Core Layers & Component Map

```
               ┌─────────────────────────────────────────┐
               │    Inbound Gateway / 14+ Channels       │
               └────────────────────┬────────────────────┘
                                    │
                                    ▼
               ┌─────────────────────────────────────────┐
               │  Zero-Trust Pre-Execution Policy Engine  │
               └────────────────────┬────────────────────┘
                                    │ (PERMIT / DENY)
                                    ▼
               ┌─────────────────────────────────────────┐
               │     Stateful Cyclic Graph Engine        │
               │  (Nodes, Edges, Checkpoints, Retries)   │
               └────────────────────┬────────────────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           ▼                        ▼                        ▼
┌────────────────────┐    ┌────────────────────┐    ┌────────────────────┐
│   LiteLLM Adapt    │    │  Memory Tiering    │    │  SIEM Audit Trail  │
│  Fallback Chains   │    │ Short vs Long Term │    │ OTel / ISO 42001   │
└────────────────────┘    └────────────────────┘    └────────────────────┘
```

---

## 1. Stateful Cyclic Graph Engine (`deepclaw/core/graph.py`)

Workflows are modeled as directed graphs comprising:
- **Nodes**: Async execution functions handling agent reasoning, tool invocation, or state mutation.
- **Edges**: Deterministic or conditional state transitions between nodes.
- **Checkpoints**: State snapshots stored via `DurableCheckpointStore` for process pause/resume support.
- **Cycle Limits**: Protection bounds preventing runaway execution loops.

---

## 2. Memory Tiering (`deepclaw/memory/`)

DeepClaw partitions memory into two dedicated tiers:
- **Short-Term Context Buffer (`short_term.py`)**: Bounded sliding window for active conversation turns.
- **Long-Term Semantic Store (`long_term.py`)**: Vector-backed persistent store for semantic knowledge retrieval across sessions.
