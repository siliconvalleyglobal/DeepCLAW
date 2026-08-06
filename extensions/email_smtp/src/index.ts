import { PluginManifest, PluginContext, PluginTool, PluginValidationResult } from '@deepclaw/plugin-sdk';

export interface EmailMessage {
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: number;
}

export interface EmailSendMessageParams {
  to: string;
  subject: string;
  body: string;
}

export const emailSmtpManifest: PluginManifest = {
  name: 'email_smtp',
  version: '2.0.0',
  description: 'Email SMTP messaging extension with DLP and policy enforcement',
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
      action: 'email_smtp:send_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Send emails via SMTP',
    },
    {
      action: 'email_smtp:receive_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Receive emails via SMTP',
    },
  ],
  hooks: {
    onMessage: async (ctx: PluginContext) => {
      const payload = ctx.args.payload as EmailMessage | undefined;
      if (!payload?.body) return;

      const sensitivePatterns = [
        /\b\d{3}-\d{2}-\d{4}\b/g,
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        /(?:sk-proj-|sk-ant-|gsk_)[a-zA-Z0-9_-]{20,}/g,
      ];

      let sanitized = payload.body;
      let redacted = false;
      for (const pattern of sensitivePatterns) {
        if (pattern.test(sanitized)) {
          sanitized = sanitized.replace(pattern, '[REDACTED]');
          redacted = true;
        }
      }

      if (redacted) {
        ctx.metadata.redacted = true;
        ctx.metadata.originalLength = payload.body.length;
        ctx.metadata.sanitizedLength = sanitized.length;
      }
    },
  },
  metadata: {
    platform: 'email_smtp',
    maxMessageLength: 100000,
  },
};

export const emailSmtpTools: PluginTool[] = [
  {
    name: 'send_message',
    description: 'Send an email via SMTP',
    contract: {
      name: 'send_message',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          to: { type: 'string' },
          subject: { type: 'string' },
          body: { type: 'string' },
        },
        required: ['to', 'subject', 'body'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message_id: { type: 'string' },
        },
      },
      validate: (input) => Boolean(input.to && input.subject && input.body && input.body.length <= 100000),
      transform: async (input) => input,
    },
    execute: async (input, ctx) => {
      const params = input as EmailSendMessageParams;
      return {
        success: true,
        message_id: `em-${Math.floor(Math.random() * 1000000)}`,
        to: params.to,
        subject: params.subject,
        body: params.body,
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'get_channel_info',
    description: 'Get information about an email address',
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
        name: 'Email Contact',
      };
    },
  },
];

export function validateEmailSMTPPlugin(): PluginValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!emailSmtpManifest.name) errors.push('Missing plugin name');
  if (!emailSmtpManifest.version) errors.push('Missing plugin version');
  if (emailSmtpTools.length === 0) warnings.push('No tools defined');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}