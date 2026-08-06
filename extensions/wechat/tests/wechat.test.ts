import { describe, test, expect } from 'vitest';
import { wechatManifest, wechatTools, validateWechatPlugin } from '../src/index';

describe('WechatExtension', () => {
  test('manifest is valid', () => {
    expect(wechatManifest.name).toBe('wechat');
    expect(wechatManifest.version).toBe('2.0.0');
    expect(wechatManifest.capabilities?.channels).toBe(true);
  });

  test('validation passes', () => {
    const result = validateWechatPlugin();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('tools are defined', () => {
    expect(wechatTools).toHaveLength(2);
    expect(wechatTools[0].name).toBe('send_message');
    expect(wechatTools[1].name).toBe('get_channel_info');
  });

  test('send_message validates required fields and max length', () => {
    const tool = wechatTools[0];
    expect(tool.contract.validate({ to: '123', text: 'hello' })).toBe(true);
    expect(tool.contract.validate({ to: '123', text: 'x'.repeat(2049) })).toBe(false);
    expect(tool.contract.validate({ to: '123' })).toBe(false);
  });

  test('get_channel_info validates required to field', () => {
    const tool = wechatTools[1];
    expect(tool.contract.validate({ to: '123' })).toBe(true);
    expect(tool.contract.validate({})).toBe(false);
  });
});