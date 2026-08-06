import { describe, test, expect } from 'vitest';
import { telegramManifest, telegramTools, validateTelegramPlugin } from '../src/index';

describe('TelegramExtension', () => {
  test('manifest is valid', () => {
    expect(telegramManifest.name).toBe('telegram');
    expect(telegramManifest.version).toBe('2.0.0');
    expect(telegramManifest.capabilities?.channels).toBe(true);
  });

  test('validation passes', () => {
    const result = validateTelegramPlugin();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('tools are defined', () => {
    expect(telegramTools).toHaveLength(2);
    expect(telegramTools[0].name).toBe('send_message');
    expect(telegramTools[1].name).toBe('get_chat_info');
  });

  test('send_message validates required fields', () => {
    const tool = telegramTools[0];
    expect(tool.contract.validate({ chat_id: '123', text: 'hello' })).toBe(true);
    expect(tool.contract.validate({ chat_id: '123', text: 'x'.repeat(4097) })).toBe(false);
    expect(tool.contract.validate({ chat_id: '123' })).toBe(false);
  });
});
