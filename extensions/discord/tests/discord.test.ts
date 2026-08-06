import { describe, test, expect } from 'vitest';
import { discordManifest, discordTools, validateDiscordPlugin } from '../src/index';

describe('DiscordExtension', () => {
  test('manifest is valid', () => {
    expect(discordManifest.name).toBe('discord');
    expect(discordManifest.version).toBe('2.0.0');
    expect(discordManifest.capabilities?.channels).toBe(true);
  });

  test('validation passes', () => {
    const result = validateDiscordPlugin();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('tools are defined', () => {
    expect(discordTools).toHaveLength(2);
    expect(discordTools[0].name).toBe('send_message');
    expect(discordTools[1].name).toBe('get_channel_info');
  });

  test('send_message validates max length', () => {
    const tool = discordTools[0];
    expect(tool.contract.validate({ channel_id: '123', content: 'hello' })).toBe(true);
    expect(tool.contract.validate({ channel_id: '123', content: 'x'.repeat(2001) })).toBe(false);
  });
});
