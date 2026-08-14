import { PluginManifest, PluginContext, PluginTool, PluginValidationResult } from '../../../src/plugin-sdk/index.js';

export interface WechatMessage {
  FromUserName: string;
  ToUserName: string;
  Content: string;
  CreateTime: number;
}

export interface WechatSendMessageParams {
  to: string;
  text: string;
}

export const wechatManifest: PluginManifest = {
  name: 'wechat',
  version: '2.0.0',
  description: 'WeChat messaging extension with DLP and policy enforcement',
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
      action: 'wechat:send_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Send messages to WeChat chats',
    },
    {
      action: 'wechat:receive_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Receive messages from WeChat chats',
    },
  ],
  hooks: {
    onMessage: async (ctx: PluginContext) => {
      const payload = ctx.args.payload as WechatMessage | undefined;
      if (!payload?.Content) return;

      const sensitivePatterns = [
        /\b\d{3}-\d{2}-\d{4}\b/g,
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        /(?:sk-proj-|sk-ant-|gsk_)[a-zA-Z0-9_-]{20,}/g,
      ];

      let sanitized = payload.Content;
      let redacted = false;
      for (const pattern of sensitivePatterns) {
        if (pattern.test(sanitized)) {
          sanitized = sanitized.replace(pattern, '[REDACTED]');
          redacted = true;
        }
      }

      if (redacted) {
        ctx.metadata.redacted = true;
        ctx.metadata.originalLength = payload.Content.length;
        ctx.metadata.sanitizedLength = sanitized.length;
      }
    },
  },
  metadata: {
    platform: 'wechat',
    maxMessageLength: 2048,
  },
};

export const wechatTools: PluginTool[] = [
  {
    name: 'send_message',
    description: 'Send a message to a WeChat chat',
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
      validate: (input) => Boolean(input.to && input.text && input.text.length <= 2048),
      transform: async (input) => input,
    },
    execute: async (input, ctx) => {
      const params = input as WechatSendMessageParams;
      return {
        success: true,
        message_id: `wc-${Math.floor(Math.random() * 1000000)}`,
        to: params.to,
        text: params.text,
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'get_channel_info',
    description: 'Get information about a WeChat chat',
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
        name: 'WeChat Chat',
      };
    },
  },
];

export function validateWechatPlugin(): PluginValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!wechatManifest.name) errors.push('Missing plugin name');
  if (!wechatManifest.version) errors.push('Missing plugin version');
  if (wechatTools.length === 0) warnings.push('No tools defined');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}