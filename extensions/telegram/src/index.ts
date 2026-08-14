import { PluginManifest, PluginContext, PluginTool, PluginValidationResult } from '../../../src/plugin-sdk/index.js';

export interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  chat: {
    id: number;
    type: string;
    title?: string;
    username?: string;
  };
  text?: string;
  date: number;
}

export interface TelegramSendMessageParams {
  chat_id: number | string;
  text: string;
  parse_mode?: 'Markdown' | 'MarkdownV2' | 'HTML';
  disable_web_page_preview?: boolean;
}

export const telegramManifest: PluginManifest = {
  name: 'telegram',
  version: '2.0.0',
  description: 'Telegram messaging extension with DLP and policy enforcement',
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
      action: 'telegram:send_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Send messages to Telegram chats',
    },
    {
      action: 'telegram:receive_message',
      resources: ['*'],
      effect: 'allow',
      description: 'Receive messages from Telegram chats',
    },
  ],
  hooks: {
    onMessage: async (ctx: PluginContext) => {
      const payload = ctx.args.payload as TelegramMessage | undefined;
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
    platform: 'telegram',
    maxMessageLength: 4096,
  },
};

export const telegramTools: PluginTool[] = [
  {
    name: 'send_message',
    description: 'Send a message to a Telegram chat',
    contract: {
      name: 'send_message',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          chat_id: { type: 'string' },
          text: { type: 'string' },
          parse_mode: { type: 'string', enum: ['Markdown', 'MarkdownV2', 'HTML'] },
        },
        required: ['chat_id', 'text'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message_id: { type: 'number' },
        },
      },
      validate: (input) => {
        return Boolean(input.chat_id && input.text && input.text.length <= 4096);
      },
      transform: async (input) => {
        return input;
      },
    },
    execute: async (input, ctx) => {
      const params = input as TelegramSendMessageParams;
      return {
        success: true,
        message_id: Math.floor(Math.random() * 1000000),
        chat_id: params.chat_id,
        text: params.text,
        timestamp: Date.now(),
      };
    },
  },
  {
    name: 'get_chat_info',
    description: 'Get information about a Telegram chat',
    contract: {
      name: 'get_chat_info',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          chat_id: { type: 'string' },
        },
        required: ['chat_id'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          type: { type: 'string' },
          title: { type: 'string' },
        },
      },
      validate: (input) => Boolean(input.chat_id),
      transform: async (input) => input,
    },
    execute: async (input) => {
      const params = input as { chat_id: string };
      return {
        id: Number(params.chat_id),
        type: 'private',
        title: 'User Chat',
      };
    },
  },
];

export function validateTelegramPlugin(): PluginValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!telegramManifest.name) errors.push('Missing plugin name');
  if (!telegramManifest.version) errors.push('Missing plugin version');
  if (telegramTools.length === 0) warnings.push('No tools defined');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
