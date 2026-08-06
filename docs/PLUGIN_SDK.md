# DeepCLAW Plugin SDK Documentation

Build extensions for DeepCLAW that add new channels, tools, protocols, and governance hooks.

## Installation

```bash
npm install @deepclaw/plugin-sdk
```

## Extension Structure

Every extension is a TypeScript package with this layout:

```
extensions/my-extension/
├── package.json
├── tsdown.config.ts
└── src/
    └── index.ts
```

### package.json

```json
{
  "name": "@deepclaw/extension-my-extension",
  "version": "2.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./package.json": "./package.json"
  },
  "dependencies": {
    "@deepclaw/core": "workspace:*",
    "@deepclaw/plugin-sdk": "workspace:*"
  }
}
```

### tsdown.config.ts

```ts
import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    entry: 'src/index.ts',
    platform: 'node',
    format: 'esm',
    outDir: 'dist',
    dts: true,
    clean: true,
  },
  {
    entry: 'src/index.ts',
    platform: 'node',
    format: 'cjs',
    outDir: 'dist',
    dts: true,
  },
]);
```

## Core Interfaces

### PluginManifest

Every extension must export a `PluginManifest`:

```ts
export const myManifest: PluginManifest = {
  name: 'my-extension',          // unique identifier
  version: '2.0.0',              // semver
  description: '...',            // what it does
  author: 'Your Name',
  license: 'MIT',
  main: 'index.js',              // entry point relative to package root
  capabilities: {
    channels: true,    // can send/receive messages
    tools: true,       // exposes executable tools
    protocols: true,   // implements a protocol (MCP, A2A)
    governance: true,  // has policy hooks
  },
  permissions: [
    {
      action: 'my-ext:send_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Send messages via my extension',
    },
  ],
  hooks: {
    onMessage: async (ctx: PluginContext) => { /* DLP, validation */ },
    onToolCall: async (ctx: PluginContext) => { /* policy gate */ },
  },
  metadata: {
    platform: 'my-platform',
    // extension-specific config
  },
};
```

### PluginTool

Tools are actions the extension exposes:

```ts
export const myTools: PluginTool[] = [
  {
    name: 'send_message',
    description: 'Send a message to the platform',
    contract: {
      name: 'send_message',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          channel_id: { type: 'string' },
          text: { type: 'string' },
        },
        required: ['channel_id', 'text'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message_id: { type: 'string' },
        },
      },
      validate: (input) => Boolean(input.channel_id && input.text),
      transform: async (input) => input,
    },
    execute: async (input, ctx) => {
      // actual implementation
      return { success: true, message_id: '123' };
    },
  },
];
```

### PluginHooks

Hooks let extensions intercept and govern events:

- `onMessage(ctx)` — called when a message is received. Use for DLP/redaction. Mutate `ctx.metadata` to pass data downstream.
- `onToolCall(ctx)` — called before a tool executes. Return `false` to block execution.
- `onError(ctx)` — called when a tool throws.
- `onInstall()` / `onActivate()` / `onDeactivate()` — lifecycle hooks.

### PluginContext

Every hook and tool receives context:

```ts
interface PluginContext {
  pluginName: string;      // your extension name
  agentId: string;         // calling agent
  tenantId: string;        // tenant scope
  action: string;          // action being performed
  args: Record<string, unknown>;  // input payload
  metadata: Record<string, unknown>; // mutable scratch space
}
```

## Validation

Export a validation function for CI/testing:

```ts
export function validateMyPlugin(): PluginValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!myManifest.name) errors.push('Missing plugin name');
  if (myTools.length === 0) warnings.push('No tools defined');

  return { valid: errors.length === 0, errors, warnings };
}
```

## Built-in Extensions

| Extension | Package | Description |
|-----------|---------|-------------|
| Telegram | `@deepclaw/extension-telegram` | Telegram messaging with DLP |
| Discord | `@deepclaw/extension-discord` | Discord messaging with DLP |
| Slack | `@deepclaw/extension-slack` | Slack messaging with DLP |
| MCP | `@deepclaw/extension-mcp` | Model Context Protocol proxy |
| Webhook | `@deepclaw/extension-webhook` | Generic REST webhook connector |

## Example: Minimal Extension

```ts
// src/index.ts
import { PluginManifest, PluginTool, PluginValidationResult } from '@deepclaw/plugin-sdk';

export const manifest: PluginManifest = {
  name: 'hello',
  version: '1.0.0',
  description: 'A minimal example extension',
  author: 'You',
  license: 'MIT',
  main: 'index.js',
  capabilities: { tools: true },
  permissions: [
    { action: 'hello:greet', resources: ['*'], effect: 'allow' }
  ],
  hooks: {},
};

export const tools: PluginTool[] = [
  {
    name: 'greet',
    description: 'Return a greeting',
    contract: {
      name: 'greet',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
      },
      outputSchema: {
        type: 'object',
        properties: { message: { type: 'string' } },
      },
      validate: (input) => Boolean(input.name),
      transform: async (input) => input,
    },
    execute: async (input) => ({
      success: true,
      message: `Hello, ${input.name}!`,
    }),
  },
];

export function validate(): PluginValidationResult {
  return { valid: true, errors: [], warnings: [] };
}
```

## Publishing

1. Build: `pnpm build`
2. Test: `pnpm test`
3. Publish: `npm publish --access public`

## Community Extensions

To share your extension with the DeepCLAW community:

1. Follow the structure above
2. Include tests in `tests/`
3. Submit a PR to the DeepCLAW repo under `extensions/your-name/`
4. Ensure CI passes (lint, typecheck, test)
