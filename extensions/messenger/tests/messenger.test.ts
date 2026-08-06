import { describe, test, expect } from 'vitest';
import { messengerManifest, messengerTools, validateMessengerPlugin } from '../src/index';

describe('MessengerExtension', () => {
  test('manifest is valid', () => {
    expect(messengerManifest.name).toBe('messenger');
    expect(messengerManifest.version).toBe('2.0.0');
    expect(messengerManifest.capabilities?.channels).toBe(true);
  });

  test('validation passes', () => {
    const result = validateMessengerPlugin();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('tools are defined', () => {
    expect(messengerTools).toHaveLength(2);
    expect(messengerTools[0].name).toBe('send_message');
    expect(messengerTools[1].name).toBe('get_channel_info');
  });

  test('send_message validates required fields and max length', () => {
    const tool = messengerTools[0];
    expect(tool.contract.validate({ recipient_id: '123', text: 'hello' })).toBe(true);
    expect(tool.contract.validate({ recipient_id: '123', text: 'x'.repeat(2001) })).toBe(false);
    expect(tool.contract.validate({ recipient_id: '123' })).toBe(false);
  });

  test('get_channel_info validates required recipient_id field', () => {
    const tool = messengerTools[1];
    expect(tool.contract.validate({ recipient_id: '123' })).toBe(true);
    expect(tool.contract.validate({})).toBe(false);
  });
});