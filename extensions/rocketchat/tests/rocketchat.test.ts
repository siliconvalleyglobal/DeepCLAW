import { describe, test, expect } from 'vitest';
import { rocketchatManifest, rocketchatTools, validateRocketchatPlugin } from '../src/index';

describe('RocketchatExtension', () => {
  test('manifest is valid', () => {
    expect(rocketchatManifest.name).toBe('rocketchat');
    expect(rocketchatManifest.version).toBe('2.0.0');
    expect(rocketchatManifest.capabilities?.channels).toBe(true);
  });

  test('validation passes', () => {
    const result = validateRocketchatPlugin();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('tools are defined', () => {
    expect(rocketchatTools).toHaveLength(2);
    expect(rocketchatTools[0].name).toBe('send_message');
    expect(rocketchatTools[1].name).toBe('get_channel_info');
  });

  test('send_message validates required fields and max length', () => {
    const tool = rocketchatTools[0];
    expect(tool.contract.validate({ room_id: '123', text: 'hello' })).toBe(true);
    expect(tool.contract.validate({ room_id: '123', text: 'x'.repeat(25001) })).toBe(false);
    expect(tool.contract.validate({ room_id: '123' })).toBe(false);
  });

  test('get_channel_info validates required room_id field', () => {
    const tool = rocketchatTools[1];
    expect(tool.contract.validate({ room_id: '123' })).toBe(true);
    expect(tool.contract.validate({})).toBe(false);
  });
});