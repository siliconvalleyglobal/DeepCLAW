import { PluginManifest, PluginContext, PluginTool, PluginValidationResult } from '../../../src/plugin-sdk/index.js';

export interface SignalMessage {
  sender: string;
  recipient: string;
  text: string;
  timestamp: number;
}

export interface SignalSendMessageParams {
  recipient: string;
  text: string;
}

export const signalManifest: PluginManifest = {
  name: 'signal',
  version: '2.0.0',
  description: 'Signal messaging extension with DLP and policy enforcement',
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
      action: 'signal:send_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Send messages to Signal chats',
    },
    {
      action: 'signal:receive_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Receive messages from Signal chats',
    },
  ],
  hooks: {
    onMessage: async (ctx: PluginContext) => {
      const payload = ctx.args.payload as SignalMessage | undefined;
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
    platform: 'signal',
    maxMessageLength: 10000,
  },
};

export const signalTools: PluginTool[] = [
  {
    name: 'send_message',
    description: 'Send a message to a Signal chat',
    contract: {
      name: 'send_message',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          recipient: { type: 'string' },
          text: { type: 'string' },
        },
        required: ['recipient', 'text'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message_id: { type: 'string' },
        },
      },
      validate: (input) => Boolean(input.recipient && input.text && input.text.length <= 10000),
      transform: async (input) => input,
    },
    execute: async (input, ctx) => {
      const params = input as SignalSendMessageParams;
      return {
        success: true,
        message_id: `sig-${Math.floor(Math.random() * 1000000)}`,
        recipient: params.recipient,
        text: params.text,
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'get_channel_info',
    description: 'Get information about a Signal chat',
    contract: {
      name: 'get_channel_info',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          recipient: { type: 'string' },
        },
        required: ['recipient'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
      validate: (input) => Boolean(input.recipient),
      transform: async (input) => input,
    },
    execute: async (input) => {
      const params = input as { recipient: string };
      return {
        id: params.recipient,
        name: 'Signal Chat',
      };
    },
  },
];

export function validateSignalPlugin(): PluginValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!signalManifest.name) errors.push('Missing plugin name');
  if (!signalManifest.version) errors.push('Missing plugin version');
  if (signalTools.length === 0) warnings.push('No tools defined');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}