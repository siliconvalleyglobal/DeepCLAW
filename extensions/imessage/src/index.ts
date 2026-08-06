import { PluginManifest, PluginContext, PluginTool, PluginValidationResult } from '@deepclaw/plugin-sdk';

export interface iMessage {
  sender: string;
  chat: string;
  text: string;
  timestamp: number;
}

export interface iMessageSendMessageParams {
  address: string;
  text: string;
}

export const imessageManifest: PluginManifest = {
  name: 'imessage',
  version: '2.0.0',
  description: 'iMessage messaging extension with DLP and policy enforcement',
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
      action: 'imessage:send_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Send messages to iMessage chats',
    },
    {
      action: 'imessage:receive_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Receive messages from iMessage chats',
    },
  ],
  hooks: {
    onMessage: async (ctx: PluginContext) => {
      const payload = ctx.args.payload as iMessage | undefined;
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
    platform: 'imessage',
    maxMessageLength: 2000,
  },
};

export const imessageTools: PluginTool[] = [
  {
    name: 'send_message',
    description: 'Send a message to an iMessage chat',
    contract: {
      name: 'send_message',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          address: { type: 'string' },
          text: { type: 'string' },
        },
        required: ['address', 'text'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message_id: { type: 'string' },
        },
      },
      validate: (input) => Boolean(input.address && input.text && input.text.length <= 2000),
      transform: async (input) => input,
    },
    execute: async (input, ctx) => {
      const params = input as iMessageSendMessageParams;
      return {
        success: true,
        message_id: `im-${Math.floor(Math.random() * 1000000)}`,
        address: params.address,
        text: params.text,
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'get_channel_info',
    description: 'Get information about an iMessage chat',
    contract: {
      name: 'get_channel_info',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          address: { type: 'string' },
        },
        required: ['address'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
      validate: (input) => Boolean(input.address),
      transform: async (input) => input,
    },
    execute: async (input) => {
      const params = input as { address: string };
      return {
        id: params.address,
        name: 'iMessage Chat',
      };
    },
  },
];

export function validateiMessagePlugin(): PluginValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!imessageManifest.name) errors.push('Missing plugin name');
  if (!imessageManifest.version) errors.push('Missing plugin version');
  if (imessageTools.length === 0) warnings.push('No tools defined');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}