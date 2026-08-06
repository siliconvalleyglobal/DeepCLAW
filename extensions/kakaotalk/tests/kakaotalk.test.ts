import { describe, test, expect } from 'vitest';
import { kakaotalkManifest, kakaotalkTools, validateKakaoTalkPlugin } from '../src/index';

describe('KakaoTalkExtension', () => {
  test('manifest is valid', () => {
    expect(kakaotalkManifest.name).toBe('kakaotalk');
    expect(kakaotalkManifest.version).toBe('2.0.0');
    expect(kakaotalkManifest.capabilities?.channels).toBe(true);
  });

  test('validation passes', () => {
    const result = validateKakaoTalkPlugin();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('tools are defined', () => {
    expect(kakaotalkTools).toHaveLength(2);
    expect(kakaotalkTools[0].name).toBe('send_message');
    expect(kakaotalkTools[1].name).toBe('get_channel_info');
  });

  test('send_message validates required fields and max length', () => {
    const tool = kakaotalkTools[0];
    expect(tool.contract.validate({ to: '123', text: 'hello' })).toBe(true);
    expect(tool.contract.validate({ to: '123', text: 'x'.repeat(1001) })).toBe(false);
    expect(tool.contract.validate({ to: '123' })).toBe(false);
  });

  test('get_channel_info validates required to field', () => {
    const tool = kakaotalkTools[1];
    expect(tool.contract.validate({ to: '123' })).toBe(true);
    expect(tool.contract.validate({})).toBe(false);
  });
});