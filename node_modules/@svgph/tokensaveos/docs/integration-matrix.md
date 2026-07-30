# TokenSaveOS Integration Feasibility Matrix

| Tool | Interception point today | What TokenSaveOS can actually do | ToS risk |
|---|---|---|---|
| **Claude Code** | Hooks + MCP servers (sanctioned) | Full: context trim, caching, memory injection, model routing via hook | Low — using documented extension points |
| **VS Code AI Agent Extensions** | MCP-capable, varies by extension | Full where MCP is supported; otherwise none | Low |
| **Cursor** | No public interception API | None as a proxy. Offer as: (a) a pre-flight CLI step the developer runs manually before pasting into Cursor, or (b) TokenSaveOS as a standalone agent alternative | Avoid silent traffic interception — don't attempt it |
| **OpenAI Codex (CLI/agent)** | Depends on version; check current docs before building | Same fallback pattern as Cursor until confirmed otherwise | Check ToS before any interception attempt |
| **Direct API use** (custom scripts, MCP servers) | Full — it's your code | Full: caching, routing, memory, everything | None |

## Architectural Tiers
- **Tier A — Deep Integration (Hooks & MCP)**: Claude Code, MCP-compatible tools, VS Code AI agent extensions.
- **Tier B — Standalone Agent Runtime (`tokensave run`)**: Cursor, Codex, Antigravity — TokenSaveOS acts as an agent runtime directly invoked by the user rather than covertly intercepting closed IDE traffic.
