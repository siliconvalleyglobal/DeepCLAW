import { PluginManifest, PluginContext, PluginTool, PluginValidationResult } from '../../../src/plugin-sdk/index.js';

export interface ZaloMessage {
  sender_id: string;
  recipient_id: string;
  text: string;
  timestamp: number;
}

export interface ZaloSendMessageParams {
  user_id: string;
  text: string;
}

export const zaloManifest: PluginManifest = {
  name: 'zalo',
  version: '2.0.0',
  description: 'Zalo messaging extension with DLP and policy enforcement',
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
      action: 'zalo:send_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Send messages to Zalo chats',
    },
    {
      action: 'zalo:receive_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Receive messages from Zalo chats',
    },
  ],
  hooks: {
    onMessage: async (ctx: PluginContext) => {
      const payload = ctx.args.payload as ZaloMessage | undefined;
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
    platform: 'zalo',
    maxMessageLength: 10000,
  },
};

export const zaloTools: PluginTool[] = [
  {
    name: 'send_message',
    description: 'Send a message to a Zalo chat',
    contract: {
      name: 'send_message',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          user_id: { type: 'string' },
          text: { type: 'string' },
        },
        required: ['user_id', 'text'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message_id: { type: 'string' },
        },
      },
      validate: (input) => Boolean(input.user_id && input.text && input.text.length <= 10000),
      transform: async (input) => input,
    },
    execute: async (input, ctx) => {
      const params = input as ZaloSendMessageParams;
      return {
        success: true,
        message_id: `za-${Math.floor(Math.random() * 1000000)}`,
        user_id: params.user_id,
        text: params.text,
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'get_channel_info',
    description: 'Get information about a Zalo chat',
    contract: {
      name: 'get_channel_info',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          user_id: { type: 'string' },
        },
        required: ['user_id'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
      validate: (input) => Boolean(input.user_id),
      transform: async (input) => input,
    },
    execute: async (input) => {
      const params = input as { user_id: string };
      return {
        id: params.user_id,
        name: 'Zalo Chat',
      };
    },
  },
];

export function validateZaloPlugin(): PluginValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!zaloManifest.name) errors.push('Missing plugin name');
  if (!zaloManifest.version) errors.push('Missing plugin version');
  if (zaloTools.length === 0) warnings.push('No tools defined');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}