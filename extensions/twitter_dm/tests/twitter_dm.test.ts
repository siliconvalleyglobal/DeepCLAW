import { describe, test, expect } from 'vitest';
import { twitterDmManifest, twitterDmTools, validateTwitterDMPlugin } from '../src/index';

describe('TwitterDMExtension', () => {
  test('manifest is valid', () => {
    expect(twitterDmManifest.name).toBe('twitter_dm');
    expect(twitterDmManifest.version).toBe('2.0.0');
    expect(twitterDmManifest.capabilities?.channels).toBe(true);
  });

  test('validation passes', () => {
    const result = validateTwitterDMPlugin();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('tools are defined', () => {
    expect(twitterDmTools).toHaveLength(2);
    expect(twitterDmTools[0].name).toBe('send_message');
    expect(twitterDmTools[1].name).toBe('get_channel_info');
  });

  test('send_message validates required fields and max length', () => {
    const tool = twitterDmTools[0];
    expect(tool.contract.validate({ recipient_id: '123', text: 'hello' })).toBe(true);
    expect(tool.contract.validate({ recipient_id: '123', text: 'x'.repeat(10001) })).toBe(false);
    expect(tool.contract.validate({ recipient_id: '123' })).toBe(false);
  });

  test('get_channel_info validates required recipient_id field', () => {
    const tool = twitterDmTools[1];
    expect(tool.contract.validate({ recipient_id: '123' })).toBe(true);
    expect(tool.contract.validate({})).toBe(false);
  });
});