import { PluginManifest, PluginContext, PluginTool, PluginValidationResult } from '../../../src/plugin-sdk/index.js';

export interface MatrixMessage {
  room_id: string;
  text: string;
  user: string;
  timestamp: number;
}

export interface MatrixSendMessageParams {
  room_id: string;
  text: string;
}

export const matrixManifest: PluginManifest = {
  name: 'matrix',
  version: '2.0.0',
  description: 'Matrix messaging extension with DLP and policy enforcement',
  author: 'DeepCLAW',
  license: 'MIT',
  main: 'index.js',
  capabilities: {
    channels: true,
    governance: true,
    tools: true,
  },
  permissions: [
    {
      action: 'matrix:send_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Send messages to Matrix rooms',
    },
    {
      action: 'matrix:receive_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Receive messages from Matrix rooms',
    },
  ],
  hooks: {
    onMessage: async (ctx: PluginContext) => {
      const payload = ctx.args.payload as MatrixMessage | undefined;
      if (!payload?.text) return;

      const sensitivePatterns = [
        /\b\d{3}-\d{2}-\d{4}\b/g,
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        /(?:sk-proj-|sk-ant-|gsk_)[a-zA-Z0-9_-]{20,}/g,
      ];

      let sanitized = payload.text;
      let redacted = false;
      for (const pattern of sensitivePatterns) {
        if (pattern.test(sanitized)) {
          sanitized = sanitized.replace(pattern, '[REDACTED]');
          redacted = true;
        }
      }

      if (redacted) {
        ctx.metadata.redacted = true;
        ctx.metadata.originalLength = payload.text.length;
        ctx.metadata.sanitizedLength = sanitized.length;
      }
    },
  },
  metadata: {
    platform: 'matrix',
    maxMessageLength: 65536,
  },
};

export const matrixTools: PluginTool[] = [
  {
    name: 'send_message',
    description: 'Send a message to a Matrix room',
    contract: {
      name: 'send_message',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          room_id: { type: 'string' },
          text: { type: 'string' },
        },
        required: ['room_id', 'text'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message_id: { type: 'string' },
        },
      },
      validate: (input) => Boolean(input.room_id && input.text && input.text.length <= 65536),
      transform: async (input) => input,
    },
    execute: async (input, ctx) => {
      const params = input as MatrixSendMessageParams;
      return {
        success: true,
        message_id: `mx-${Math.floor(Math.random() * 1000000)}`,
        room_id: params.room_id,
        text: params.text,
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'get_channel_info',
    description: 'Get information about a Matrix room',
    contract: {
      name: 'get_channel_info',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          room_id: { type: 'string' },
        },
        required: ['room_id'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
      validate: (input) => Boolean(input.room_id),
      transform: async (input) => input,
    },
    execute: async (input) => {
      const params = input as { room_id: string };
      return {
        id: params.room_id,
        name: 'Matrix Room',
      };
    },
  },
];

export function validateMatrixPlugin(): PluginValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!matrixManifest.name) errors.push('Missing plugin name');
  if (!matrixManifest.version) errors.push('Missing plugin version');
  if (matrixTools.length === 0) warnings.push('No tools defined');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}