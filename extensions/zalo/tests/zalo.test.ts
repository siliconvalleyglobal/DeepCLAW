import { describe, test, expect } from 'vitest';
import { zaloManifest, zaloTools, validateZaloPlugin } from '../src/index';

describe('ZaloExtension', () => {
  test('manifest is valid', () => {
    expect(zaloManifest.name).toBe('zalo');
    expect(zaloManifest.version).toBe('2.0.0');
    expect(zaloManifest.capabilities?.channels).toBe(true);
  });

  test('validation passes', () => {
    const result = validateZaloPlugin();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('tools are defined', () => {
    expect(zaloTools).toHaveLength(2);
    expect(zaloTools[0].name).toBe('send_message');
    expect(zaloTools[1].name).toBe('get_channel_info');
  });

  test('send_message validates required fields and max length', () => {
    const tool = zaloTools[0];
    expect(tool.contract.validate({ user_id: '123', text: 'hello' })).toBe(true);
    expect(tool.contract.validate({ user_id: '123', text: 'x'.repeat(10001) })).toBe(false);
    expect(tool.contract.validate({ user_id: '123' })).toBe(false);
  });

  test('get_channel_info validates required user_id field', () => {
    const tool = zaloTools[1];
    expect(tool.contract.validate({ user_id: '123' })).toBe(true);
    expect(tool.contract.validate({})).toBe(false);
  });
});