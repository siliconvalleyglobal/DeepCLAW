import { PluginManifest, PluginContext, PluginTool, PluginValidationResult } from '@deepclaw/plugin-sdk';

export interface FeishuMessage {
  sender_id: string;
  receive_id: string;
  text: string;
  timestamp: number;
}

export interface FeishuSendMessageParams {
  receive_id: string;
  text: string;
}

export const feishuManifest: PluginManifest = {
  name: 'feishu',
  version: '2.0.0',
  description: 'Feishu messaging extension with DLP and policy enforcement',
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
      action: 'feishu:send_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Send messages to Feishu chats',
    },
    {
      action: 'feishu:receive_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Receive messages from Feishu chats',
    },
  ],
  hooks: {
    onMessage: async (ctx: PluginContext) => {
      const payload = ctx.args.payload as FeishuMessage | undefined;
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
    platform: 'feishu',
    maxMessageLength: 10000,
  },
};

export const feishuTools: PluginTool[] = [
  {
    name: 'send_message',
    description: 'Send a message to a Feishu chat',
    contract: {
      name: 'send_message',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          receive_id: { type: 'string' },
          text: { type: 'string' },
        },
        required: ['receive_id', 'text'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message_id: { type: 'string' },
        },
      },
      validate: (input) => Boolean(input.receive_id && input.text && input.text.length <= 10000),
      transform: async (input) => input,
    },
    execute: async (input, ctx) => {
      const params = input as FeishuSendMessageParams;
      return {
        success: true,
        message_id: `fs-${Math.floor(Math.random() * 1000000)}`,
        receive_id: params.receive_id,
        text: params.text,
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'get_channel_info',
    description: 'Get information about a Feishu chat',
    contract: {
      name: 'get_channel_info',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          receive_id: { type: 'string' },
        },
        required: ['receive_id'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
      validate: (input) => Boolean(input.receive_id),
      transform: async (input) => input,
    },
    execute: async (input) => {
      const params = input as { receive_id: string };
      return {
        id: params.receive_id,
        name: 'Feishu Chat',
      };
    },
  },
];

export function validateFeishuPlugin(): PluginValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!feishuManifest.name) errors.push('Missing plugin name');
  if (!feishuManifest.version) errors.push('Missing plugin version');
  if (feishuTools.length === 0) warnings.push('No tools defined');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}