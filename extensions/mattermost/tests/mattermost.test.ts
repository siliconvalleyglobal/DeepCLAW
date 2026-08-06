import { describe, test, expect } from 'vitest';
import { mattermostManifest, mattermostTools, validateMattermostPlugin } from '../src/index';

describe('MattermostExtension', () => {
  test('manifest is valid', () => {
    expect(mattermostManifest.name).toBe('mattermost');
    expect(mattermostManifest.version).toBe('2.0.0');
    expect(mattermostManifest.capabilities?.channels).toBe(true);
  });

  test('validation passes', () => {
    const result = validateMattermostPlugin();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('tools are defined', () => {
    expect(mattermostTools).toHaveLength(2);
    expect(mattermostTools[0].name).toBe('send_message');
    expect(mattermostTools[1].name).toBe('get_channel_info');
  });

  test('send_message validates required fields and max length', () => {
    const tool = mattermostTools[0];
    expect(tool.contract.validate({ channel_id: '123', text: 'hello' })).toBe(true);
    expect(tool.contract.validate({ channel_id: '123', text: 'x'.repeat(4001) })).toBe(false);
    expect(tool.contract.validate({ channel_id: '123' })).toBe(false);
  });

  test('get_channel_info validates required channel_id field', () => {
    const tool = mattermostTools[1];
    expect(tool.contract.validate({ channel_id: '123' })).toBe(true);
    expect(tool.contract.validate({})).toBe(false);
  });
});