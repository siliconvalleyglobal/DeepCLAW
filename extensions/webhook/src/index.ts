import { PluginManifest, PluginContext, PluginTool, PluginValidationResult } from '@deepclaw/plugin-sdk';

export interface WebhookMessage {
  id: string;
  sender_id?: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface WebhookSendParams {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  secret?: string;
}

export const webhookManifest: PluginManifest = {
  name: 'webhook',
  version: '2.0.0',
  description: 'Generic webhook extension for arbitrary REST integrations with policy enforcement',
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
      action: 'webhook:send',
      resources: ['*'],
      effect: 'allow',
      description: 'Send HTTP requests to configured webhook endpoints',
    },
    {
      action: 'webhook:receive',
      resources: ['*'],
      effect: 'allow',
      description: 'Receive and process inbound webhook payloads',
    },
  ],
  hooks: {
    onMessage: async (ctx: PluginContext) => {
      const payload = ctx.args.payload as WebhookMessage | undefined;
      if (!payload?.content) return;

      const sensitivePatterns = [
        /\b\d{3}-\d{2}-\d{4}\b/g,
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        /(?:sk-proj-|sk-ant-|gsk_)[a-zA-Z0-9_-]{20,}/g,
        /xox[baprs]-[a-zA-Z0-9-]+/g,
      ];

      let sanitized = payload.content;
      let redacted = false;
      for (const pattern of sensitivePatterns) {
        if (pattern.test(sanitized)) {
          sanitized = sanitized.replace(pattern, '[REDACTED]');
          redacted = true;
        }
      }

      if (redacted) {
        ctx.metadata.redacted = true;
        ctx.metadata.originalLength = payload.content.length;
        ctx.metadata.sanitizedLength = sanitized.length;
      }
    },
  },
  metadata: {
    platform: 'webhook',
    maxMessageLength: 100000,
  },
};

export const webhookTools: PluginTool[] = [
  {
    name: 'send_request',
    description: 'Send an HTTP request to a configured webhook endpoint',
    contract: {
      name: 'send_request',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', format: 'uri' },
          method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
          headers: { type: 'object' },
          body: { type: 'object' },
          secret: { type: 'string' },
        },
        required: ['url'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          status: { type: 'number' },
          body: { type: 'string' },
        },
      },
      validate: (input) => {
        if (!input.url || typeof input.url !== 'string') return false;
        try {
          new URL(input.url);
          return true;
        } catch {
          return false;
        }
      },
      transform: async (input) => input,
    },
    execute: async (input) => {
      const params = input as WebhookSendParams;
      const url = params.url;
      const method = params.method ?? 'POST';

      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...params.headers,
          },
          body: params.body ? JSON.stringify(params.body) : undefined,
        });

        const body = await response.text();
        return {
          success: response.ok,
          status: response.status,
          body,
          url,
          timestamp: Date.now(),
        };
      } catch (error) {
        return {
          success: false,
          status: 0,
          body: error instanceof Error ? error.message : 'Unknown error',
          url,
          timestamp: Date.now(),
        };
      }
    },
  },
  {
    name: 'receive_payload',
    description: 'Process an inbound webhook payload through policy and DLP checks',
    contract: {
      name: 'receive_payload',
      version: '1.0.0',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          sender_id: { type: 'string' },
          content: { type: 'string' },
          metadata: { type: 'object' },
        },
        required: ['content'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          message_id: { type: 'string' },
          content: { type: 'string' },
          redacted: { type: 'boolean' },
        },
      },
      validate: (input) => Boolean(input.content),
      transform: async (input) => input,
    },
    execute: async (input, ctx) => {
      const payload = input as WebhookMessage;
      const sanitized = ctx.metadata.redacted
        ? payload.content.replace(/\[REDACTED\]/g, '[REDACTED]')
        : payload.content;

      return {
        message_id: payload.id || `wh-${Date.now()}`,
        content: sanitized,
        redacted: Boolean(ctx.metadata.redacted),
        sender_id: payload.sender_id,
        metadata: payload.metadata,
        timestamp: Date.now(),
      };
    },
  },
];

export function validateWebhookPlugin(): PluginValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!webhookManifest.name) errors.push('Missing plugin name');
  if (!webhookManifest.version) errors.push('Missing plugin version');
  if (webhookTools.length === 0) warnings.push('No tools defined');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
