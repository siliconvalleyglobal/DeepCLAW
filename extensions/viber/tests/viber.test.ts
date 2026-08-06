import { describe, test, expect } from 'vitest';
import { viberManifest, viberTools, validateViberPlugin } from '../src/index';

describe('ViberExtension', () => {
  test('manifest is valid', () => {
    expect(viberManifest.name).toBe('viber');
    expect(viberManifest.version).toBe('2.0.0');
    expect(viberManifest.capabilities?.channels).toBe(true);
  });

  test('validation passes', () => {
    const result = validateViberPlugin();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('tools are defined', () => {
    expect(viberTools).toHaveLength(2);
    expect(viberTools[0].name).toBe('send_message');
    expect(viberTools[1].name).toBe('get_channel_info');
  });

  test('send_message validates required fields and max length', () => {
    const tool = viberTools[0];
    expect(tool.contract.validate({ to: '123', text: 'hello' })).toBe(true);
    expect(tool.contract.validate({ to: '123', text: 'x'.repeat(1001) })).toBe(false);
    expect(tool.contract.validate({ to: '123' })).toBe(false);
  });

  test('get_channel_info validates required to field', () => {
    const tool = viberTools[1];
    expect(tool.contract.validate({ to: '123' })).toBe(true);
    expect(tool.contract.validate({})).toBe(false);
  });
});