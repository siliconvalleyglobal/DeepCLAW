import { describe, test, expect } from 'vitest';
import {
  webhookManifest,
  webhookTools,
  validateWebhookPlugin,
} from '../src/index';

describe('WebhookExtension', () => {
  test('manifest is valid', () => {
    expect(webhookManifest.name).toBe('webhook');
    expect(webhookManifest.version).toBe('2.0.0');
    expect(webhookManifest.capabilities?.channels).toBe(true);
    expect(webhookManifest.capabilities?.tools).toBe(true);
    expect(webhookManifest.capabilities?.governance).toBe(true);
  });

  test('validation passes', () => {
    const result = validateWebhookPlugin();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('tools are defined', () => {
    expect(webhookTools).toHaveLength(2);
    expect(webhookTools[0].name).toBe('send_request');
    expect(webhookTools[1].name).toBe('receive_payload');
  });

  test('send_request validates URL', () => {
    const tool = webhookTools[0];
    expect(tool.contract.validate({ url: 'https://example.com' })).toBe(true);
    expect(tool.contract.validate({ url: 'not-a-url' })).toBe(false);
    expect(tool.contract.validate({})).toBe(false);
  });

  test('send_request validates method enum', () => {
    const tool = webhookTools[0];
    expect(tool.contract.validate({ url: 'https://example.com', method: 'POST' })).toBe(true);
    expect(tool.contract.validate({ url: 'https://example.com', method: 'INVALID' })).toBe(true);
  });

  test('receive_payload validates content', () => {
    const tool = webhookTools[1];
    expect(tool.contract.validate({ content: 'hello' })).toBe(true);
    expect(tool.contract.validate({})).toBe(false);
  });
});
