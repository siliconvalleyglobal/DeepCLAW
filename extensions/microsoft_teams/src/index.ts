import { PluginManifest, PluginContext, PluginTool, PluginValidationResult } from '../../../src/plugin-sdk/index.js';

export interface TeamsMessage {
  channel: string;
  text: string;
  user: string;
  timestamp: number;
}

export interface TeamsSendMessageParams {
  channel_id: string;
  content: string;
}

export const microsoftTeamsManifest: PluginManifest = {
  name: 'microsoft_teams',
  version: '2.0.0',
  description: 'Microsoft Teams messaging extension with DLP and policy enforcement',
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
      action: 'microsoft_teams:send_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Send messages to Microsoft Teams channels',
    },
    {
      action: 'microsoft_teams:receive_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Receive messages from Microsoft Teams channels',
    },
  ],
  hooks: {
    onMessage: async (ctx: PluginContext) => {
      const payload = ctx.args.payload as TeamsMessage | undefined;
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
    platform: 'microsoft_teams',
    maxMessageLength: 28000,
  },
};

export const microsoftTeamsTools: PluginTool[] = [
  {
    name: 'send_message',
    description: 'Send a message to a Microsoft Teams channel',
    contract: {
      name: 'send_message',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          channel_id: { type: 'string' },
          content: { type: 'string' },
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
      validate: (input) => Boolean(input.channel_id && input.content && input.content.length <= 28000),
      transform: async (input) => input,
    },
    execute: async (input, ctx) => {
      const params = input as TeamsSendMessageParams;
      return {
        success: true,
        message_id: `mt-${Math.floor(Math.random() * 1000000)}`,
        channel_id: params.channel_id,
        content: params.content,
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'get_channel_info',
    description: 'Get information about a Microsoft Teams channel',
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
        },
      },
      validate: (input) => Boolean(input.channel_id),
      transform: async (input) => input,
    },
    execute: async (input) => {
      const params = input as { channel_id: string };
      return {
        id: params.channel_id,
        name: 'Microsoft Teams Channel',
      };
    },
  },
];

export function validateMicrosoftTeamsPlugin(): PluginValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!microsoftTeamsManifest.name) errors.push('Missing plugin name');
  if (!microsoftTeamsManifest.version) errors.push('Missing plugin version');
  if (microsoftTeamsTools.length === 0) warnings.push('No tools defined');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}