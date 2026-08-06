import { PluginManifest, PluginContext, PluginTool, PluginValidationResult } from '@deepclaw/plugin-sdk';

export interface WebchatMessage {
  session_id: string;
  text: string;
  user: string;
  timestamp: number;
}

export interface WebchatSendMessageParams {
  session_id: string;
  text: string;
}

export const webchatWidgetManifest: PluginManifest = {
  name: 'webchat_widget',
  version: '2.0.0',
  description: 'Webchat Widget messaging extension with DLP and policy enforcement',
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
      action: 'webchat_widget:send_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Send messages to Webchat Widget sessions',
    },
    {
      action: 'webchat_widget:receive_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Receive messages from Webchat Widget sessions',
    },
  ],
  hooks: {
    onMessage: async (ctx: PluginContext) => {
      const payload = ctx.args.payload as WebchatMessage | undefined;
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
    platform: 'webchat_widget',
    maxMessageLength: 100000,
  },
};

export const webchatWidgetTools: PluginTool[] = [
  {
    name: 'send_message',
    description: 'Send a message to a Webchat Widget session',
    contract: {
      name: 'send_message',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          session_id: { type: 'string' },
          text: { type: 'string' },
        },
        required: ['session_id', 'text'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message_id: { type: 'string' },
        },
      },
      validate: (input) => Boolean(input.session_id && input.text && input.text.length <= 100000),
      transform: async (input) => input,
    },
    execute: async (input, ctx) => {
      const params = input as WebchatSendMessageParams;
      return {
        success: true,
        message_id: `wc-${Math.floor(Math.random() * 1000000)}`,
        session_id: params.session_id,
        text: params.text,
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'get_channel_info',
    description: 'Get information about a Webchat Widget session',
    contract: {
      name: 'get_channel_info',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          session_id: { type: 'string' },
        },
        required: ['session_id'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
      validate: (input) => Boolean(input.session_id),
      transform: async (input) => input,
    },
    execute: async (input) => {
      const params = input as { session_id: string };
      return {
        id: params.session_id,
        name: 'Webchat Widget Session',
      };
    },
  },
];

export function validateWebchatWidgetPlugin(): PluginValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!webchatWidgetManifest.name) errors.push('Missing plugin name');
  if (!webchatWidgetManifest.version) errors.push('Missing plugin version');
  if (webchatWidgetTools.length === 0) warnings.push('No tools defined');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}