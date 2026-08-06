import { describe, test, expect } from 'vitest';
import { slackManifest, slackTools, validateSlackPlugin } from '../src/index';

describe('SlackExtension', () => {
  test('manifest is valid', () => {
    expect(slackManifest.name).toBe('slack');
    expect(slackManifest.version).toBe('2.0.0');
    expect(slackManifest.capabilities?.channels).toBe(true);
  });

  test('validation passes', () => {
    const result = validateSlackPlugin();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('tools are defined', () => {
    expect(slackTools).toHaveLength(2);
    expect(slackTools[0].name).toBe('send_message');
    expect(slackTools[1].name).toBe('get_channel_info');
  });

  test('send_message validates max length', () => {
    const tool = slackTools[0];
    expect(tool.contract.validate({ channel: 'C123', text: 'hello' })).toBe(true);
    expect(tool.contract.validate({ channel: 'C123', text: 'x'.repeat(40001) })).toBe(false);
  });
});
