import { describe, test, expect } from 'vitest';
import { googleChatManifest, googleChatTools, validateGoogleChatPlugin } from '../src/index';

describe('GoogleChatExtension', () => {
  test('manifest is valid', () => {
    expect(googleChatManifest.name).toBe('google_chat');
    expect(googleChatManifest.version).toBe('2.0.0');
    expect(googleChatManifest.capabilities?.channels).toBe(true);
  });

  test('validation passes', () => {
    const result = validateGoogleChatPlugin();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('tools are defined', () => {
    expect(googleChatTools).toHaveLength(2);
    expect(googleChatTools[0].name).toBe('send_message');
    expect(googleChatTools[1].name).toBe('get_channel_info');
  });

  test('send_message validates required fields and max length', () => {
    const tool = googleChatTools[0];
    expect(tool.contract.validate({ space_name: '123', text: 'hello' })).toBe(true);
    expect(tool.contract.validate({ space_name: '123', text: 'x'.repeat(10001) })).toBe(false);
    expect(tool.contract.validate({ space_name: '123' })).toBe(false);
  });

  test('get_channel_info validates required space_name field', () => {
    const tool = googleChatTools[1];
    expect(tool.contract.validate({ space_name: '123' })).toBe(true);
    expect(tool.contract.validate({})).toBe(false);
  });
});