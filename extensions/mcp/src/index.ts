import { PluginManifest, PluginContext, PluginTool, PluginValidationResult, PluginContract } from '../../../src/plugin-sdk/index.js';

export interface MCPToolRequest {
  name: string;
  arguments: Record<string, unknown>;
}

export interface MCPToolResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

export const mcpManifest: PluginManifest = {
  name: 'mcp',
  version: '2.0.0',
  description: 'Model Context Protocol extension with policy enforcement',
  author: 'DeepCLAW',
  license: 'MIT',
  main: 'index.js',
  capabilities: {
    protocols: true,
    governance: true,
    tools: true,
  },
  permissions: [
    {
      action: 'mcp:tool:call',
      resources: ['*'],
      effect: 'allow',
      description: 'Call MCP tools through policy gate',
    },
    {
      action: 'mcp:resource:read',
      resources: ['*'],
      effect: 'allow',
      description: 'Read MCP resources',
    },
  ],
  hooks: {
    onToolCall: async (ctx: PluginContext) => {
      const toolName = ctx.args.toolName as string | undefined;
      if (!toolName) return false;

      const restrictedTools = ['file:delete', 'file:write', 'system:exec'];
      if (restrictedTools.some((t) => toolName.includes(t))) {
        ctx.metadata.policyNote = 'Restricted MCP tool requires elevated permissions';
        return false;
      }

      return true;
    },
  },
  metadata: {
    protocol: 'mcp',
    version: '1.0',
  },
};

export const mcpTools: PluginTool[] = [
  {
    name: 'proxy_tool_call',
    description: 'Proxy an MCP tool call through DeepCLAW policy',
    contract: {
      name: 'proxy_tool_call',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          serverUrl: { type: 'string' },
          toolName: { type: 'string' },
          arguments: { type: 'object' },
        },
        required: ['serverUrl', 'toolName'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          content: { type: 'array' },
          isError: { type: 'boolean' },
        },
      },
      validate: (input) => {
        return Boolean(input.serverUrl && input.toolName);
      },
      transform: async (input) => {
        return input;
      },
    },
    execute: async (input, ctx) => {
      const params = input as { serverUrl: string; toolName: string; arguments?: Record<string, unknown> };

      try {
        const response = await fetch(params.serverUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            method: 'tools/call',
            params: {
              name: params.toolName,
              arguments: params.arguments ?? {},
            },
          }),
        });

        const result = (await response.json()) as MCPToolResponse;
        return {
          success: true,
          toolName: params.toolName,
          result,
          timestamp: Date.now(),
        };
      } catch {
        return {
          success: false,
          toolName: params.toolName,
          error: 'MCP server unreachable',
          timestamp: Date.now(),
        };
      }
    },
  },
  {
    name: 'list_tools',
    description: 'List available MCP tools from a server',
    contract: {
      name: 'list_tools',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          serverUrl: { type: 'string' },
        },
        required: ['serverUrl'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          tools: { type: 'array' },
        },
      },
      validate: (input) => Boolean(input.serverUrl),
      transform: async (input) => input,
    },
    execute: async (input) => {
      const params = input as { serverUrl: string };

      try {
        const response = await fetch(params.serverUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            method: 'tools/list',
            params: {},
          }),
        });

        const result = await response.json();
        return {
          success: true,
          tools: result.result?.tools ?? [],
          timestamp: Date.now(),
        };
      } catch {
        return {
          success: false,
          tools: [],
          error: 'MCP server unreachable',
          timestamp: Date.now(),
        };
      }
    },
  },
];

export function validateMCPPlugin(): PluginValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!mcpManifest.name) errors.push('Missing plugin name');
  if (!mcpManifest.version) errors.push('Missing plugin version');
  if (mcpTools.length === 0) warnings.push('No tools defined');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
