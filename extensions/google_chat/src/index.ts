import { PluginManifest, PluginContext, PluginTool, PluginValidationResult } from '@deepclaw/plugin-sdk';

export interface GoogleChatMessage {
  sender: string;
  space: string;
  text: string;
  timestamp: number;
}

export interface GoogleChatSendMessageParams {
  space_name: string;
  text: string;
}

export const googleChatManifest: PluginManifest = {
  name: 'google_chat',
  version: '2.0.0',
  description: 'Google Chat messaging extension with DLP and policy enforcement',
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
      action: 'google_chat:send_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Send messages to Google Chat spaces',
    },
    {
      action: 'google_chat:receive_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Receive messages from Google Chat spaces',
    },
  ],
  hooks: {
    onMessage: async (ctx: PluginContext) => {
      const payload = ctx.args.payload as GoogleChatMessage | undefined;
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
    platform: 'google_chat',
    maxMessageLength: 10000,
  },
};

export const googleChatTools: PluginTool[] = [
  {
    name: 'send_message',
    description: 'Send a message to a Google Chat space',
    contract: {
      name: 'send_message',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          space_name: { type: 'string' },
          text: { type: 'string' },
        },
        required: ['space_name', 'text'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message_id: { type: 'string' },
        },
      },
      validate: (input) => Boolean(input.space_name && input.text && input.text.length <= 10000),
      transform: async (input) => input,
    },
    execute: async (input, ctx) => {
      const params = input as GoogleChatSendMessageParams;
      return {
        success: true,
        message_id: `gc-${Math.floor(Math.random() * 1000000)}`,
        space_name: params.space_name,
        text: params.text,
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'get_channel_info',
    description: 'Get information about a Google Chat space',
    contract: {
      name: 'get_channel_info',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          space_name: { type: 'string' },
        },
        required: ['space_name'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
      validate: (input) => Boolean(input.space_name),
      transform: async (input) => input,
    },
    execute: async (input) => {
      const params = input as { space_name: string };
      return {
        id: params.space_name,
        name: 'Google Chat Space',
      };
    },
  },
];

export function validateGoogleChatPlugin(): PluginValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!googleChatManifest.name) errors.push('Missing plugin name');
  if (!googleChatManifest.version) errors.push('Missing plugin version');
  if (googleChatTools.length === 0) warnings.push('No tools defined');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}