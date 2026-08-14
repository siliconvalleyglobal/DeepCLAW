import { PluginManifest, PluginContext, PluginTool, PluginValidationResult } from '../../../src/plugin-sdk/index.js';

export interface DiscordMessage {
  id: string;
  channel_id: string;
  guild_id: string;
  author: {
    id: string;
    username: string;
    discriminator: string;
    bot?: boolean;
  };
  content: string;
  timestamp: number;
}

export interface DiscordSendMessageParams {
  channel_id: string;
  content: string;
  tts?: boolean;
}

export const discordManifest: PluginManifest = {
  name: 'discord',
  version: '2.0.0',
  description: 'Discord messaging extension with DLP and policy enforcement',
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
      action: 'discord:send_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Send messages to Discord channels',
    },
    {
      action: 'discord:receive_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Receive messages from Discord channels',
    },
  ],
  hooks: {
    onMessage: async (ctx: PluginContext) => {
      const payload = ctx.args.payload as DiscordMessage | undefined;
      if (!payload?.content) return;

      const sensitivePatterns = [
        /\b\d{3}-\d{2}-\d{4}\b/g,
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        /(?:sk-proj-|sk-ant-|gsk_)[a-zA-Z0-9_-]{20,}/g,
      ];

      let sanitized = payload.content;
      let redacted = false;
      for (const pattern of sensitivePatterns) {
        if (pattern.test(sanitized)) {
          sanitized = sanitized.replace(pattern, '[REDACTED]');
          redacted = true;
        }
      }

      if (redacted) {
        ctx.metadata.redacted = true;
        ctx.metadata.originalLength = payload.content.length;
        ctx.metadata.sanitizedLength = sanitized.length;
      }
    },
  },
  metadata: {
    platform: 'discord',
    maxMessageLength: 2000,
  },
};

export const discordTools: PluginTool[] = [
  {
    name: 'send_message',
    description: 'Send a message to a Discord channel',
    contract: {
      name: 'send_message',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          channel_id: { type: 'string' },
          content: { type: 'string' },
          tts: { type: 'boolean' },
        },
        required: ['channel_id', 'content'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message_id: { type: 'string' },
        },
      },
      validate: (input) => Boolean(input.channel_id && input.content && input.content.length <= 2000),
      transform: async (input) => input,
    },
    execute: async (input, ctx) => {
      const params = input as DiscordSendMessageParams;
      return {
        success: true,
        message_id: `msg-${Math.floor(Math.random() * 1000000)}`,
        channel_id: params.channel_id,
        content: params.content,
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'get_channel_info',
    description: 'Get information about a Discord channel',
    contract: {
      name: 'get_channel_info',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          channel_id: { type: 'string' },
        },
        required: ['channel_id'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'number' },
        },
      },
      validate: (input) => Boolean(input.channel_id),
      transform: async (input) => input,
    },
    execute: async (input) => {
      const params = input as { channel_id: string };
      return {
        id: params.channel_id,
        name: 'general',
        type: 0,
      };
    },
  },
];

export function validateDiscordPlugin(): PluginValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!discordManifest.name) errors.push('Missing plugin name');
  if (!discordManifest.version) errors.push('Missing plugin version');
  if (discordTools.length === 0) warnings.push('No tools defined');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
