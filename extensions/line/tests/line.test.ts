import { describe, test, expect } from 'vitest';
import { lineManifest, lineTools, validateLinePlugin } from '../src/index';

describe('LineExtension', () => {
  test('manifest is valid', () => {
    expect(lineManifest.name).toBe('line');
    expect(lineManifest.version).toBe('2.0.0');
    expect(lineManifest.capabilities?.channels).toBe(true);
  });

  test('validation passes', () => {
    const result = validateLinePlugin();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('tools are defined', () => {
    expect(lineTools).toHaveLength(2);
    expect(lineTools[0].name).toBe('send_message');
    expect(lineTools[1].name).toBe('get_channel_info');
  });

  test('send_message validates required fields and max length', () => {
    const tool = lineTools[0];
    expect(tool.contract.validate({ to: '123', text: 'hello' })).toBe(true);
    expect(tool.contract.validate({ to: '123', text: 'x'.repeat(10001) })).toBe(false);
    expect(tool.contract.validate({ to: '123' })).toBe(false);
  });

  test('get_channel_info validates required to field', () => {
    const tool = lineTools[1];
    expect(tool.contract.validate({ to: '123' })).toBe(true);
    expect(tool.contract.validate({})).toBe(false);
  });
});