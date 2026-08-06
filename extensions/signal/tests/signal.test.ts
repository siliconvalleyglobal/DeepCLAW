import { describe, test, expect } from 'vitest';
import { signalManifest, signalTools, validateSignalPlugin } from '../src/index';

describe('SignalExtension', () => {
  test('manifest is valid', () => {
    expect(signalManifest.name).toBe('signal');
    expect(signalManifest.version).toBe('2.0.0');
    expect(signalManifest.capabilities?.channels).toBe(true);
  });

  test('validation passes', () => {
    const result = validateSignalPlugin();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('tools are defined', () => {
    expect(signalTools).toHaveLength(2);
    expect(signalTools[0].name).toBe('send_message');
    expect(signalTools[1].name).toBe('get_channel_info');
  });

  test('send_message validates required fields and max length', () => {
    const tool = signalTools[0];
    expect(tool.contract.validate({ recipient: '123', text: 'hello' })).toBe(true);
    expect(tool.contract.validate({ recipient: '123', text: 'x'.repeat(10001) })).toBe(false);
    expect(tool.contract.validate({ recipient: '123' })).toBe(false);
  });

  test('get_channel_info validates required recipient field', () => {
    const tool = signalTools[1];
    expect(tool.contract.validate({ recipient: '123' })).toBe(true);
    expect(tool.contract.validate({})).toBe(false);
  });
});