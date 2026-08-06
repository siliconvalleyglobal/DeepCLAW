import { PluginManifest, PluginContext, PluginTool, PluginValidationResult } from '@deepclaw/plugin-sdk';

export interface WhatsAppMessage {
  message_id: string;
  from: string;
  to: string;
  text: string;
  timestamp: number;
}

export interface WhatsAppSendMessageParams {
  to: string;
  text: string;
}

export const whatsappManifest: PluginManifest = {
  name: 'whatsapp',
  version: '2.0.0',
  description: 'WhatsApp messaging extension with DLP and policy enforcement',
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
      action: 'whatsapp:send_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Send messages to WhatsApp chats',
    },
    {
      action: 'whatsapp:receive_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Receive messages from WhatsApp chats',
    },
  ],
  hooks: {
    onMessage: async (ctx: PluginContext) => {
      const payload = ctx.args.payload as WhatsAppMessage | undefined;
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
    platform: 'whatsapp',
    maxMessageLength: 65536,
  },
};

export const whatsappTools: PluginTool[] = [
  {
    name: 'send_message',
    description: 'Send a message to a WhatsApp chat',
    contract: {
      name: 'send_message',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          to: { type: 'string' },
          text: { type: 'string' },
        },
        required: ['to', 'text'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message_id: { type: 'string' },
        },
      },
      validate: (input) => Boolean(input.to && input.text && input.text.length <= 65536),
      transform: async (input) => input,
    },
    execute: async (input, ctx) => {
      const params = input as WhatsAppSendMessageParams;
      return {
        success: true,
        message_id: `wa-${Math.floor(Math.random() * 1000000)}`,
        to: params.to,
        text: params.text,
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'get_channel_info',
    description: 'Get information about a WhatsApp chat',
    contract: {
      name: 'get_channel_info',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          to: { type: 'string' },
        },
        required: ['to'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
      validate: (input) => Boolean(input.to),
      transform: async (input) => input,
    },
    execute: async (input) => {
      const params = input as { to: string };
      return {
        id: params.to,
        name: 'WhatsApp Chat',
      };
    },
  },
];

export function validateWhatsAppPlugin(): PluginValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!whatsappManifest.name) errors.push('Missing plugin name');
  if (!whatsappManifest.version) errors.push('Missing plugin version');
  if (whatsappTools.length === 0) warnings.push('No tools defined');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}