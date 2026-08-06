import { describe, test, expect } from 'vitest';
import { microsoftTeamsManifest, microsoftTeamsTools, validateMicrosoftTeamsPlugin } from '../src/index';

describe('MicrosoftTeamsExtension', () => {
  test('manifest is valid', () => {
    expect(microsoftTeamsManifest.name).toBe('microsoft_teams');
    expect(microsoftTeamsManifest.version).toBe('2.0.0');
    expect(microsoftTeamsManifest.capabilities?.channels).toBe(true);
  });

  test('validation passes', () => {
    const result = validateMicrosoftTeamsPlugin();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('tools are defined', () => {
    expect(microsoftTeamsTools).toHaveLength(2);
    expect(microsoftTeamsTools[0].name).toBe('send_message');
    expect(microsoftTeamsTools[1].name).toBe('get_channel_info');
  });

  test('send_message validates required fields and max length', () => {
    const tool = microsoftTeamsTools[0];
    expect(tool.contract.validate({ channel_id: '123', content: 'hello' })).toBe(true);
    expect(tool.contract.validate({ channel_id: '123', content: 'x'.repeat(28001) })).toBe(false);
    expect(tool.contract.validate({ channel_id: '123' })).toBe(false);
  });

  test('get_channel_info validates required channel_id field', () => {
    const tool = microsoftTeamsTools[1];
    expect(tool.contract.validate({ channel_id: '123' })).toBe(true);
    expect(tool.contract.validate({})).toBe(false);
  });
});