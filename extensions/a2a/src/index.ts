import { PluginManifest, PluginContext, PluginTool, PluginValidationResult } from '../../../src/plugin-sdk/index.js';

export interface A2ATask {
  taskId: string;
  agentId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export const a2aManifest: PluginManifest = {
  name: 'a2a',
  version: '2.0.0',
  description: 'Agent-to-Agent protocol extension with policy enforcement',
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
      action: 'a2a:delegate',
      resources: ['*'],
      effect: 'allow',
      description: 'Delegate tasks to other agents',
    },
    {
      action: 'a2a:receive',
      resources: ['*'],
      effect: 'allow',
      description: 'Receive delegated tasks',
    },
  ],
  hooks: {
    onToolCall: async (ctx: PluginContext) => {
      const toolName = ctx.args.toolName as string | undefined;
      if (!toolName) return true;
      if (toolName.includes('delete') || toolName.includes('exec')) {
        ctx.metadata.policyNote = 'Restricted A2A tool requires elevated permissions';
        return false;
      }
      return true;
    },
  },
  metadata: {
    protocol: 'a2a',
    version: '1.0',
  },
};

export const a2aTools: PluginTool[] = [
  {
    name: 'delegate_task',
    description: 'Delegate a task to another agent',
    contract: {
      name: 'delegate_task',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          agentId: { type: 'string' },
          task: { type: 'object' },
          context: { type: 'object' },
        },
        required: ['agentId', 'task'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          taskId: { type: 'string' },
          status: { type: 'string' },
        },
      },
      validate: (input) => Boolean(input.agentId && input.task),
      transform: async (input) => input,
    },
    execute: async (input) => {
      const params = input as { agentId: string; task: Record<string, unknown>; context?: Record<string, unknown> };
      return {
        success: true,
        taskId: `task-${Date.now()}`,
        agentId: params.agentId,
        status: 'dispatched',
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'get_task_status',
    description: 'Get the status of a delegated task',
    contract: {
      name: 'get_task_status',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          taskId: { type: 'string' },
        },
        required: ['taskId'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          taskId: { type: 'string' },
          status: { type: 'string' },
        },
      },
      validate: (input) => Boolean(input.taskId),
      transform: async (input) => input,
    },
    execute: async (input) => {
      const params = input as { taskId: string };
      return {
        taskId: params.taskId,
        status: 'completed',
        timestamp: Date.now(),
      };
    },
  },
];

export function validateA2APlugin(): PluginValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!a2aManifest.name) errors.push('Missing plugin name');
  if (!a2aManifest.version) errors.push('Missing plugin version');
  if (a2aTools.length === 0) warnings.push('No tools defined');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
