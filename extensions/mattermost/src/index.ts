import { PluginManifest, PluginContext, PluginTool, PluginValidationResult } from '../../../src/plugin-sdk/index.js';

export interface MattermostMessage {
  channel_id: string;
  text: string;
  user: string;
  timestamp: number;
}

export interface MattermostSendMessageParams {
  channel_id: string;
  text: string;
}

export const mattermostManifest: PluginManifest = {
  name: 'mattermost',
  version: '2.0.0',
  description: 'Mattermost messaging extension with DLP and policy enforcement',
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
      action: 'mattermost:send_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Send messages to Mattermost channels',
    },
    {
      action: 'mattermost:receive_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Receive messages from Mattermost channels',
    },
  ],
  hooks: {
    onMessage: async (ctx: PluginContext) => {
      const payload = ctx.args.payload as MattermostMessage | undefined;
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
    platform: 'mattermost',
    maxMessageLength: 4000,
  },
};

export const mattermostTools: PluginTool[] = [
  {
    name: 'send_message',
    description: 'Send a message to a Mattermost channel',
    contract: {
      name: 'send_message',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          channel_id: { type: 'string' },
          text: { type: 'string' },
        },
        required: ['channel_id', 'text'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message_id: { type: 'string' },
        },
      },
      validate: (input) => Boolean(input.channel_id && input.text && input.text.length <= 4000),
      transform: async (input) => input,
    },
    execute: async (input, ctx) => {
      const params = input as MattermostSendMessageParams;
      return {
        success: true,
        message_id: `mm-${Math.floor(Math.random() * 1000000)}`,
        channel_id: params.channel_id,
        text: params.text,
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'get_channel_info',
    description: 'Get information about a Mattermost channel',
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
        name: 'Mattermost Channel',
      };
    },
  },
];

export function validateMattermostPlugin(): PluginValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!mattermostManifest.name) errors.push('Missing plugin name');
  if (!mattermostManifest.version) errors.push('Missing plugin version');
  if (mattermostTools.length === 0) warnings.push('No tools defined');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}