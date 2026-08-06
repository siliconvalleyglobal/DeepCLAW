import { describe, test, expect } from 'vitest';
import { imessageManifest, imessageTools, validateiMessagePlugin } from '../src/index';

describe('iMessageExtension', () => {
  test('manifest is valid', () => {
    expect(imessageManifest.name).toBe('imessage');
    expect(imessageManifest.version).toBe('2.0.0');
    expect(imessageManifest.capabilities?.channels).toBe(true);
  });

  test('validation passes', () => {
    const result = validateiMessagePlugin();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('tools are defined', () => {
    expect(imessageTools).toHaveLength(2);
    expect(imessageTools[0].name).toBe('send_message');
    expect(imessageTools[1].name).toBe('get_channel_info');
  });

  test('send_message validates required fields and max length', () => {
    const tool = imessageTools[0];
    expect(tool.contract.validate({ address: '123', text: 'hello' })).toBe(true);
    expect(tool.contract.validate({ address: '123', text: 'x'.repeat(2001) })).toBe(false);
    expect(tool.contract.validate({ address: '123' })).toBe(false);
  });

  test('get_channel_info validates required address field', () => {
    const tool = imessageTools[1];
    expect(tool.contract.validate({ address: '123' })).toBe(true);
    expect(tool.contract.validate({})).toBe(false);
  });
});