import { describe, test, expect } from 'vitest';
import { instagramDmManifest, instagramDmTools, validateInstagramDMPlugin } from '../src/index';

describe('InstagramDMExtension', () => {
  test('manifest is valid', () => {
    expect(instagramDmManifest.name).toBe('instagram_dm');
    expect(instagramDmManifest.version).toBe('2.0.0');
    expect(instagramDmManifest.capabilities?.channels).toBe(true);
  });

  test('validation passes', () => {
    const result = validateInstagramDMPlugin();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('tools are defined', () => {
    expect(instagramDmTools).toHaveLength(2);
    expect(instagramDmTools[0].name).toBe('send_message');
    expect(instagramDmTools[1].name).toBe('get_channel_info');
  });

  test('send_message validates required fields and max length', () => {
    const tool = instagramDmTools[0];
    expect(tool.contract.validate({ recipient_id: '123', text: 'hello' })).toBe(true);
    expect(tool.contract.validate({ recipient_id: '123', text: 'x'.repeat(2201) })).toBe(false);
    expect(tool.contract.validate({ recipient_id: '123' })).toBe(false);
  });

  test('get_channel_info validates required recipient_id field', () => {
    const tool = instagramDmTools[1];
    expect(tool.contract.validate({ recipient_id: '123' })).toBe(true);
    expect(tool.contract.validate({})).toBe(false);
  });
});