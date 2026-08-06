import { PluginManifest, PluginContext, PluginTool, PluginValidationResult } from '@deepclaw/plugin-sdk';

export interface MessengerMessage {
  sender_id: string;
  recipient_id: string;
  text: string;
  timestamp: number;
}

export interface MessengerSendMessageParams {
  recipient_id: string;
  text: string;
}

export const messengerManifest: PluginManifest = {
  name: 'messenger',
  version: '2.0.0',
  description: 'Messenger messaging extension with DLP and policy enforcement',
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
      action: 'messenger:send_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Send messages to Messenger chats',
    },
    {
      action: 'messenger:receive_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Receive messages from Messenger chats',
    },
  ],
  hooks: {
    onMessage: async (ctx: PluginContext) => {
      const payload = ctx.args.payload as MessengerMessage | undefined;
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
    platform: 'messenger',
    maxMessageLength: 2000,
  },
};

export const messengerTools: PluginTool[] = [
  {
    name: 'send_message',
    description: 'Send a message to a Messenger chat',
    contract: {
      name: 'send_message',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          recipient_id: { type: 'string' },
          text: { type: 'string' },
        },
        required: ['recipient_id', 'text'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message_id: { type: 'string' },
        },
      },
      validate: (input) => Boolean(input.recipient_id && input.text && input.text.length <= 2000),
      transform: async (input) => input,
    },
    execute: async (input, ctx) => {
      const params = input as MessengerSendMessageParams;
      return {
        success: true,
        message_id: `msg-${Math.floor(Math.random() * 1000000)}`,
        recipient_id: params.recipient_id,
        text: params.text,
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'get_channel_info',
    description: 'Get information about a Messenger chat',
    contract: {
      name: 'get_channel_info',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          recipient_id: { type: 'string' },
        },
        required: ['recipient_id'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
      validate: (input) => Boolean(input.recipient_id),
      transform: async (input) => input,
    },
    execute: async (input) => {
      const params = input as { recipient_id: string };
      return {
        id: params.recipient_id,
        name: 'Messenger Chat',
      };
    },
  },
];

export function validateMessengerPlugin(): PluginValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!messengerManifest.name) errors.push('Missing plugin name');
  if (!messengerManifest.version) errors.push('Missing plugin version');
  if (messengerTools.length === 0) warnings.push('No tools defined');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}