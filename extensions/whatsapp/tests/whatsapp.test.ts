import { describe, test, expect } from 'vitest';
import { whatsappManifest, whatsappTools, validateWhatsAppPlugin } from '../src/index';

describe('WhatsAppExtension', () => {
  test('manifest is valid', () => {
    expect(whatsappManifest.name).toBe('whatsapp');
    expect(whatsappManifest.version).toBe('2.0.0');
    expect(whatsappManifest.capabilities?.channels).toBe(true);
  });

  test('validation passes', () => {
    const result = validateWhatsAppPlugin();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('tools are defined', () => {
    expect(whatsappTools).toHaveLength(2);
    expect(whatsappTools[0].name).toBe('send_message');
    expect(whatsappTools[1].name).toBe('get_channel_info');
  });

  test('send_message validates required fields and max length', () => {
    const tool = whatsappTools[0];
    expect(tool.contract.validate({ to: '123', text: 'hello' })).toBe(true);
    expect(tool.contract.validate({ to: '123', text: 'x'.repeat(65537) })).toBe(false);
    expect(tool.contract.validate({ to: '123' })).toBe(false);
  });

  test('get_channel_info validates required to field', () => {
    const tool = whatsappTools[1];
    expect(tool.contract.validate({ to: '123' })).toBe(true);
    expect(tool.contract.validate({})).toBe(false);
  });
});