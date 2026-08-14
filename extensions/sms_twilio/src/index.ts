import { PluginManifest, PluginContext, PluginTool, PluginValidationResult } from '../../../src/plugin-sdk/index.js';

export interface SMSMessage {
  from: string;
  to: string;
  body: string;
  timestamp: number;
}

export interface SMSSendMessageParams {
  to: string;
  body: string;
}

export const smsTwilioManifest: PluginManifest = {
  name: 'sms_twilio',
  version: '2.0.0',
  description: 'SMS Twilio messaging extension with DLP and policy enforcement',
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
      action: 'sms_twilio:send_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Send SMS messages via Twilio',
    },
    {
      action: 'sms_twilio:receive_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Receive SMS messages via Twilio',
    },
  ],
  hooks: {
    onMessage: async (ctx: PluginContext) => {
      const payload = ctx.args.payload as SMSMessage | undefined;
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
    platform: 'sms_twilio',
    maxMessageLength: 1600,
  },
};

export const smsTwilioTools: PluginTool[] = [
  {
    name: 'send_message',
    description: 'Send an SMS message via Twilio',
    contract: {
      name: 'send_message',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          to: { type: 'string' },
          body: { type: 'string' },
        },
        required: ['to', 'body'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message_id: { type: 'string' },
        },
      },
      validate: (input) => Boolean(input.to && input.body && input.body.length <= 1600),
      transform: async (input) => input,
    },
    execute: async (input, ctx) => {
      const params = input as SMSSendMessageParams;
      return {
        success: true,
        message_id: `sms-${Math.floor(Math.random() * 1000000)}`,
        to: params.to,
        body: params.body,
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'get_channel_info',
    description: 'Get information about an SMS phone number',
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
        name: 'SMS Number',
      };
    },
  },
];

export function validateSMSTwilioPlugin(): PluginValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!smsTwilioManifest.name) errors.push('Missing plugin name');
  if (!smsTwilioManifest.version) errors.push('Missing plugin version');
  if (smsTwilioTools.length === 0) warnings.push('No tools defined');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}