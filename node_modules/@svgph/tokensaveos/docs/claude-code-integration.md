# Claude Code Integration Guide (Tier A)

TokenSaveOS integrates directly into Claude Code via sanctioned MCP tools and hooks.

## 1. Setting up MCP Server in Claude Code

Add the following to your `~/.claude.json` or `claude.config.json`:

```json
{
  "mcpServers": {
    "tokensaveos": {
      "command": "npx",
      "args": ["-y", "@svgph/tokensaveos", "mcp"]
    }
  }
}
```

## 2. Setting up Pre-Flight Prompt Hook

In your repository `.claude/hooks/prune-context.sh`:

```bash
#!/bin/bash
# TokenSaveOS Pre-flight Prompt Hook for Claude Code
node ./hooks/claude-code-hook.js "$@"
```

Ensure hook permissions: `chmod +x .claude/hooks/prune-context.sh`.
