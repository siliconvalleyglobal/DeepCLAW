import { PluginManifest, PluginContext, PluginTool, PluginValidationResult } from '../../../src/plugin-sdk/index.js';

export interface SlackMessage {
  ts: string;
  channel: string;
  user: string;
  text: string;
  event_ts: number;
}

export interface SlackSendMessageParams {
  channel: string;
  text: string;
  thread_ts?: string;
}

export const slackManifest: PluginManifest = {
  name: 'slack',
  version: '2.0.0',
  description: 'Slack messaging extension with DLP and policy enforcement',
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
      action: 'slack:send_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Send messages to Slack channels',
    },
    {
      action: 'slack:receive_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Receive messages from Slack channels',
    },
  ],
  hooks: {
    onMessage: async (ctx: PluginContext) => {
      const payload = ctx.args.payload as SlackMessage | undefined;
      if (!payload?.text) return;

      const sensitivePatterns = [
        /\b\d{3}-\d{2}-\d{4}\b/g,
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        /(?:sk-proj-|sk-ant-|gsk_)[a-zA-Z0-9_-]{20,}/g,
        /xox[baprs]-[a-zA-Z0-9-]+/g,
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
    platform: 'slack',
    maxMessageLength: 40000,
  },
};

export const slackTools: PluginTool[] = [
  {
    name: 'send_message',
    description: 'Send a message to a Slack channel',
    contract: {
      name: 'send_message',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          channel: { type: 'string' },
          text: { type: 'string' },
          thread_ts: { type: 'string' },
        },
        required: ['channel', 'text'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          ts: { type: 'string' },
        },
      },
      validate: (input) => Boolean(input.channel && input.text && input.text.length <= 40000),
      transform: async (input) => input,
    },
    execute: async (input, ctx) => {
      const params = input as SlackSendMessageParams;
      return {
        success: true,
        ts: `${Date.now()}.${Math.floor(Math.random() * 1000000)}`,
        channel: params.channel,
        text: params.text,
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'get_channel_info',
    description: 'Get information about a Slack channel',
    contract: {
      name: 'get_channel_info',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          channel: { type: 'string' },
        },
        required: ['channel'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          is_channel: { type: 'boolean' },
        },
      },
      validate: (input) => Boolean(input.channel),
      transform: async (input) => input,
    },
    execute: async (input) => {
      const params = input as { channel: string };
      return {
        id: params.channel,
        name: 'general',
        is_channel: true,
      };
    },
  },
];

export function validateSlackPlugin(): PluginValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!slackManifest.name) errors.push('Missing plugin name');
  if (!slackManifest.version) errors.push('Missing plugin version');
  if (slackTools.length === 0) warnings.push('No tools defined');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
