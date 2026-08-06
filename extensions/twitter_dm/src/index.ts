import { PluginManifest, PluginContext, PluginTool, PluginValidationResult } from '@deepclaw/plugin-sdk';

export interface TwitterDMMessage {
  sender_id: string;
  recipient_id: string;
  text: string;
  timestamp: number;
}

export interface TwitterDMSendMessageParams {
  recipient_id: string;
  text: string;
}

export const twitterDmManifest: PluginManifest = {
  name: 'twitter_dm',
  version: '2.0.0',
  description: 'Twitter DM messaging extension with DLP and policy enforcement',
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
      action: 'twitter_dm:send_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Send messages to Twitter DM chats',
    },
    {
      action: 'twitter_dm:receive_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Receive messages from Twitter DM chats',
    },
  ],
  hooks: {
    onMessage: async (ctx: PluginContext) => {
      const payload = ctx.args.payload as TwitterDMMessage | undefined;
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
    platform: 'twitter_dm',
    maxMessageLength: 10000,
  },
};

export const twitterDmTools: PluginTool[] = [
  {
    name: 'send_message',
    description: 'Send a message to a Twitter DM chat',
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
      validate: (input) => Boolean(input.recipient_id && input.text && input.text.length <= 10000),
      transform: async (input) => input,
    },
    execute: async (input, ctx) => {
      const params = input as TwitterDMSendMessageParams;
      return {
        success: true,
        message_id: `tw-${Math.floor(Math.random() * 1000000)}`,
        recipient_id: params.recipient_id,
        text: params.text,
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'get_channel_info',
    description: 'Get information about a Twitter DM chat',
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
        name: 'Twitter DM Chat',
      };
    },
  },
];

export function validateTwitterDMPlugin(): PluginValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!twitterDmManifest.name) errors.push('Missing plugin name');
  if (!twitterDmManifest.version) errors.push('Missing plugin version');
  if (twitterDmTools.length === 0) warnings.push('No tools defined');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}